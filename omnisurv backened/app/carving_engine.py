"""
Forensic carving orchestration: buffered scan, remux, hash, optional AI.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any

from app.ai_service import analyze_clip_with_ai, format_ai_event_log
from app.config import MP4_CLIPS_DIR, RAW_CHUNKS_DIR
from app.ffmpeg_service import remux_h264_to_mp4
from app.hash_utils import stream_sha256
from app.key_manager import KeyRotator
from app.progress_registry import ensure_progress, increment_clips, increment_signatures, update_scan
from app.recovery.base import CarvedCandidate, ParseStatus
from app.recovery.factory import VideoCarverFactory

logger = logging.getLogger(__name__)


def _remux_candidate(
    candidate: CarvedCandidate,
    evidence_id: str,
) -> dict[str, Any] | None:
    if candidate.parsing_status != ParseStatus.EXTRACTED:
        logger.info(
            "Skipping remux for %s candidate %s (%s)",
            candidate.vendor,
            candidate.clip_index,
            candidate.parsing_status.value,
        )
        return None

    if not candidate.raw_chunk_path or not Path(candidate.raw_chunk_path).is_file():
        return None

    mp4_name = (
        f"{evidence_id}_{candidate.vendor}_clip_{candidate.clip_index:04d}_"
        f"{candidate.offset_start}.mp4"
    )
    mp4_path = MP4_CLIPS_DIR / mp4_name

    if candidate.vendor in ("dahua", "cpplus"):
        ffmpeg_result = remux_h264_to_mp4(
            candidate.raw_chunk_path,
            mp4_path,
            input_format="dhav",
        )
        if not ffmpeg_result.success:
            ffmpeg_result = remux_h264_to_mp4(
                candidate.raw_chunk_path,
                mp4_path,
                input_format="h264",
            )
    else:
        ffmpeg_result = remux_h264_to_mp4(
            candidate.raw_chunk_path,
            mp4_path,
            input_format="h264",
        )

    if not ffmpeg_result.success or not ffmpeg_result.output_path:
        logger.warning(
            "FFmpeg failed evidence=%s vendor=%s offset=%s stderr=%s",
            evidence_id,
            candidate.vendor,
            candidate.offset_start,
            (ffmpeg_result.stderr or "")[:500],
        )
        return None

    output_file = Path(ffmpeg_result.output_path)
    if not output_file.is_file():
        logger.warning(
            "FFmpeg reported success but output missing: %s", output_file
        )
        return None

    sha256 = stream_sha256(output_file)
    size_bytes = output_file.stat().st_size
    mp4_name = output_file.name

    return {
        "clip_index": candidate.clip_index,
        "vendor": candidate.vendor,
        "offset_start": candidate.offset_start,
        "offset_end": candidate.offset_end,
        "mp4_filename": mp4_name,
        "mp4_path": str(output_file.resolve()),
        "sha256": sha256,
        "size_bytes": size_bytes,
        "detection_signature": candidate.signature,
        "raw_chunk_path": candidate.raw_chunk_path,
        "parsing_status": candidate.parsing_status.value,
        "camera_id": candidate.metadata.get("camera_id", "CAM_1"),
        "timestamp": candidate.metadata.get("timestamp"),
    }


def process_image(
    file_path: str,
    key_rotator: KeyRotator,
    *,
    evidence_id: str | None = None,
    enable_ai: bool = True,
) -> list[dict[str, Any]]:
    """
    Scan a read-only disk image, remux recoverable segments, hash, optional AI.

    Returns clip metadata dicts suitable for database_service.save_recovered_clip.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Evidence file not found: {file_path}")

    evidence_id = evidence_id or str(uuid.uuid4())
    raw_dir = RAW_CHUNKS_DIR / evidence_id
    raw_dir.mkdir(parents=True, exist_ok=True)
    MP4_CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    total_size = path.stat().st_size
    signatures_found = 0

    prog = ensure_progress(evidence_id, status="PROCESSING")
    prog.start_scanning(total_size)

    def on_progress(scanned: int, total: int) -> None:
        update_scan(evidence_id, scanned, signatures_found=signatures_found)

    def on_signature() -> None:
        nonlocal signatures_found
        signatures_found += 1
        increment_signatures(evidence_id, 1)

    carvers = VideoCarverFactory.default_scan_carvers()
    all_candidates: list[CarvedCandidate] = []
    successful_carver_count = 0
    carver_errors: list[str] = []

    for carver in carvers:
        logger.info("Running carver %s on %s", carver.vendor_name, path.name)
        try:
            found = carver.scan_image(
                path,
                raw_dir,
                on_progress=on_progress,
                on_signature=on_signature,
            )
            all_candidates.extend(found)
            successful_carver_count += 1
        except Exception as exc:
            logger.exception("Carver %s failed", carver.vendor_name)
            carver_errors.append(f"{carver.vendor_name}: {exc}")

    if carvers and successful_carver_count == 0:
        raise RuntimeError(
            f"All configured carvers failed for evidence {evidence_id}: {'; '.join(carver_errors)}"
        )

    update_scan(evidence_id, total_size, signatures_found=signatures_found)

    seen_spans: set[tuple[int, int]] = set()
    deduped_candidates: list[CarvedCandidate] = []
    for cand in all_candidates:
        span = (cand.offset_start, cand.offset_end)
        if span in seen_spans:
            continue
        seen_spans.add(span)
        deduped_candidates.append(cand)

    recovered_clips: list[dict[str, Any]] = []
    for candidate in deduped_candidates:
        clip_meta = _remux_candidate(candidate, evidence_id)
        if clip_meta is None:
            continue

        if enable_ai:
            try:
                ai_result = analyze_clip_with_ai(
                    clip_meta["mp4_path"],
                    key_rotator,
                )
                clip_meta["ai_event_log"] = format_ai_event_log(ai_result)
                clip_meta["ai_metadata"] = ai_result
            except Exception as exc:
                logger.warning("AI pipeline error (clip preserved): %s", exc)
                clip_meta["ai_event_log"] = f"AI pipeline error: {exc}"
        else:
            clip_meta["ai_event_log"] = "AI disabled for this run."

        recovered_clips.append(clip_meta)
        increment_clips(evidence_id, 1)
        logger.info(
            "Recovered clip evidence=%s vendor=%s offsets=%s-%s sha256=%s",
            evidence_id,
            clip_meta["vendor"],
            clip_meta["offset_start"],
            clip_meta["offset_end"],
            clip_meta["sha256"],
        )

    return recovered_clips
