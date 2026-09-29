from __future__ import annotations

from app import database_service


def test_database_interface_roundtrip():
    eid = database_service.create_evidence_record("disk.dd", "/path/disk.dd", "md5hex")
    database_service.update_evidence_status(eid, "PROCESSING")
    database_service.save_recovered_clip(
        eid,
        {"clip_index": 1, "sha256": "abc", "mp4_filename": "c.mp4"},
    )
    bundle = database_service.get_evidence_bundle(eid)
    assert bundle["source_file_md5"] == "md5hex"
    assert len(bundle["clips"]) == 1
    assert database_service.get_evidence_status(eid)["status"] == "PROCESSING"
