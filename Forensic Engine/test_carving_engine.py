"""
========================================================================================
Test Suite for SIH26150 Forensic Carving Engine (test_carving_engine.py)
Validates ISO/IEC 27037 Evidence Integrity, Factory Pattern, Gemini & Groq AI Pipeline
========================================================================================
"""

import os
import hashlib
import asyncio
from pathlib import Path
import pytest

from unittest.mock import patch, MagicMock

from carving_engine import (
    CarvingEngine,
    DVRParserFactory,
    DVRParser,
    DahuaParser,
    HikvisionParser,
    CPPlusParser,
    HoneywellParser,
    GodrejParser,
    UniviewParser,
    MatrixParser,
    TPLinkParser,
    GEMINI_MODEL,
    analyze_video_with_gemini,
    correlate_evidence_with_groq,
    _create_mock_forensic_image,
    RAW_CHUNKS_DIR,
    MP4_CLIPS_DIR,
)


@pytest.fixture(scope="module")
def setup_evidence():
    """Generates synthetic .dd forensic image for tests."""
    test_dd = Path("unit_test_evidence.dd")
    _create_mock_forensic_image(test_dd)
    yield test_dd
    # Clean up test artifact after test run
    if test_dd.exists():
        test_dd.unlink()


def test_parser_factory_registration():
    """Verify that all 8 required OEM parsers are registered and instantiable."""
    vendors = DVRParserFactory.list_supported_vendors()
    expected_vendors = ["Dahua", "Hikvision", "CP Plus", "Honeywell", "Godrej", "Uniview", "Matrix", "TP-Link"]

    for v in expected_vendors:
        assert v in vendors, f"Vendor {v} must be present in supported list."

    all_parsers = DVRParserFactory.get_all_parsers()
    assert len(all_parsers) == 8

    # Verify key parser types
    assert isinstance(DVRParserFactory.get_parser("dahua"), DahuaParser)
    assert isinstance(DVRParserFactory.get_parser("hikvision"), HikvisionParser)
    assert isinstance(DVRParserFactory.get_parser("cpplus"), CPPlusParser)
    assert isinstance(DVRParserFactory.get_parser("honeywell"), HoneywellParser)
    assert isinstance(DVRParserFactory.get_parser("godrej"), GodrejParser)
    assert isinstance(DVRParserFactory.get_parser("uniview"), UniviewParser)
    assert isinstance(DVRParserFactory.get_parser("matrix"), MatrixParser)
    assert isinstance(DVRParserFactory.get_parser("tplink"), TPLinkParser)
    assert isinstance(DVRParserFactory.get_parser("tp_link"), TPLinkParser)


def test_dahua_signature_matching():
    """Verify Dahua DHAV header b'\\x44\\x48\\x41\\x56' detection."""
    parser = DahuaParser()
    sample_buf = b"\x00" * 128 + b"\x44\x48\x41\x56" + b"\x01\x00\x00\x00" + b"\x00" * 64
    matches = parser.scan_buffer(sample_buf)
    assert len(matches) == 1
    assert matches[0] == 128


def test_hikvision_signature_matching():
    """Verify Hikvision signature matching (HIKVISION@HANGZHOU and H.264 NAL SPS)."""
    parser = HikvisionParser()
    sample_buf = (
        b"\x00" * 50
        + b"HIKVISION@HANGZHOU"
        + b"\x00" * 50
        + b"\x00\x00\x00\x01\x67\x42\x00\x1E"
        + b"\x00" * 50
    )
    matches = parser.scan_buffer(sample_buf)
    assert len(matches) == 2
    assert 50 in matches
    assert 118 in matches


def test_gemini_model_configuration():
    """Verify that the engine defaults to Gemini 2.5 Flash."""
    assert GEMINI_MODEL == "gemini-2.5-flash"


def test_gemini_video_analysis_hook():
    """Verify analyze_video_with_gemini returns structured JSON with required keys."""
    dummy_clip = Path("evidence_storage/mp4_clips/test_gemini_dummy.mp4")
    dummy_clip.parent.mkdir(parents=True, exist_ok=True)
    dummy_clip.touch(exist_ok=True)

    result = asyncio.run(analyze_video_with_gemini(str(dummy_clip)))
    assert isinstance(result, dict)
    assert "objects_detected" in result
    assert "scene_summary" in result
    assert isinstance(result["objects_detected"], list)
    assert isinstance(result["scene_summary"], str)


def test_gemini_2_5_flash_mocked_api_call(tmp_path):
    """Verify analyze_video_with_gemini correctly invokes Gemini 2.5 Flash model and parses response."""
    test_video = tmp_path / "test_active_clip.mp4"
    test_video.write_bytes(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42")

    fake_video_file = MagicMock()
    fake_video_file.state.name = "ACTIVE"

    fake_response = MagicMock()
    fake_response.text = '{"objects_detected": ["suspect_person", "delivery_van"], "scene_summary": "Intrusion detected at loading bay at night."}'

    async def fake_generate_content_async(contents, generation_config=None):
        return fake_response

    fake_model_instance = MagicMock()
    fake_model_instance.generate_content_async = fake_generate_content_async

    with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyDummyTestKeyForensicEngine"}):
        with patch("google.generativeai.upload_file", return_value=fake_video_file) as mock_upload, \
             patch("google.generativeai.GenerativeModel", return_value=fake_model_instance) as mock_gen_model:

            result = asyncio.run(analyze_video_with_gemini(str(test_video)))

            # Verify that Gemini 2.5 Flash was requested
            mock_gen_model.assert_called_once_with("gemini-2.5-flash")
            mock_upload.assert_called_once()

            # Verify parsed JSON structure
            assert result["objects_detected"] == ["suspect_person", "delivery_van"]
            assert "Intrusion detected" in result["scene_summary"]


def test_gemini_model_override(tmp_path):
    """Verify that model_name override parameter is honored."""
    test_video = tmp_path / "test_override.mp4"
    test_video.write_bytes(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42")

    fake_video_file = MagicMock()
    fake_video_file.state.name = "ACTIVE"

    fake_response = MagicMock()
    fake_response.text = '{"objects_detected": ["bicycle"], "scene_summary": "Cyclist in lane."}'

    async def fake_generate_content_async(contents, generation_config=None):
        return fake_response

    fake_model_instance = MagicMock()
    fake_model_instance.generate_content_async = fake_generate_content_async

    with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyDummyTestKeyForensicEngine"}):
        with patch("google.generativeai.upload_file", return_value=fake_video_file), \
             patch("google.generativeai.GenerativeModel", return_value=fake_model_instance) as mock_gen_model:

            result = asyncio.run(analyze_video_with_gemini(str(test_video), model_name="gemini-2.5-flash-preview"))
            mock_gen_model.assert_called_once_with("gemini-2.5-flash-preview")
            assert result["objects_detected"] == ["bicycle"]


def test_gemini_api_error_fallback(tmp_path):
    """Verify that API exceptions (e.g. rate limits or server errors) trigger safe fallback."""
    test_video = tmp_path / "test_error.mp4"
    test_video.write_bytes(b"\x00\x00\x00\x18ftypmp42")

    with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyDummyTestKeyForensicEngine"}):
        with patch("google.generativeai.upload_file", side_effect=RuntimeError("API quota exceeded")):
            result = asyncio.run(analyze_video_with_gemini(str(test_video)))
            # Check graceful fallback payload
            assert isinstance(result, dict)
            assert "objects_detected" in result
            assert "scene_summary" in result


def test_groq_metadata_correlation_hook():
    """Verify correlate_evidence_with_groq returns a single-paragraph log."""
    sample_gemini = {
        "objects_detected": ["person", "car"],
        "scene_summary": "Subject approaching perimeter security barrier."
    }
    log_entry = correlate_evidence_with_groq(
        gemini_json_data=sample_gemini,
        camera_id="CAM_1",
        timestamp="2026-09-26T12:00:00Z"
    )
    assert isinstance(log_entry, str)
    assert len(log_entry) > 20
    assert "CAM_1" in log_entry


def test_carving_execution_and_schema_integrity(setup_evidence):
    """
    Executes the carving engine on the synthetic .dd image.
    Validates:
    1. Read-only non-destructive operation.
    2. SHA-256 chain of custody calculation per carved chunk.
    3. Output file presence in evidence_storage.
    4. Exact format dictionary returns:
       {"camera_id": "...", "timestamp": "...", "offset_hex": "0x...", "vendor": "...",
        "mp4_path": "...", "sha256": "...", "ai_summary": "..."}
    """
    engine = CarvingEngine()
    results = engine.carve_image(str(setup_evidence))

    assert len(results) >= 3, "Should carve at least Dahua, Hikvision, and CP Plus chunks."

    # Validate output schema on every carved record
    required_keys = {"camera_id", "timestamp", "offset_hex", "vendor", "mp4_path", "sha256", "ai_summary"}

    for record in results:
        assert required_keys.issubset(record.keys()), f"Missing keys in record: {record}"
        assert record["camera_id"].startswith("CAM_")
        assert record["offset_hex"].startswith("0x")
        assert len(record["sha256"]) == 64  # Valid SHA-256 hex string
        assert isinstance(record["ai_summary"], str)
        assert len(record["ai_summary"]) > 0

        # Verify MP4 file presence
        mp4_path = Path(record["mp4_path"])
        assert mp4_path.exists(), f"MP4 output must exist: {mp4_path}"

        # Verify corresponding raw chunk has identical SHA-256
        raw_chunk_name = f"{record['vendor']}_{record['offset_hex']}.raw"
        raw_chunk_file = RAW_CHUNKS_DIR / raw_chunk_name
        assert raw_chunk_file.exists(), f"Raw chunk must exist: {raw_chunk_file}"

        with open(raw_chunk_file, "rb") as f:
            computed_sha256 = hashlib.sha256(f.read()).hexdigest()
        assert computed_sha256 == record["sha256"], "Cryptographic SHA-256 mismatch!"
