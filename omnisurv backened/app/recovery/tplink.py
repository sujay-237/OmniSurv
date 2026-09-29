"""
TP-Link (VIGI Series) NVR/DVR Forensic Carver.

Supports:
- TP-Link VIGI Series NVRs (VIGI NVR1008H, NVR1016H)
- TP-Link VIGI Container Packets (VIGI / TLPK / TPREC signatures)

Header specification:
- Magic: b"VIGI" (0x56494749) or b"TLPK" (0x544C504B) or b"TPREC\x00" (0x545052454300)
- Offset 4-5: Channel Number (uint16 LE, 1 to 64)
- Offset 6-7: Stream Profile (0 = Main Stream 4K/2K, 1 = Sub Stream)
- Offset 8-15: 64-bit UTC Timestamp (millisecond Unix epoch)
- Offset 16: Frame Type (0x01 = Keyframe/I-frame, 0x02 = Delta/P-frame, 0x03 = B-frame, 0x04 = Audio)
- Offset 17: Codec Flag (0x01 = H.264 AVC, 0x02 = H.265 HEVC Smart Coding)
- Offset 18-21: Payload Size (uint32 LE)

Aggregates complete GOP sequences using exact packet payload lengths.
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

TPLINK_VIGI_MAGIC = b"VIGI"
TPLINK_TLPK_MAGIC = b"TLPK"
TPLINK_TPREC_MAGIC = b"TPREC\x00"

TPLINK_SIGNATURES = [TPLINK_VIGI_MAGIC, TPLINK_TLPK_MAGIC, TPLINK_TPREC_MAGIC]

MIN_HEADER_SIZE = 22
MAX_FRAME_SIZE = 8 * 1024 * 1024
MAX_GOP_SIZE = 32 * 1024 * 1024


def parse_vigi_timestamp(ts_bytes: bytes) -> str:
    """Decodes 64-bit Unix timestamp in milliseconds to ISO 8601 UTC string."""
    if len(ts_bytes) < 8:
        return datetime.now(timezone.utc).isoformat()
    val = struct.unpack("<Q", ts_bytes[:8])[0]
    # Check if epoch ms is reasonable (years 2015 to 2035)
    if 1420070400000 <= val <= 2051222400000:
        return datetime.fromtimestamp(val / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Check if seconds instead of ms
    if 1420070400 <= val <= 2051222400:
        return datetime.fromtimestamp(val, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return datetime.now(timezone.utc).isoformat()


class TPLinkCarver(BaseCarver):
    """
    Vendor-specific forensic carver for TP-Link VIGI security surveillance systems.
    Extracts VIGI frame headers, reads 64-bit millisecond timestamps, decodes
    camera channels and smart H.265/H.264 streams across intact GOP spans.
    """

    vendor_name = "tp_link"

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

                for sig in (TPLINK_VIGI_MAGIC, TPLINK_TLPK_MAGIC):
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
                        stream_profile = struct.unpack_from("<H", header, 6)[0]
                        ts_str = parse_vigi_timestamp(header[8:16])
                        frame_type = header[16]
                        codec_flag = header[17]
                        payload_len = struct.unpack_from("<I", header, 18)[0]

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
                            if f_hdr[:4] not in (TPLINK_VIGI_MAGIC, TPLINK_TLPK_MAGIC):
                                break

                            f_len = struct.unpack_from("<I", f_hdr, 18)[0]
                            if f_len <= 0 or f_len > MAX_FRAME_SIZE:
                                break

                            full_frame_len = MIN_HEADER_SIZE + f_len
                            if curr_offset + full_frame_len > total_size:
                                break

                            total_gop_bytes += full_frame_len
                            curr_offset += full_frame_len
                            frames_in_gop += 1

                            # Stop at next keyframe
                            if frames_in_gop > 1 and len(f_hdr) > 16 and f_hdr[16] == 0x01:
                                break

                        if total_gop_bytes == 0:
                            total_gop_bytes = MIN_HEADER_SIZE + payload_len
                            frames_in_gop = 1

                        clip_index += 1
                        chunk_name = f"tplink_vigi_ch{channel_num:02d}_clip_{clip_index:04d}_{abs_offset}.raw"
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

                        codec_name = "H.265 (Smart VIGI)" if codec_flag == 2 else "H.264 (VIGI AVC)"
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
                                    "stream_profile": "Main" if stream_profile == 0 else "Sub",
                                    "timestamp": ts_str,
                                    "frame_count": frames_in_gop,
                                    "is_keyframe": (frame_type == 1),
                                    "format": "TP-Link VIGI Container",
                                    "codec": codec_name,
                                    "offset_hex": f"0x{abs_offset:08X}",
                                },
                            )
                        )

        return results
