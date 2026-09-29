import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database_service import get_db, Case, EvidenceSource, record_audit_event, create_evidence_record

router = APIRouter(prefix="/api/v1", tags=["Evidence"])

class EvidenceRegisterRequest(BaseModel):
    case_id: Optional[uuid.UUID] = None
    vendor: str
    file_path: str
    size_bytes: int
    md5_hash: str
    sha256_hash: str
    investigator_id: str

@router.post("/evidence/register")
async def register_evidence(
    payload: EvidenceRegisterRequest,
    db: Any = Depends(get_db)
):
    case_str = str(payload.case_id) if payload.case_id else f"CASE-{uuid.uuid4().hex[:8].upper()}"
    evidence_id = create_evidence_record(
        filename=payload.file_path.split("/")[-1].split("\\")[-1] or "evidence.dd",
        file_path=payload.file_path,
        md5_hash=payload.md5_hash,
        case_id=case_str,
        vendor=payload.vendor,
        sha256_hash=payload.sha256_hash,
        size_bytes=payload.size_bytes,
        investigator_id=payload.investigator_id,
    )

    if db is not None:
        try:
            evidence = EvidenceSource(
                id=evidence_id,
                case_id=case_str,
                vendor=payload.vendor,
                file_path=payload.file_path,
                size_bytes=payload.size_bytes,
                md5_hash=payload.md5_hash,
                sha256_hash=payload.sha256_hash
            )
            db.add(evidence)
            await db.commit()
        except Exception:
            pass

    # Append to immutable chain-of-custody ledger
    await record_audit_event(
        session=db,
        case_id=case_str,
        evidence_id=evidence_id,
        action="EVIDENCE_ACQUIRED_AND_HASHED",
        actor=payload.investigator_id,
        details={"sha256": payload.sha256_hash, "vendor": payload.vendor}
    )

    return {"status": "success", "evidence_id": evidence_id}
