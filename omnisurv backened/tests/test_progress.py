from __future__ import annotations

from app.progress_registry import ensure_progress, get_progress, increment_clips, update_scan


def test_progress_tracking():
    ensure_progress("ev-x", status="PROCESSING")
    update_scan("ev-x", 500, signatures_found=2)
    increment_clips("ev-x", 1)
    payload = get_progress("ev-x")
    assert payload is not None
    assert payload["bytes_scanned"] == 500
    assert payload["signatures_found"] == 2
    assert payload["clips_recovered"] == 1
