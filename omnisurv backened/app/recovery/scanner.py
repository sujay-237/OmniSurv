"""Shared buffered scanning helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Iterator

from app.config import SCAN_BUFFER_OVERLAP, SCAN_BUFFER_SIZE
from app.recovery.base import ScanProgressCallback, iter_image_buffers


def iter_file_buffers(
    file_path: Path,
    *,
    buffer_size: int = SCAN_BUFFER_SIZE,
    overlap: int = SCAN_BUFFER_OVERLAP,
    on_progress: ScanProgressCallback | None = None,
) -> Iterator[tuple[int, bytes]]:
    """
    Yield (base_offset, data) sliding windows over a disk image file.

    This is a *streaming* iterator — only one buffer is resident at a time.
    The caller performs signature matching on each yielded pair.
    """
    total = file_path.stat().st_size
    with file_path.open("rb") as handle:
        for base_offset, data in iter_image_buffers(handle, buffer_size, overlap):
            if on_progress:
                scanned = min(base_offset + len(data), total)
                on_progress(scanned, total)
            yield base_offset, data
