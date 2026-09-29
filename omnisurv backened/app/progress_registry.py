"""
In-memory processing progress (single-process MVP).

Can be replaced with Redis/DB-backed storage without changing API shape.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from threading import Lock
from typing import Any


@dataclass
class EvidenceProgress:
    evidence_id: str
    status: str = "QUEUED"
    bytes_scanned: int = 0
    total_bytes: int = 0
    signatures_found: int = 0
    clips_recovered: int = 0
    _scan_start_monotonic: float | None = field(default=None, repr=False)

    def start_scanning(self, total_bytes: int) -> None:
        self.total_bytes = total_bytes
        self._scan_start_monotonic = time.monotonic()

    def to_dict(self) -> dict[str, Any]:
        percent = 0.0
        if self.total_bytes > 0:
            percent = min(100.0, (self.bytes_scanned / self.total_bytes) * 100.0)

        rate = 0.0
        if self._scan_start_monotonic is not None:
            elapsed = time.monotonic() - self._scan_start_monotonic
            if elapsed > 0 and self.bytes_scanned > 0:
                rate = self.bytes_scanned / elapsed

        return {
            "evidence_id": self.evidence_id,
            "status": self.status,
            "bytes_scanned": self.bytes_scanned,
            "total_bytes": self.total_bytes,
            "progress_percent": round(percent, 2),
            "signatures_found": self.signatures_found,
            "clips_recovered": self.clips_recovered,
            "scan_rate_bytes_per_second": round(rate, 2),
        }


_lock = Lock()
_registry: dict[str, EvidenceProgress] = {}


def ensure_progress(evidence_id: str, status: str = "QUEUED") -> EvidenceProgress:
    with _lock:
        prog = _registry.get(evidence_id)
        if prog is None:
            prog = EvidenceProgress(evidence_id=evidence_id, status=status)
            _registry[evidence_id] = prog
        return prog


def set_status(evidence_id: str, status: str) -> None:
    with _lock:
        prog = _registry.setdefault(evidence_id, EvidenceProgress(evidence_id))
        prog.status = status


def update_scan(
    evidence_id: str,
    bytes_scanned: int,
    *,
    total_bytes: int | None = None,
    signatures_found: int | None = None,
) -> None:
    with _lock:
        prog = _registry.setdefault(evidence_id, EvidenceProgress(evidence_id))
        prog.bytes_scanned = bytes_scanned
        if total_bytes is not None and total_bytes > 0:
            prog.total_bytes = total_bytes
        if signatures_found is not None:
            prog.signatures_found = signatures_found


def increment_signatures(evidence_id: str, count: int = 1) -> None:
    with _lock:
        prog = _registry.setdefault(evidence_id, EvidenceProgress(evidence_id))
        prog.signatures_found += count


def increment_clips(evidence_id: str, count: int = 1) -> None:
    with _lock:
        prog = _registry.setdefault(evidence_id, EvidenceProgress(evidence_id))
        prog.clips_recovered += count


def get_progress(evidence_id: str) -> dict[str, Any] | None:
    with _lock:
        prog = _registry.get(evidence_id)
        if prog is None:
            return None
        return prog.to_dict()


def reset_for_tests() -> None:
    """Clear registry (tests only)."""
    with _lock:
        _registry.clear()
