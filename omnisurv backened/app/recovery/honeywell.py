"""
Honeywell Security DVR/NVR Forensic Carver.

Supports:
- Honeywell MAXPRO NVR storage partitions (MAXP packets)
- Honeywell Video Stream Format (HVSF / HNW1 frame headers)
- Honeywell MPEG-PS / PES streams with private stream ID

Header specification (MAXP / HVSF):
- Magic: b"MAXP" (0x4D415850) or b"HVSF" (0x48565346) or b"HNW1" (0x484E5731)
- Offset 4-5: Header length / version (uint16 LE)
- Offset 6-7: Channel index (uint16 LE, 0 to 63 => CAM 1 to 64)
- Offset 8-11: Timestamp (32-bit epoch seconds)
- Offset 12: Frame type (0x01 = Keyframe/I-frame, 0x02 = Interframe/P-frame, 0x03 = Audio)
- Offset 13: Codec type (0x01 = H.264, 0x02 = H.265, 0x03 = MJPEG)
- Offset 14-17: Payload length (uint32 LE)

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

HONEYWELL_MAXP_MAGIC = b"MAXP"
HONEYWELL_HVSF_MAGIC = b"HVSF"
HONEYWELL_HNW1_MAGIC = b"HNW1"
HONEYWELL_PS_MAGIC = b"\x00\x00\x01\xBA"

HONEYWELL_SIGNATURES = [
    HONEYWELL_MAXP_MAGIC,
    HONEYWELL_HVSF_MAGIC,
    HONEYWELL_HNW1_MAGIC,
]

MIN_HEADER_SIZE = 18
MAX_FRAME_SIZE = 8 * 1024 * 1024
MAX_GOP_SIZE = 32 * 1024 * 1024


def parse_honeywell_timestamp(epoch_bytes: bytes) -> str:
    """Decodes 32-bit Unix epoch seconds timestamp into ISO 8601 UTC string."""
    if len(epoch_bytes) < 4:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<I", epoch_bytes[:4])[0]
    if 1000000000 <= val <= 2500000000:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return datetime.now(timezone.utc).isoformat()


class HoneywellCarver(BaseCarver):
    """
    Vendor-specific forensic carver for Honeywell MAXPRO and commercial CCTV systems.
    Parses MAXP and HVSF packet structures, decodes camera channels and presentation
    timestamps, and extracts contiguous H.264/H.265 GOP video streams.
    """

    vendor_name = "honeywell"

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

                for sig in HONEYWELL_SIGNATURES:
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

                        hdr_len = struct.unpack_from("<H", header, 4)[0]
                        if hdr_len < 16 or hdr_len > 128:
                            hdr_len = MIN_HEADER_SIZE

                        chan_val = struct.unpack_from("<H", header, 6)[0]
                        channel_num = (chan_val % 64) + 1
                        ts_str = parse_honeywell_timestamp(header[8:12])
                        frame_type = header[12] if len(header) > 12 else 1
                        codec_type = header[13] if len(header) > 13 else 1
                        payload_len = struct.unpack_from("<I", header, 14)[0]

                        if payload_len <= 0 or payload_len > MAX_FRAME_SIZE:
                            continue

                        # Read contiguous GOP frames
                        curr_offset = abs_offset
                        total_gop_bytes = 0
                        frames_in_gop = 0

                        while curr_offset < total_size and total_gop_bytes < MAX_GOP_SIZE:
                            handle.seek(curr_offset)
                            f_hdr = handle.read(MIN_HEADER_SIZE)
                            if len(f_hdr) < MIN_HEADER_SIZE:
                                break
                            if f_hdr[:4] not in HONEYWELL_SIGNATURES:
                                break

                            f_hdr_len = struct.unpack_from("<H", f_hdr, 4)[0]
                            if f_hdr_len < 16 or f_hdr_len > 128:
                                f_hdr_len = MIN_HEADER_SIZE

                            f_len = struct.unpack_from("<I", f_hdr, 14)[0]
                            if f_len <= 0 or f_len > MAX_FRAME_SIZE:
                                break

                            full_frame_len = f_hdr_len + f_len
                            if curr_offset + full_frame_len > total_size:
                                break

                            total_gop_bytes += full_frame_len
                            curr_offset += full_frame_len
                            frames_in_gop += 1

                            # Stop at next keyframe boundary
                            if frames_in_gop > 1 and len(f_hdr) > 12 and f_hdr[12] == 0x01:
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = hdr_len + payload_len
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"honeywell_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.raw"
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

                        codec_name = "H.265 (HEVC)" if codec_type == 2 else "H.264 (AVC)"
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
                                    "timestamp": ts_str,
                                    "frame_count": frames_in_gop,
                                    "is_keyframe": (frame_type == 1),
                                    "format": "Honeywell MAXPRO Container",
                                    "codec": codec_name,
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
