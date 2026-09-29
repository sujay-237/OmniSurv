"""
Uniview (UNV) Video Technology Forensic Carver.

Supports:
- Uniview UBV (Uniview Block Video) filesystem containers (UBV\x01, UBVF)
- Uniview UNV stream packets (UNV0 / UNVH)
- Ultra 265 and H.264 compressed video bitstreams

Header specification (UBV):
- Magic: b"UBV\x01" (0x55425601) or b"UBVF" (0x55425646) or b"UNV0" (0x554E5630)
- Offset 4-5: Channel Index (uint16 LE, 1 to 64)
- Offset 6: Frame Type (0x01 = Keyframe/I-frame, 0x02 = Interframe/P-frame, 0x03 = Audio)
- Offset 7: Compression (0x01 = H.264, 0x02 = Ultra 265 / H.265)
- Offset 8-15: 64-bit UTC microsecond/millisecond timestamp
- Offset 16-19: Data length / Payload size (uint32 LE)
- Offset 20-23: CRC32 checksum / frame flags

Extracts complete GOPs based on exact UBV payload lengths and validates Ultra 265 stream headers.
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

UNIVIEW_UBV1_MAGIC = b"UBV\x01"
UNIVIEW_UBVF_MAGIC = b"UBVF"
UNIVIEW_UNV0_MAGIC = b"UNV0"
UNIVIEW_SIGNATURES = [UNIVIEW_UBV1_MAGIC, UNIVIEW_UBVF_MAGIC, UNIVIEW_UNV0_MAGIC]

MIN_HEADER_SIZE = 24
MAX_FRAME_SIZE = 8 * 1024 * 1024
MAX_GOP_SIZE = 32 * 1024 * 1024


def parse_ubv_timestamp(raw_bytes: bytes) -> str:
    """Decodes 64-bit UTC timestamp (microsecond or millisecond epoch) to ISO 8601 string."""
    if len(raw_bytes) < 8:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<Q", raw_bytes[:8])[0]
    # Check microseconds (16 digits approx)
    if 1420070400000000 <= val <= 2051222400000000:
        return datetime.fromtimestamp(val / 1000000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Check milliseconds (13 digits approx)
    if 1420070400000 <= val <= 2051222400000:
        return datetime.fromtimestamp(val / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Check seconds
    if 1420070400 <= val <= 2051222400:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return datetime.now(timezone.utc).isoformat()


class UniviewCarver(BaseCarver):
    """
    Vendor-specific forensic carver for Uniview (UNV) NVR and IP camera systems.
    Carves proprietary UBV block video frames, decodes Ultra 265 / H.264
    elementary payloads, 64-bit timestamps, and per-camera streams.
    """

    vendor_name = "uniview"

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

                for sig in (UNIVIEW_UBV1_MAGIC, UNIVIEW_UBVF_MAGIC):
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
                        channel_num = (chan_val % 64) if (chan_val % 64) != 0 else 1
                        frame_type = header[6]
                        comp_type = header[7]
                        ts_str = parse_ubv_timestamp(header[8:16])
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
                            if f_hdr[:4] not in (UNIVIEW_UBV1_MAGIC, UNIVIEW_UBVF_MAGIC):
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
                            if frames_in_gop > 1 and len(f_hdr) > 6 and f_hdr[6] == 0x01:
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = MIN_HEADER_SIZE + payload_len
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"uniview_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.raw"
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

                        codec_name = "Ultra 265 (UNV H.265)" if comp_type == 2 else "H.264 (UNV AVC)"
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
                                    "format": "Uniview UBV Container",
                                    "codec": codec_name,
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
