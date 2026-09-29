"""Base types and interfaces for forensic video carvers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, BinaryIO, Callable, Iterator


class ParseStatus(str, Enum):
    EXTRACTED = "extracted"
    DETECTED_ONLY = "detected_only"
    UNSUPPORTED = "unsupported"
    FAILED = "failed"


@dataclass
class CarvedCandidate:
    """Raw carved segment before FFmpeg remux."""

    vendor: str
    clip_index: int
    offset_start: int
    offset_end: int
    raw_chunk_path: str
    size: int
    signature: str
    parsing_status: ParseStatus
    metadata: dict[str, Any] = field(default_factory=dict)


ScanProgressCallback = Callable[[int, int], None]


class BaseCarver(ABC):
    """Strategy interface for vendor-specific carving."""

    vendor_name: str

    @abstractmethod
    def scan_image(
        self,
        file_path: Path,
        raw_output_dir: Path,
        *,
        on_progress: ScanProgressCallback | None = None,
        on_signature: Callable[[], None] | None = None,
    ) -> list[CarvedCandidate]:
        """Scan a read-only disk image and extract raw recoverable segments."""


def iter_image_buffers(
    handle: BinaryIO,
    buffer_size: int,
    overlap: int,
) -> Iterator[tuple[int, bytes]]:
    """
    Yield (absolute_start_offset, buffer) sliding windows over a binary file.

    Each buffer overlaps the previous by `overlap` bytes so signatures spanning
    boundaries are detectable by the caller.
    """
    if overlap >= buffer_size:
        raise ValueError("overlap must be smaller than buffer_size")

    handle.seek(0)
    tail = b""
    offset = 0

    while True:
        chunk = handle.read(buffer_size)
        if not chunk:
            break

        data = tail + chunk
        base_offset = offset - len(tail)
        yield base_offset, data

        if len(chunk) < buffer_size:
            break

        tail = data[-overlap:]
        offset += len(chunk)


def find_all(haystack: bytes, needle: bytes) -> list[int]:
    """Return all start indices of needle in haystack."""
    if not needle:
        return []
    indices: list[int] = []
    start = 0
    while True:
        idx = haystack.find(needle, start)
        if idx == -1:
            break
        indices.append(idx)
        start = idx + 1
    return indices
