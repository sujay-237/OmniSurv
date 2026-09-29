"""Streaming hash utilities for large forensic files."""

from __future__ import annotations

import hashlib
from pathlib import Path

from app.config import HASH_CHUNK_SIZE


def stream_sha256(file_path: str | Path, chunk_size: int = HASH_CHUNK_SIZE) -> str:
    """Compute SHA-256 by streaming; never loads the entire file into memory."""
    digest = hashlib.sha256()
    path = Path(file_path)
    with path.open("rb") as handle:
        while True:
            block = handle.read(chunk_size)
            if not block:
                break
            digest.update(block)
    return digest.hexdigest()


def stream_md5(file_path: str | Path, chunk_size: int = HASH_CHUNK_SIZE) -> str:
    """Compute MD5 by streaming (used in tests and verification helpers)."""
    digest = hashlib.md5()
    path = Path(file_path)
    with path.open("rb") as handle:
        while True:
            block = handle.read(chunk_size)
            if not block:
                break
            digest.update(block)
    return digest.hexdigest()
