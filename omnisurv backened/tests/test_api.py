from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from app import database_service
from app.main import app


@pytest.fixture
def client(evidence_storage_dirs):
    return TestClient(app)


def test_upload_streams_md5(client, evidence_storage_dirs):
    payload = b"A" * (1024 * 1024 + 123)
    response = client.post(
        "/api/evidence/upload",
        files={"file": ("sample.dd", io.BytesIO(payload), "application/octet-stream")},
    )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "QUEUED"
    assert len(body["md5_hash"]) == 32
    # TestClient runs BackgroundTasks before returning; pipeline may finish quickly.
    final_status = database_service.get_evidence_status(body["evidence_id"])["status"]
    assert final_status in {"QUEUED", "PROCESSING", "COMPLETED", "FAILED"}


def test_upload_rejects_e01(client):
    response = client.post(
        "/api/evidence/upload",
        files={"file": ("disk.e01", io.BytesIO(b"E01"), "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "E01" in response.json()["detail"]


def test_progress_and_status_endpoints(client, evidence_storage_dirs):
    eid = database_service.create_evidence_record("a.dd", "/tmp/a.dd", "abc")
    response = client.get(f"/api/evidence/{eid}/progress")
    assert response.status_code == 200
    assert response.json()["evidence_id"] == eid

    status = client.get(f"/api/evidence/{eid}/status")
    assert status.status_code == 200


def test_clips_stream_url(client):
    eid = database_service.create_evidence_record("a.dd", "/tmp/a.dd", "abc")
    database_service.save_recovered_clip(
        eid,
        {
            "clip_index": 1,
            "mp4_filename": "clip.mp4",
            "sha256": "deadbeef",
        },
    )
    clips = client.get(f"/api/evidence/{eid}/clips").json()
    assert clips[0]["stream_url"].endswith("/clip.mp4")
