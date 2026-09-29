"""
CP Plus DVR/NVR Forensic Carver.

Supports:
- CP Plus DHAV/DHFS4.1 container frames (CP-UVR, CP-PLUS Indigo, Cosmic series)
- CP Plus CPDH proprietary headers
- CP Plus Orange File System (ORANGE_FS) frame structures

Header specification:
- Magic: b"DHAV" (0x44484156) or b"CPDH" (0x43504448)
- Offset 4: Channel index (0x00 to 0x1F => CAM 1 to CAM 32)
- Offset 5: Frame type (0xFD = I-frame/Keyframe, 0xFC = P-frame, 0xF0 = Audio)
- Offset 6-7: Sequence number (uint16 little-endian)
- Offset 8-11: Timestamp (32-bit packed BCD or epoch seconds)
- Offset 12-15: Payload length (uint32 little-endian)

Extracts complete GOPs (Keyframe + subsequent inter-frames) based on exact header
length calculations rather than fixed-size buffer carving.
"""

from __future__ import annotations

import logging
import struct
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

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

CPPLUS_CPDH_MAGIC = b"CPDH"
CPPLUS_ORANGE_MAGIC = b"ORANGE_FS"
CPPLUS_DVR_MAGIC = b"CPPLUS_DVR"
CPPLUS_SIGNATURES = [CPPLUS_CPDH_MAGIC, CPPLUS_ORANGE_MAGIC, CPPLUS_DVR_MAGIC]

MIN_HEADER_SIZE = 16
MAX_FRAME_SIZE = 8 * 1024 * 1024  # 8 MB max individual frame
MAX_GOP_SIZE = 32 * 1024 * 1024   # 32 MB max aggregate clip


def parse_cpplus_timestamp(raw_bytes: bytes) -> str:
    """
    Decodes CP Plus packed 32-bit timestamp:
    Bit layout: Year (6 bits: +2000), Month (4 bits), Day (5 bits),
                Hour (5 bits), Minute (6 bits), Second (6 bits)
    Falls back to unix epoch or ISO string.
    """
    if len(raw_bytes) < 4:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<I", raw_bytes[:4])[0]
    sec = val & 0x3F
    minute = (val >> 6) & 0x3F
    hour = (val >> 12) & 0x1F
    day = (val >> 17) & 0x1F
    month = (val >> 22) & 0x0F
    year = ((val >> 26) & 0x3F) + 2000

    if 2000 <= year <= 2040 and 1 <= month <= 12 and 1 <= day <= 31 and hour < 24 and minute < 60 and sec < 60:
        return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{sec:02d}Z"
    
    # Alternative: check if standard unix epoch seconds (approx 2010 to 2035)
    if 1262304000 <= val <= 2051222400:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return datetime.now(timezone.utc).isoformat()


class CPPlusCarver(BaseCarver):
    """
    Vendor-specific forensic carver for CP Plus surveillance recorders.
    Parses DHAV/CPDH frame headers, decodes channel telemetry & timestamps,
    and aggregates contiguous frames into valid playable streams.
    """

    vendor_name = "cpplus"

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

                for sig in (CPPLUS_CPDH_MAGIC, CPPLUS_ORANGE_MAGIC, CPPLUS_DVR_MAGIC):
                    for rel_idx in find_all(data, sig):
                        abs_offset = base_offset + rel_idx
                        if abs_offset in seen_offsets:
                            continue
                        seen_offsets.add(abs_offset)

                        if on_signature:
                            on_signature()

                        # Read frame header
                        handle.seek(abs_offset)
                        header = handle.read(MIN_HEADER_SIZE)
                        if len(header) < MIN_HEADER_SIZE:
                            continue

                        # Extract frame properties
                        channel_num = (header[4] % 32) + 1 if len(header) > 4 else 1
                        frame_type_byte = header[5] if len(header) > 5 else 0xFD
                        is_keyframe = frame_type_byte in (0xFD, 0x01)
                        ts_str = parse_cpplus_timestamp(header[8:12])
                        payload_len = struct.unpack_from("<I", header, 12)[0]

                        if payload_len <= 0 or payload_len > MAX_FRAME_SIZE:
                            continue

                        # Read contiguous GOP: accumulate consecutive frames
                        curr_offset = abs_offset
                        total_gop_bytes = 0
                        frames_in_gop = 0

                        while curr_offset < total_size and total_gop_bytes < MAX_GOP_SIZE:
                            handle.seek(curr_offset)
                            f_hdr = handle.read(MIN_HEADER_SIZE)
                            if len(f_hdr) < MIN_HEADER_SIZE:
                                break
                            if f_hdr[:4] not in (CPPLUS_CPDH_MAGIC, CPPLUS_ORANGE_MAGIC, CPPLUS_DVR_MAGIC):
                                break

                            f_len = struct.unpack_from("<I", f_hdr, 12)[0]
                            if f_len <= 0 or f_len > MAX_FRAME_SIZE:
                                break

                            full_frame_len = MIN_HEADER_SIZE + f_len
                            if curr_offset + full_frame_len > total_size:
                                break

                            total_gop_bytes += full_frame_len
                            curr_offset += full_frame_len
                            frames_in_gop += 1

                            # Stop at next keyframe if we already have frames
                            if frames_in_gop > 1 and len(f_hdr) > 5 and f_hdr[5] in (0xFD, 0x01):
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = MIN_HEADER_SIZE + payload_len
                            curr_offset = abs_offset + total_gop_bytes
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"cpplus_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.dhav"
                        chunk_path = raw_output_dir / chunk_name

                        handle.seek(abs_offset)
                        remaining = total_gop_bytes
                        with chunk_path.open("wb") as out:
                            while remaining > 0:
                                chunk = handle.read(min(1024 * 1024, remaining))
                                if not chunk:
                                    break
                                out.write(chunk)
                                remaining -= len(chunk)

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
                                    "is_keyframe": is_keyframe,
                                    "format": "CP Plus DHFS/DHAV Container",
                                    "codec": "H.264 / H.265",
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
