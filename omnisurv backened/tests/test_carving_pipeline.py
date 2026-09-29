from __future__ import annotations

import struct
from unittest.mock import MagicMock, patch

import pytest

from app import carving_engine, database_service, tasks
from app.recovery.dahua import DHAV_SIGNATURE


def _dhav_frame(payload: bytes) -> bytes:
    header = bytearray(16)
    header[0:4] = DHAV_SIGNATURE
    struct.pack_into("<I", header, 12, len(payload))
    return bytes(header) + payload


def test_ffmpeg_failure_does_not_crash_carving(tmp_path, monkeypatch):
    image = tmp_path / "evidence.dd"
    image.write_bytes(_dhav_frame(b"\x00" * 20))

    rotator = MagicMock()
    with patch("app.carving_engine.RAW_CHUNKS_DIR", tmp_path / "raw"):
        with patch("app.carving_engine.remux_h264_to_mp4") as remux:
            remux.return_value = MagicMock(success=False, stderr="fail", stdout="")
            clips = carving_engine.process_image(
                str(image),
                rotator,
                evidence_id="ev-1",
                enable_ai=False,
            )
    assert clips == []


def test_successful_clip_metadata_sha256(tmp_path, monkeypatch):
    image = tmp_path / "evidence.dd"
    image.write_bytes(_dhav_frame(b"\x00" * 20))

    mp4_dir = tmp_path / "mp4"
    mp4_dir.mkdir()
    fake_mp4 = mp4_dir / "out.mp4"
    fake_mp4.write_bytes(b"fake-mp4-bytes-for-hash")

    rotator = MagicMock()
    with patch("app.carving_engine.RAW_CHUNKS_DIR", tmp_path / "raw2"):
        with patch("app.carving_engine.remux_h264_to_mp4") as remux:
            remux.return_value = MagicMock(
                success=True,
                output_path=str(fake_mp4),
                stderr="",
                stdout="",
            )
            with patch("app.carving_engine.MP4_CLIPS_DIR", mp4_dir):
                with patch("app.carving_engine.stream_sha256", return_value="abc123"):
                    clips = carving_engine.process_image(
                        str(image),
                        rotator,
                        evidence_id="ev-2",
                        enable_ai=False,
                    )

    assert len(clips) == 1
    assert clips[0]["sha256"] == "abc123"
    assert clips[0]["offset_start"] == 0
    assert "pending-sha256" not in clips[0]["sha256"]


def test_ai_failure_preserves_clip(tmp_path, monkeypatch):
    image = tmp_path / "evidence.dd"
    image.write_bytes(_dhav_frame(b"\x00" * 20))
    mp4_dir = tmp_path / "mp4"
    mp4_dir.mkdir()
    fake_mp4 = mp4_dir / "out.mp4"
    fake_mp4.write_bytes(b"x")

    rotator = MagicMock()
    rotator.execute_gemini_video_task.side_effect = RuntimeError("gemini down")

    with patch("app.carving_engine.RAW_CHUNKS_DIR", tmp_path / "raw3"):
        with patch("app.carving_engine.remux_h264_to_mp4") as remux:
            remux.return_value = MagicMock(
                success=True,
                output_path=str(fake_mp4),
                stderr="",
                stdout="",
            )
            with patch("app.carving_engine.MP4_CLIPS_DIR", mp4_dir):
                with patch("app.carving_engine.stream_sha256", return_value="sha"):
                    clips = carving_engine.process_image(
                        str(image),
                        rotator,
                        evidence_id="ev-3",
                        enable_ai=True,
                    )

    assert len(clips) == 1
    assert clips[0]["sha256"] == "sha"
    assert "AI" in clips[0]["ai_event_log"]


def test_pipeline_failed_status_on_carving_error(tmp_path, monkeypatch):
    eid = database_service.create_evidence_record("x.dd", str(tmp_path / "missing.dd"), "md5")
    tasks.run_evidence_pipeline(eid, str(tmp_path / "missing.dd"))
    status = database_service.get_evidence_status(eid)
    assert status["status"] == "FAILED"
    assert status["error_message"]


def test_all_carvers_fail_causes_pipeline_failed(tmp_path):
    """
    Test A: When all configured carvers fail with exceptions:
    - process_image raises RuntimeError
    - pipeline in tasks marks evidence FAILED
    """
    image = tmp_path / "evidence.dd"
    image.write_bytes(b"dummy-disk-content")

    c1 = MagicMock()
    c1.vendor_name = "mock_vendor_1"
    c1.scan_image.side_effect = RuntimeError("carver 1 disk corruption")

    c2 = MagicMock()
    c2.vendor_name = "mock_vendor_2"
    c2.scan_image.side_effect = ValueError("carver 2 parse error")

    rotator = MagicMock()

    with patch(
        "app.recovery.factory.VideoCarverFactory.default_scan_carvers",
        return_value=[c1, c2],
    ):
        with pytest.raises(RuntimeError) as exc_info:
            carving_engine.process_image(
                str(image),
                rotator,
                evidence_id="ev-fail-all",
                enable_ai=False,
            )
        assert "All configured carvers failed" in str(exc_info.value)
        assert "mock_vendor_1" in str(exc_info.value)
        assert "mock_vendor_2" in str(exc_info.value)

        eid = database_service.create_evidence_record("fail.dd", str(image), "hash")
        tasks.run_evidence_pipeline(eid, str(image))
        status = database_service.get_evidence_status(eid)
        assert status["status"] == "FAILED"
        assert "All configured carvers failed" in status["error_message"]


def test_one_carver_fails_one_succeeds_continues(tmp_path):
    """
    Test B: When one carver fails and another succeeds:
    - single carver failure does not fail the pipeline
    - finding 0 candidates is not a failure
    - pipeline completes successfully
    """
    image = tmp_path / "evidence.dd"
    image.write_bytes(b"dummy-disk-content")

    failing_carver = MagicMock()
    failing_carver.vendor_name = "failing_vendor"
    failing_carver.scan_image.side_effect = RuntimeError("failing vendor error")

    succeeding_carver = MagicMock()
    succeeding_carver.vendor_name = "succeeding_vendor"
    succeeding_carver.scan_image.return_value = []

    rotator = MagicMock()

    with patch(
        "app.recovery.factory.VideoCarverFactory.default_scan_carvers",
        return_value=[failing_carver, succeeding_carver],
    ):
        clips = carving_engine.process_image(
            str(image),
            rotator,
            evidence_id="ev-partial-success",
            enable_ai=False,
        )
        assert clips == []

        eid = database_service.create_evidence_record("partial.dd", str(image), "hash")
        tasks.run_evidence_pipeline(eid, str(image))
        status = database_service.get_evidence_status(eid)
        assert status["status"] == "COMPLETED"
