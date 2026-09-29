"""
Background evidence processing pipeline.
"""

from __future__ import annotations

import logging
import traceback

from app import carving_engine, database_service
from app.key_manager import get_key_rotator
from app.progress_registry import ensure_progress, set_status

logger = logging.getLogger(__name__)


def run_evidence_pipeline(evidence_id: str, file_path: str) -> None:
    """
    Process uploaded disk evidence asynchronously (FastAPI BackgroundTasks).

    QUEUED → PROCESSING → carving → remux → SHA-256 → DB → AI → COMPLETED
    """
    ensure_progress(evidence_id, status="QUEUED")
    rotator = get_key_rotator()
    try:
        set_status(evidence_id, "PROCESSING")
        database_service.update_evidence_status(evidence_id, status="PROCESSING")

        clips = carving_engine.process_image(
            file_path,
            rotator,
            evidence_id=evidence_id,
            enable_ai=True,
        )

        for clip_data in clips:
            database_service.save_recovered_clip(evidence_id, clip_data)

        set_status(evidence_id, "COMPLETED")
        database_service.update_evidence_status(evidence_id, status="COMPLETED")
        logger.info("Evidence pipeline completed: %s (%s clips)", evidence_id, len(clips))
    except Exception:
        stack = traceback.format_exc()
        logger.exception("Evidence pipeline failed: %s", evidence_id)
        set_status(evidence_id, "FAILED")
        try:
            database_service.update_evidence_status(
                evidence_id,
                status="FAILED",
                error_message=stack,
            )
        except Exception:
            logger.exception(
                "Failed to persist FAILED status for evidence: %s", evidence_id
            )
