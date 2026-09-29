from __future__ import annotations

from pathlib import Path

import pytest

from app import database_service
from app.progress_registry import reset_for_tests as reset_progress


@pytest.fixture(autouse=True)
def _clean_state(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    database_service.reset_store_for_tests()
    reset_progress()
    monkeypatch.setenv("GROQ_KEYS", "test-groq-key")
    monkeypatch.setenv("GEMINI_KEYS", "test-gemini-key")
    yield
    database_service.reset_store_for_tests()
    reset_progress()


@pytest.fixture
def evidence_storage_dirs(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    root = tmp_path / "evidence_storage"
    uploads = root / "uploads"
    raw = root / "raw_chunks"
    mp4 = root / "mp4_clips"
    reports = root / "reports"
    for d in (uploads, raw, mp4, reports):
        d.mkdir(parents=True)

    import app.config as config

    monkeypatch.setattr(config, "STORAGE_ROOT", root)
    monkeypatch.setattr(config, "UPLOADS_DIR", uploads)
    monkeypatch.setattr(config, "RAW_CHUNKS_DIR", raw)
    monkeypatch.setattr(config, "MP4_CLIPS_DIR", mp4)
    monkeypatch.setattr(config, "REPORTS_DIR", reports)

    import app.main as main_module

    monkeypatch.setattr(main_module, "UPLOADS_DIR", uploads)
    monkeypatch.setattr(main_module, "REPORTS_DIR", reports)
    monkeypatch.setattr(main_module, "MP4_CLIPS_DIR", mp4)

    import app.carving_engine as carving_engine

    monkeypatch.setattr(carving_engine, "RAW_CHUNKS_DIR", raw)
    monkeypatch.setattr(carving_engine, "MP4_CLIPS_DIR", mp4)

    return root
