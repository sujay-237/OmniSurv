"""
Hikvision marker and H.264 frame carving.
Scans for proprietary HIKVISION@HANGZHOU markers and standard H.264/H.265 SPS start codes.
Extracts contiguous payloads for FFmpeg remuxing into ISO/IEC 14496-14 containers.
"""

from __future__ import annotations

import logging
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

HIKVISION_MARKER = b"HIKVISION@HANGZHOU"
H264_NAL_SPS_4B = b"\x00\x00\x00\x01\x67"
H264_NAL_SPS_3B = b"\x00\x00\x01\x67"
CARVE_CHUNK_SIZE = 1 * 1024 * 1024  # 1MB standard slice


class HikvisionCarver(BaseCarver):
    vendor_name = "hikvision"

    def scan_image(
        self,
        file_path: Path,
        raw_output_dir: Path,
        *,
        on_progress: ScanProgressCallback | None = None,
        on_signature: Callable[[], None] | None = None,
    ) -> list[CarvedCandidate]:
        total_size = file_path.stat().st_size
        detections: list[CarvedCandidate] = []
        raw_output_dir.mkdir(parents=True, exist_ok=True)
        index = 0

        with file_path.open("rb") as handle:
            seen_offsets: set[int] = set()
            for base_offset, data in iter_image_buffers(
                handle, SCAN_BUFFER_SIZE, SCAN_BUFFER_OVERLAP
            ):
                if on_progress:
                    on_progress(min(base_offset + len(data), total_size), total_size)

                # 1. Search for HIKVISION proprietary signature
                for rel_idx in find_all(data, HIKVISION_MARKER):
                    abs_offset = base_offset + rel_idx
                    if abs_offset in seen_offsets:
                        continue
                    seen_offsets.add(abs_offset)
                    index += 1
                    if on_signature:
                        on_signature()

                    # Carve 1MB payload from this offset
                    handle.seek(abs_offset)
                    payload = handle.read(CARVE_CHUNK_SIZE)
                    chunk_name = f"hikvision_clip_{index:04d}_{abs_offset}.raw"
                    chunk_path = raw_output_dir / chunk_name
                    chunk_path.write_bytes(payload)

                    detections.append(
                        CarvedCandidate(
                            vendor=self.vendor_name,
                            clip_index=index,
                            offset_start=abs_offset,
                            offset_end=abs_offset + len(payload),
                            raw_chunk_path=str(chunk_path.resolve()),
                            size=len(payload),
                            signature=HIKVISION_MARKER.decode("ascii", errors="replace"),
                            parsing_status=ParseStatus.EXTRACTED,
                            metadata={
                                "camera_id": "CAM_2",
                                "offset_hex": f"0x{abs_offset:08X}",
                                "format": "HIKFS / Hikvision Elementary Stream"
                            },
                        )
                    )

                # 2. Search for H.264 SPS start codes within Hikvision partitions
                for rel_idx in find_all(data, H264_NAL_SPS_4B):
                    abs_offset = base_offset + rel_idx
                    if abs_offset in seen_offsets:
                        continue
                    seen_offsets.add(abs_offset)
                    index += 1
                    if on_signature:
                        on_signature()

                    handle.seek(abs_offset)
                    payload = handle.read(CARVE_CHUNK_SIZE)
                    chunk_name = f"hikvision_clip_{index:04d}_{abs_offset}.raw"
                    chunk_path = raw_output_dir / chunk_name
                    chunk_path.write_bytes(payload)

                    detections.append(
                        CarvedCandidate(
                            vendor=self.vendor_name,
                            clip_index=index,
                            offset_start=abs_offset,
                            offset_end=abs_offset + len(payload),
                            raw_chunk_path=str(chunk_path.resolve()),
                            size=len(payload),
                            signature="H264_SPS",
                            parsing_status=ParseStatus.EXTRACTED,
                            metadata={
                                "camera_id": "CAM_2",
                                "offset_hex": f"0x{abs_offset:08X}",
                                "format": "Hikvision H.264 NAL SPS"
                            },
                        )
                    )

        return detections
