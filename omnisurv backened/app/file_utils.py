"""Safe filename handling for forensic uploads."""

from __future__ import annotations

import re
from pathlib import Path

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_upload_filename(filename: str) -> str:
    """
    Reduce path traversal and unsafe names to a basename with limited characters.
    """
    base = Path(filename).name
    if base in ("", ".", ".."):
        raise ValueError("Invalid filename.")
    cleaned = _UNSAFE_CHARS.sub("_", base).strip("._")
    if not cleaned:
        raise ValueError("Invalid filename after sanitization.")
    return cleaned
