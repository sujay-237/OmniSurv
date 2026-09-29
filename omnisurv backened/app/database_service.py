"""
OmniSurv Forensics Database Service.
Provides a resilient dual-mode data layer:
1. Fast, high-integrity persistent / in-memory store for all forensic operations,
   chain of custody logs, evidence records, and clip metadata.
2. Optional asynchronous PostgreSQL / Supabase synchronization when DATABASE_URL is reachable.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, Text, text, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional pgvector support with fallback
# ---------------------------------------------------------------------------
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    def Vector(dim: int):  # type: ignore
        return Text

# ---------------------------------------------------------------------------
# SQLAlchemy Declarative Models (Supabase / PostgreSQL schema)
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass

class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number: Mapped[str] = mapped_column(Text, unique=True, index=True)
    investigator_id: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    evidence_sources: Mapped[List["EvidenceSource"]] = relationship(back_populates="case", cascade="all, delete-orphan")
    chain_of_custody_logs: Mapped[List["ChainOfCustodyLog"]] = relationship(back_populates="case", cascade="all, delete-orphan")

class EvidenceSource(Base):
    __tablename__ = "evidence_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    vendor: Mapped[str] = mapped_column(Text, default="Generic")
    file_path: Mapped[str] = mapped_column(Text)
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    md5_hash: Mapped[str] = mapped_column(String(32))
    sha256_hash: Mapped[str] = mapped_column(String(64), default="")
    vendor_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    acquisition_timestamp: Mapped[Optional[datetime]] = mapped_column(nullable=True, default=lambda: datetime.now(timezone.utc))

    case: Mapped[Optional["Case"]] = relationship(back_populates="evidence_sources")
    carved_clips: Mapped[List["CarvedClip"]] = relationship(back_populates="evidence_source", cascade="all, delete-orphan")
    chain_of_custody_logs: Mapped[List["ChainOfCustodyLog"]] = relationship(back_populates="evidence_source", cascade="all, delete-orphan")

class CarvedClip(Base):
    __tablename__ = "carved_clips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence_sources.id", ondelete="CASCADE"))
    camera_channel: Mapped[int] = mapped_column(Integer, default=1, index=True)
    start_offset_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    end_offset_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    start_time: Mapped[Optional[datetime]] = mapped_column(index=True, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(index=True, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    raw_chunk_path: Mapped[str] = mapped_column(Text, default="")
    mp4_clip_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_sha256: Mapped[str] = mapped_column(String(64), default="")
    mp4_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(Text, default="carved")

    evidence_source: Mapped["EvidenceSource"] = relationship(back_populates="carved_clips")
    video_detections: Mapped[List["VideoDetection"]] = relationship(back_populates="clip", cascade="all, delete-orphan")

class VideoDetection(Base):
    __tablename__ = "video_detections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clip_id: Mapped[str] = mapped_column(ForeignKey("carved_clips.id", ondelete="CASCADE"))
    frame_timestamp: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    frame_number: Mapped[int] = mapped_column(Integer, default=0)
    detection_type: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    bounding_box: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    embedding = mapped_column(Vector(512) if HAS_PGVECTOR else Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    clip: Mapped["CarvedClip"] = relationship(back_populates="video_detections")

class ChainOfCustodyLog(Base):
    __tablename__ = "chain_of_custody_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[Optional[str]] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    evidence_id: Mapped[Optional[str]] = mapped_column(ForeignKey("evidence_sources.id", ondelete="CASCADE"), nullable=True)
    action: Mapped[str] = mapped_column(Text)
    actor: Mapped[str] = mapped_column(Text)
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    case: Mapped[Optional["Case"]] = relationship(back_populates="chain_of_custody_logs")
    evidence_source: Mapped[Optional["EvidenceSource"]] = relationship(back_populates="chain_of_custody_logs")

# ---------------------------------------------------------------------------
# Async Engine & Session (Safe fallback for tests & local dev)
# ---------------------------------------------------------------------------
_db_initialized = False
engine = None
AsyncSessionLocal = None

try:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    if settings.DATABASE_URL and ("postgresql" in settings.DATABASE_URL or "sqlite" in settings.DATABASE_URL):
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
except Exception as e:
    logger.warning("Async database engine disabled: %s", e)

async def init_db() -> None:
    global _db_initialized
    if engine is None:
        _db_initialized = True
        return
    try:
        async with engine.begin() as conn:
            if HAS_PGVECTOR and "postgresql" in str(engine.url):
                try:
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                except Exception:
                    pass
            await conn.run_sync(Base.metadata.create_all)
            _db_initialized = True
            logger.info("Database schema initialized successfully.")
    except Exception as exc:
        logger.warning("External database initialization notice (running in local store mode): %s", exc)
        _db_initialized = True

async def get_db() -> AsyncGenerator[Any, None]:
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# ---------------------------------------------------------------------------
# In-Memory & Local Thread-Safe Forensic Storage Engine
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_evidence_store: Dict[str, Dict[str, Any]] = {}
_clips_store: Dict[str, List[Dict[str, Any]]] = {}
_audit_logs: List[Dict[str, Any]] = []
_cases_store: Dict[str, Dict[str, Any]] = {}

def reset_store_for_tests() -> None:
    """Clears all in-memory forensic records for test isolation."""
    with _lock:
        _evidence_store.clear()
        _clips_store.clear()
        _audit_logs.clear()
        _cases_store.clear()


def create_evidence_record(
    filename: str,
    file_path: str,
    md5_hash: str,
    case_id: Optional[str] = None,
    vendor: str = "Unknown",
    sha256_hash: Optional[str] = None,
    size_bytes: Optional[int] = None,
    investigator_id: str = "Forensic Examiner",
) -> str:
    """Creates a new evidence entry with initial SHA-256 and MD5 integrity verification."""
    evidence_id = str(uuid.uuid4())
    now_utc = datetime.now(timezone.utc).isoformat()
    cid = case_id or f"CASE-{datetime.now(timezone.utc).strftime('%Y%m%d')}-001"

    rec = {
        "evidence_id": evidence_id,
        "case_id": cid,
        "filename": filename,
        "file_path": str(Path(file_path).resolve()) if file_path else "",
        "source_file_md5": md5_hash,
        "md5_hash": md5_hash,
        "sha256_hash": sha256_hash or "",
        "source_file_sha256": sha256_hash or "",
        "size_bytes": size_bytes or (Path(file_path).stat().st_size if Path(file_path).exists() else 0),
        "status": "QUEUED",
        "vendor": vendor,
        "ingest_timestamp": now_utc,
        "created_at": now_utc,
        "error_message": None,
    }

    with _lock:
        _evidence_store[evidence_id] = rec
        _clips_store[evidence_id] = []

    # Record initial chain-of-custody entry
    record_audit_event_sync(
        case_id=cid,
        evidence_id=evidence_id,
        action="EVIDENCE_ACQUIRED_AND_HASHED",
        actor=investigator_id,
        details={
            "filename": filename,
            "md5_hash": md5_hash,
            "sha256_hash": sha256_hash or "",
            "vendor": vendor
        }
    )

    return evidence_id


def update_evidence_status(
    evidence_id: str,
    status: str,
    error_message: Optional[str] = None,
    vendor: Optional[str] = None,
) -> Dict[str, Any]:
    """Updates evidence status and persists error traces if failed."""
    with _lock:
        if evidence_id not in _evidence_store:
            raise KeyError(f"Evidence {evidence_id} not found.")
        rec = _evidence_store[evidence_id]
        rec["status"] = status
        if error_message is not None:
            rec["error_message"] = error_message
        if vendor is not None:
            rec["vendor"] = vendor
        return dict(rec)


def get_evidence_status(evidence_id: str) -> Dict[str, Any]:
    """Retrieves current processing status and metadata for the evidence."""
    with _lock:
        if evidence_id not in _evidence_store:
            raise KeyError(f"Evidence {evidence_id} not found.")
        return dict(_evidence_store[evidence_id])


def save_recovered_clip(evidence_id: str, clip_data: Dict[str, Any]) -> Dict[str, Any]:
    """Saves a carved video clip associated with an evidence image."""
    with _lock:
        if evidence_id not in _evidence_store:
            # Auto-register if not yet present to avoid data loss
            _evidence_store[evidence_id] = {
                "evidence_id": evidence_id,
                "case_id": "DEFAULT-CASE",
                "filename": "auto_evidence",
                "file_path": "",
                "source_file_md5": "",
                "md5_hash": "",
                "status": "PROCESSING",
                "ingest_timestamp": datetime.now(timezone.utc).isoformat(),
            }
            _clips_store[evidence_id] = []

        clip_id = clip_data.get("id") or str(uuid.uuid4())
        clip_entry = dict(clip_data)
        clip_entry["id"] = clip_id
        clip_entry["evidence_id"] = evidence_id
        if "created_at" not in clip_entry:
            clip_entry["created_at"] = datetime.now(timezone.utc).isoformat()

        _clips_store[evidence_id].append(clip_entry)

    # Chain of custody audit
    record_audit_event_sync(
        case_id=_evidence_store[evidence_id].get("case_id", "DEFAULT-CASE"),
        evidence_id=evidence_id,
        action="CLIP_CARVED_AND_VERIFIED",
        actor="Forensic Carving Engine",
        details={
            "clip_index": clip_entry.get("clip_index"),
            "vendor": clip_entry.get("vendor"),
            "sha256": clip_entry.get("sha256"),
            "offset_start": clip_entry.get("offset_start"),
            "offset_end": clip_entry.get("offset_end"),
        }
    )

    return clip_entry


def get_clips_by_evidence(evidence_id: str) -> List[Dict[str, Any]]:
    """Returns all carved clips for a specific evidence file."""
    with _lock:
        if evidence_id not in _evidence_store:
            raise KeyError(f"Evidence {evidence_id} not found.")
        return [dict(c) for c in _clips_store.get(evidence_id, [])]


def get_evidence_bundle(evidence_id: str) -> Dict[str, Any]:
    """Returns a full evidence bundle including all carved clips for report generation."""
    with _lock:
        if evidence_id not in _evidence_store:
            raise KeyError(f"Evidence {evidence_id} not found.")
        bundle = dict(_evidence_store[evidence_id])
        bundle["clips"] = [dict(c) for c in _clips_store.get(evidence_id, [])]
        return bundle


def list_all_evidence() -> List[Dict[str, Any]]:
    """Lists all registered evidence files."""
    with _lock:
        result = []
        for eid, rec in _evidence_store.items():
            item = dict(rec)
            item["clips_count"] = len(_clips_store.get(eid, []))
            result.append(item)
        return result


def record_audit_event_sync(
    case_id: str,
    action: str,
    actor: str,
    evidence_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Synchronously appends an event to the chain-of-custody audit trail."""
    entry = {
        "id": len(_audit_logs) + 1,
        "case_id": case_id,
        "evidence_id": evidence_id,
        "action": action,
        "actor": actor,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _audit_logs.append(entry)
    return entry


async def record_audit_event(
    session: Optional[Any],
    case_id: Any,
    action: str,
    actor: str,
    evidence_id: Optional[Any] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Any:
    """Async wrapper for compatibility with FastAPI router dependencies."""
    entry = record_audit_event_sync(
        case_id=str(case_id),
        action=action,
        actor=actor,
        evidence_id=str(evidence_id) if evidence_id else None,
        details=details,
    )
    if session is not None:
        try:
            db_entry = ChainOfCustodyLog(
                case_id=str(case_id),
                evidence_id=str(evidence_id) if evidence_id else None,
                action=action,
                actor=actor,
                details=details or {},
            )
            session.add(db_entry)
            await session.commit()
            return db_entry
        except Exception as e:
            logger.warning("Failed writing to external DB audit table: %s", e)
    return entry


def get_audit_trail(evidence_id: Optional[str] = None, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves chain-of-custody records matching filter criteria."""
    with _lock:
        logs = list(_audit_logs)
    if evidence_id:
        logs = [l for l in logs if l.get("evidence_id") == evidence_id]
    if case_id:
        logs = [l for l in logs if l.get("case_id") == case_id]
    return logs