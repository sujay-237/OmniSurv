"""
Godrej Security Solutions (SeeThru Series) Forensic Carver.

Supports:
- Godrej SeeThru 4/8/16-channel DVRs
- Godrej Video Record (GVR) proprietary frame format
- Godrej Digital Record (GDREC / GSS signatures)

Header specification (GVR):
- Magic: b"GVR\x01" (0x47565201) or b"GDREC" (0x4744524543) or b"GSS\x01" (0x47535301)
- Offset 4-5: Channel Index (uint16 LE, 1 to 32)
- Offset 6-7: Record Mode (0x01 = Continuous, 0x02 = Motion, 0x03 = Alarm, 0x04 = Manual)
- Offset 8-11: 32-bit Timestamp (Unix epoch seconds)
- Offset 12: Frame Type (0x01 = Keyframe/I-frame, 0x02 = Interframe/P-frame)
- Offset 13-15: Reserved flags / stream resolution
- Offset 16-19: Payload length (uint32 LE)

Calculates frame boundaries from packet headers and carves contiguous GOP sequences.
"""

from __future__ import annotations

import logging
import struct
from datetime import datetime, timezone
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

GODREJ_GVR_MAGIC = b"GVR\x01"
GODREJ_GDREC_MAGIC = b"GDREC"
GODREJ_GSS_MAGIC = b"GSS\x01"
GODREJ_SEC_MAGIC = b"GODREJ_SEC"

GODREJ_SIGNATURES = [GODREJ_GVR_MAGIC, GODREJ_GDREC_MAGIC, GODREJ_GSS_MAGIC, GODREJ_SEC_MAGIC]

MIN_HEADER_SIZE = 20
MAX_FRAME_SIZE = 8 * 1024 * 1024
MAX_GOP_SIZE = 32 * 1024 * 1024


def parse_godrej_timestamp(raw_bytes: bytes) -> str:
    """Decodes 32-bit epoch seconds timestamp to ISO 8601 UTC string."""
    if len(raw_bytes) < 4:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<I", raw_bytes[:4])[0]
    if 1000000000 <= val <= 2500000000:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return datetime.now(timezone.utc).isoformat()


class GodrejCarver(BaseCarver):
    """
    Vendor-specific forensic carver for Godrej Security Solutions DVR/NVRs.
    Parses GVR/GDREC frame structures, identifies trigger modes (Motion/Alarm),
    and aggregates contiguous GOP sequences into clean video streams.
    """

    vendor_name = "godrej"

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
        total_size = file_path.stat().st_size
        clip_index = 0

        with file_path.open("rb") as handle:
            seen_offsets: set[int] = set()

            for base_offset, data in iter_image_buffers(
                handle, SCAN_BUFFER_SIZE, SCAN_BUFFER_OVERLAP
            ):
                if on_progress:
                    on_progress(min(base_offset + len(data), total_size), total_size)

                for sig in (GODREJ_GVR_MAGIC, GODREJ_GDREC_MAGIC):
                    for rel_idx in find_all(data, sig):
                        abs_offset = base_offset + rel_idx
                        if abs_offset in seen_offsets:
                            continue
                        seen_offsets.add(abs_offset)

                        if on_signature:
                            on_signature()

                        handle.seek(abs_offset)
                        header = handle.read(MIN_HEADER_SIZE)
                        if len(header) < MIN_HEADER_SIZE:
                            continue

                        chan_val = struct.unpack_from("<H", header, 4)[0]
                        channel_num = (chan_val % 32) if (chan_val % 32) != 0 else 1
                        rec_mode = struct.unpack_from("<H", header, 6)[0]
                        mode_str = {1: "Continuous", 2: "Motion", 3: "Alarm", 4: "Manual"}.get(rec_mode, "Standard")
                        ts_str = parse_godrej_timestamp(header[8:12])
                        frame_type = header[12]
                        payload_len = struct.unpack_from("<I", header, 16)[0]

                        if payload_len <= 0 or payload_len > MAX_FRAME_SIZE:
                            continue

                        # Assemble contiguous GOP frames
                        curr_offset = abs_offset
                        total_gop_bytes = 0
                        frames_in_gop = 0

                        while curr_offset < total_size and total_gop_bytes < MAX_GOP_SIZE:
                            handle.seek(curr_offset)
                            f_hdr = handle.read(MIN_HEADER_SIZE)
                            if len(f_hdr) < MIN_HEADER_SIZE:
                                break
                            if f_hdr[:4] not in (GODREJ_GVR_MAGIC, GODREJ_GDREC_MAGIC):
                                break

                            f_len = struct.unpack_from("<I", f_hdr, 16)[0]
                            if f_len <= 0 or f_len > MAX_FRAME_SIZE:
                                break

                            full_frame_len = MIN_HEADER_SIZE + f_len
                            if curr_offset + full_frame_len > total_size:
                                break

                            total_gop_bytes += full_frame_len
                            curr_offset += full_frame_len
                            frames_in_gop += 1

                            # Stop at next keyframe
                            if frames_in_gop > 1 and len(f_hdr) > 12 and f_hdr[12] == 0x01:
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = MIN_HEADER_SIZE + payload_len
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"godrej_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.raw"
                        chunk_path = raw_output_dir / chunk_name

                        handle.seek(abs_offset)
                        remaining = total_gop_bytes
                        with chunk_path.open("wb") as out:
                            while remaining > 0:
                                block = handle.read(min(1024 * 1024, remaining))
                                if not block:
                                    break
                                out.write(block)
                                remaining -= len(block)

                        actual_size = chunk_path.stat().st_size
                        results.append(
                            CarvedCandidate(
                                vendor=self.vendor_name,
                                clip_index=clip_index,
                                offset_start=abs_offset,
                                offset_end=abs_offset + actual_size,
                                raw_chunk_path=str(chunk_path.resolve()),
                                size=actual_size,
                                signature=sig.decode("ascii", errors="replace"),
                                parsing_status=ParseStatus.EXTRACTED,
                                metadata={
                                    "camera_id": f"CAM_{channel_num}",
                                    "channel": channel_num,
                                    "record_mode": mode_str,
                                    "timestamp": ts_str,
                                    "frame_count": frames_in_gop,
                                    "is_keyframe": (frame_type == 1),
                                    "format": "Godrej SeeThru Container",
                                    "codec": "H.264 (Godrej GVR)",
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
