"""
Dahua DHAV frame carving.

Signature: 44 48 41 56 ("DHAV")

Payload length assumption (not fully documented in-repo):
  little-endian uint32 at byte offset 12 from the DHAV marker start,
  spanning bytes [12:16) of the frame header. Total frame size =
  16 (assumed minimum header) + payload_length, capped by max_frame_bytes.

This layout is isolated here and covered by unit tests; adjust DahuaHeaderConfig
when vendor documentation confirms a different layout.
"""

from __future__ import annotations

import logging
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from app.config import SCAN_BUFFER_OVERLAP, SCAN_BUFFER_SIZE
from app.recovery.base import (
    BaseCarver,
    CarvedCandidate,
    ParseStatus,
    ScanProgressCallback,
    find_all,
    iter_image_buffers,
)

logger = logging.getLogger(__name__)

DHAV_SIGNATURE = b"DHAV"
DEFAULT_MIN_HEADER = 16


@dataclass(frozen=True)
class DahuaHeaderConfig:
    length_field_offset: int = 12
    length_field_size: int = 4
    length_includes_header: bool = False
    min_header_bytes: int = DEFAULT_MIN_HEADER
    max_frame_bytes: int = 8 * 1024 * 1024


class DahuaCarver(BaseCarver):
    vendor_name = "dahua"

    def __init__(self, config: DahuaHeaderConfig | None = None) -> None:
        self._config = config or DahuaHeaderConfig()

    def _frame_length_at(self, handle, absolute_offset: int) -> int | None:
        cfg = self._config
        read_len = max(cfg.min_header_bytes, cfg.length_field_offset + cfg.length_field_size)
        handle.seek(absolute_offset)
        header = handle.read(read_len)
        if len(header) < cfg.length_field_offset + cfg.length_field_size:
            return None
        if header[:4] != DHAV_SIGNATURE:
            return None

        payload_len = struct.unpack_from("<I", header, cfg.length_field_offset)[0]
        if payload_len <= 0 or payload_len > cfg.max_frame_bytes:
            return None

        if cfg.length_includes_header:
            total = payload_len
        else:
            total = cfg.min_header_bytes + payload_len

        if total <= 0 or total > cfg.max_frame_bytes:
            return None
        return total

    def scan_image(
        self,
        file_path: Path,
        raw_output_dir: Path,
        *,
        on_progress: ScanProgressCallback | None = None,
        on_signature: Callable[[], None] | None = None,
    ) -> list[CarvedCandidate]:
        raw_output_dir.mkdir(parents=True, exist_ok=True)
        results: list[CarvedCandidate] = []
        clip_index = 0
        total_size = file_path.stat().st_size

        with file_path.open("rb") as handle:
            seen_offsets: set[int] = set()
            for base_offset, data in iter_image_buffers(
                handle, SCAN_BUFFER_SIZE, SCAN_BUFFER_OVERLAP
            ):
                if on_progress:
                    on_progress(min(base_offset + len(data), total_size), total_size)

                for rel_idx in find_all(data, DHAV_SIGNATURE):
                    abs_offset = base_offset + rel_idx
                    if abs_offset in seen_offsets:
                        continue
                    seen_offsets.add(abs_offset)

                    if on_signature:
                        on_signature()

                    frame_len = self._frame_length_at(handle, abs_offset)
                    if frame_len is None:
                        logger.debug(
                            "DHAV at %s: could not derive frame length (assumption mismatch?)",
                            abs_offset,
                        )
                        continue

                    offset_end = abs_offset + frame_len
                    if offset_end > total_size:
                        logger.debug(
                            "DHAV frame at %s extends past EOF; skipping", abs_offset
                        )
                        continue

                    clip_index += 1
                    chunk_name = (
                        f"{file_path.stem}_dahua_{clip_index}_"
                        f"{abs_offset}_{offset_end}.dhav"
                    )
                    chunk_path = raw_output_dir / chunk_name

                    handle.seek(abs_offset)
                    remaining = frame_len
                    with chunk_path.open("wb") as out:
                        while remaining > 0:
                            block = handle.read(min(1024 * 1024, remaining))
                            if not block:
                                break
                            out.write(block)
                            remaining -= len(block)

                    size = chunk_path.stat().st_size
                    results.append(
                        CarvedCandidate(
                            vendor=self.vendor_name,
                            clip_index=clip_index,
                            offset_start=abs_offset,
                            offset_end=offset_end,
                            raw_chunk_path=str(chunk_path.resolve()),
                            size=size,
                            signature=DHAV_SIGNATURE.hex(),
                            parsing_status=ParseStatus.EXTRACTED,
                            metadata={"header_config": self._config.__dict__},
                        )
                    )

        return results
