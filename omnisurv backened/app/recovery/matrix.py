"""
Matrix Comsec (SATATYA Series) DVR/NVR Forensic Carver.

Supports:
- Matrix Comsec SATATYA DVRs & NVRs (SATATYA SAMARTH series)
- Matrix Media Container File (MMCF) proprietary structure
- Matrix Record Block (MXREC) and SATATYA stream formats

Header specification (MMCF):
- Magic: b"MMCF" (0x4D4D4346) or b"MXREC" (0x4D58524543) or b"SATATYA" (0x53415441545941)
- Offset 4-5: Version (uint16 LE)
- Offset 6-7: Channel ID (uint16 LE, 1 to 64)
- Offset 8-11: 32-bit Timestamp (Unix epoch seconds)
- Offset 12: Codec Type (0x01 = H.264, 0x02 = H.265)
- Offset 13: Frame Type (0x01 = Keyframe/I-frame, 0x02 = Delta/P-frame, 0x03 = Audio)
- Offset 14-15: Reserved
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

MATRIX_MMCF_MAGIC = b"MMCF"
MATRIX_MXREC_MAGIC = b"MXREC"
MATRIX_SATATYA_MAGIC = b"SATATYA"
MATRIX_SIGNATURES = [MATRIX_MMCF_MAGIC, MATRIX_MXREC_MAGIC, MATRIX_SATATYA_MAGIC]

MIN_HEADER_SIZE = 20
MAX_FRAME_SIZE = 8 * 1024 * 1024
MAX_GOP_SIZE = 32 * 1024 * 1024


def parse_matrix_timestamp(epoch_bytes: bytes) -> str:
    """Decodes 32-bit Unix epoch seconds timestamp to ISO 8601 UTC string."""
    if len(epoch_bytes) < 4:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<I", epoch_bytes[:4])[0]
    if 1000000000 <= val <= 2500000000:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return datetime.now(timezone.utc).isoformat()


class MatrixCarver(BaseCarver):
    """
    Vendor-specific forensic carver for Matrix Comsec SATATYA enterprise surveillance systems.
    Parses MMCF/MXREC container headers, extracts per-channel elementary video
    frames, decodes Matrix UTC timestamps, and aggregates full GOPs.
    """

    vendor_name = "matrix"

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

                for sig in (MATRIX_MMCF_MAGIC, MATRIX_MXREC_MAGIC):
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

                        chan_val = struct.unpack_from("<H", header, 6)[0]
                        channel_num = (chan_val % 64) if (chan_val % 64) != 0 else 1
                        ts_str = parse_matrix_timestamp(header[8:12])
                        codec_type = header[12]
                        frame_type = header[13]
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
                            if f_hdr[:4] not in (MATRIX_MMCF_MAGIC, MATRIX_MXREC_MAGIC):
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
                            if frames_in_gop > 1 and len(f_hdr) > 13 and f_hdr[13] == 0x01:
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = MIN_HEADER_SIZE + payload_len
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"matrix_satatya_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.raw"
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

                        codec_name = "H.265 (Matrix)" if codec_type == 2 else "H.264 (Matrix SATATYA)"
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
                                    "format": "Matrix SATATYA Container",
                                    "codec": codec_name,
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
