"""
Application configuration (environment-driven).
"""

from __future__ import annotations
from pydantic_settings import BaseSettings

import os
from pathlib import Path
class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./omnisurv.db")
    EVIDENCE_STORAGE_PATH: str = "evidence_storage"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_ROOT = BASE_DIR / "evidence_storage"
UPLOADS_DIR = STORAGE_ROOT / "uploads"
RAW_CHUNKS_DIR = STORAGE_ROOT / "raw_chunks"
MP4_CLIPS_DIR = STORAGE_ROOT / "mp4_clips"
REPORTS_DIR = STORAGE_ROOT / "reports"

SCAN_BUFFER_SIZE = int(os.getenv("OMNISURV_SCAN_BUFFER_SIZE", str(4 * 1024 * 1024)))
SCAN_BUFFER_OVERLAP = int(os.getenv("OMNISURV_SCAN_OVERLAP", "256"))
HASH_CHUNK_SIZE = int(os.getenv("OMNISURV_HASH_CHUNK_SIZE", str(4 * 1024 * 1024)))

# Development placeholder until auth provides actor_id via dependency injection.
OPERATOR_ID = os.getenv(
    "OMNISURV_OPERATOR_ID",
    "dev-operator-unauthenticated",
)

CLIP_STREAM_BASE_URL = os.getenv(
    "CLIP_STREAM_BASE_URL",
    "http://localhost:8000/static/clips",
)

ALLOWED_RAW_EXTENSIONS = {".dd", ".img", ".raw", ".bin"}
E01_EXTENSION = ".e01"

GEMINI_FORENSIC_PROMPT = """Analyze this recovered CCTV footage for forensic review.
Respond with valid JSON only (no markdown fences), using this schema:
{
  "persons": [{"description": "...", "timestamps": ["..."]}],
  "vehicles": [{"description": "...", "timestamps": ["..."]}],
  "weapons": [{"description": "...", "timestamps": ["..."]}],
  "notable_events": [{"description": "...", "timestamps": ["..."]}],
  "notes": "..."
}
Treat output as analytical metadata requiring human verification."""
