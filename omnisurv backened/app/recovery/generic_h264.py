"""
Generic H.264 NAL unit carving (SPS/PPS start codes).

NOTE: The current SPS-to-next-SPS segmentation is HEURISTIC generic H.264 recovery
and is NOT a vendor-specific DVR parser. FFmpeg validation downstream serves
as the final playable-output check.
"""

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

NAL_SPS = b"\x00\x00\x00\x01\x67"
NAL_PPS = b"\x00\x00\x00\x01\x68"
MAX_SEGMENT_BYTES = 16 * 1024 * 1024


class GenericH264Carver(BaseCarver):
    vendor_name = "generic_h264"

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
            sps_offsets: list[int] = []
            seen_offsets: set[int] = set()

            for base_offset, data in iter_image_buffers(
                handle, SCAN_BUFFER_SIZE, SCAN_BUFFER_OVERLAP
            ):
                if on_progress:
                    on_progress(min(base_offset + len(data), total_size), total_size)

                for rel_idx in find_all(data, NAL_SPS):
                    abs_offset = base_offset + rel_idx
                    if abs_offset in seen_offsets:
                        continue
                    seen_offsets.add(abs_offset)
                    sps_offsets.append(abs_offset)
                    if on_signature:
                        on_signature()

            sps_offsets.sort()

            # NOTE: SPS-to-next-SPS segmentation is HEURISTIC generic H.264 recovery
            # and is NOT a vendor-specific DVR parser. FFmpeg validation is the final playable-output check.
            for i, start in enumerate(sps_offsets):
                if i + 1 < len(sps_offsets):
                    end = sps_offsets[i + 1]
                else:
                    end = min(start + MAX_SEGMENT_BYTES, total_size)

                if end <= start + len(NAL_SPS):
                    continue

                segment_len = end - start
                if segment_len > MAX_SEGMENT_BYTES:
                    end = start + MAX_SEGMENT_BYTES
                    segment_len = end - start

                clip_index += 1
                chunk_name = (
                    f"{file_path.stem}_h264_{clip_index}_{start}_{end}.h264"
                )
                chunk_path = raw_output_dir / chunk_name

                handle.seek(start)
                remaining = segment_len
                with chunk_path.open("wb") as out:
                    while remaining > 0:
                        block = handle.read(min(1024 * 1024, remaining))
                        if not block:
                            break
                        out.write(block)
                        remaining -= len(block)

                has_pps = False
                with chunk_path.open("rb") as pf:
                    preview = pf.read(256)
                if NAL_PPS in preview:
                    has_pps = True

                results.append(
                    CarvedCandidate(
                        vendor=self.vendor_name,
                        clip_index=clip_index,
                        offset_start=start,
                        offset_end=end,
                        raw_chunk_path=str(chunk_path.resolve()),
                        size=chunk_path.stat().st_size,
                        signature=NAL_SPS.hex(),
                        parsing_status=ParseStatus.EXTRACTED,
                        metadata={"has_pps_near_start": has_pps},
                    )
                )

        return results
