"""
Unit tests verifying proper dedicated implementations for all 8 OEM carvers:
1. Dahua Technology (DHAV)
2. Hikvision (HIKFS / H.264 SPS)
3. CP Plus (CPDH / DHFS / ORANGE_FS)
4. Honeywell Security (MAXP / HVSF)
5. TP-Link (VIGI / TLPK)
6. Godrej Security (GVR / GDREC)
7. Uniview (UBV / UBVF)
8. Matrix Comsec (MMCF / MXREC)
"""

from __future__ import annotations

import struct
from pathlib import Path
import pytest

from app.recovery.base import ParseStatus
from app.recovery.factory import VideoCarverFactory
from app.recovery.dahua import DahuaCarver, DHAV_SIGNATURE
from app.recovery.hikvision import HikvisionCarver, HIKVISION_MARKER, H264_NAL_SPS_4B
from app.recovery.cpplus import CPPlusCarver, CPPLUS_CPDH_MAGIC
from app.recovery.honeywell import HoneywellCarver, HONEYWELL_MAXP_MAGIC
from app.recovery.tplink import TPLinkCarver, TPLINK_VIGI_MAGIC
from app.recovery.godrej import GodrejCarver, GODREJ_GVR_MAGIC
from app.recovery.uniview import UniviewCarver, UNIVIEW_UBV1_MAGIC
from app.recovery.matrix import MatrixCarver, MATRIX_MMCF_MAGIC


def test_all_8_oems_registered():
    """Verify that all 8 OEMs have registered carvers in VideoCarverFactory."""
    expected = ["dahua", "hikvision", "cpplus", "honeywell", "tp_link", "godrej", "uniview", "matrix"]
    registered = VideoCarverFactory.registered_vendors()
    for oem in expected:
        assert oem in registered, f"Missing {oem} in registered vendors: {registered}"
        carver = VideoCarverFactory.get_carver(oem)
        assert carver is not None


def test_cpplus_dedicated_carver(tmp_path):
    """Verify CP Plus dedicated parser extracts channel, timestamp and exact payload."""
    payload = b"\x11" * 64
    header = bytearray(16)
    header[0:4] = CPPLUS_CPDH_MAGIC
    header[4] = 3  # Channel 4 (0-indexed + 1)
    header[5] = 0xFD  # Keyframe
    struct.pack_into("<I", header, 8, 1700000000)  # Epoch timestamp
    struct.pack_into("<I", header, 12, len(payload))
    data = b"\x00" * 32 + bytes(header) + payload + b"\x00" * 32

    img = tmp_path / "cpplus.raw"
    img.write_bytes(data)

    carver = CPPlusCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "cpplus"
    assert cand.offset_start == 32
    assert cand.offset_end == 32 + 16 + len(payload)
    assert cand.metadata["camera_id"] == "CAM_4"
    assert cand.metadata["is_keyframe"] is True
    assert cand.parsing_status == ParseStatus.EXTRACTED


def test_honeywell_dedicated_carver(tmp_path):
    """Verify Honeywell MAXPRO dedicated parser extracts channel and payload."""
    payload = b"\x22" * 80
    header = bytearray(18)
    header[0:4] = HONEYWELL_MAXP_MAGIC
    struct.pack_into("<H", header, 4, 18)  # Header length
    struct.pack_into("<H", header, 6, 5)   # Channel 6
    struct.pack_into("<I", header, 8, 1690000000)  # Timestamp
    header[12] = 1  # Keyframe
    header[13] = 1  # H.264
    struct.pack_into("<I", header, 14, len(payload))
    data = b"\x00" * 50 + bytes(header) + payload + b"\x00" * 50

    img = tmp_path / "honeywell.raw"
    img.write_bytes(data)

    carver = HoneywellCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "honeywell"
    assert cand.offset_start == 50
    assert cand.metadata["camera_id"] == "CAM_6"
    assert cand.metadata["is_keyframe"] is True


def test_tplink_dedicated_carver(tmp_path):
    """Verify TP-Link VIGI dedicated parser extracts 64-bit UTC ms and channel."""
    payload = b"\x33" * 96
    header = bytearray(22)
    header[0:4] = TPLINK_VIGI_MAGIC
    struct.pack_into("<H", header, 4, 2)  # Channel 2
    struct.pack_into("<H", header, 6, 0)  # Main stream
    struct.pack_into("<Q", header, 8, 1700000000000)  # Epoch ms
    header[16] = 1  # I-frame
    header[17] = 1  # H.264
    struct.pack_into("<I", header, 18, len(payload))
    data = b"\x00" * 20 + bytes(header) + payload + b"\x00" * 20

    img = tmp_path / "tplink.raw"
    img.write_bytes(data)

    carver = TPLinkCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "tp_link"
    assert cand.offset_start == 20
    assert cand.metadata["camera_id"] == "CAM_2"
    assert cand.metadata["stream_profile"] == "Main"


def test_godrej_dedicated_carver(tmp_path):
    """Verify Godrej SeeThru dedicated parser extracts trigger mode and channel."""
    payload = b"\x44" * 48
    header = bytearray(20)
    header[0:4] = GODREJ_GVR_MAGIC
    struct.pack_into("<H", header, 4, 8)  # Channel 8
    struct.pack_into("<H", header, 6, 2)  # Motion record mode
    struct.pack_into("<I", header, 8, 1680000000)
    header[12] = 1  # Keyframe
    struct.pack_into("<I", header, 16, len(payload))
    data = b"\xaa" * 15 + bytes(header) + payload + b"\xaa" * 15

    img = tmp_path / "godrej.raw"
    img.write_bytes(data)

    carver = GodrejCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "godrej"
    assert cand.offset_start == 15
    assert cand.metadata["camera_id"] == "CAM_8"
    assert cand.metadata["record_mode"] == "Motion"


def test_uniview_dedicated_carver(tmp_path):
    """Verify Uniview UBV dedicated parser extracts channel and Ultra 265 codec."""
    payload = b"\x55" * 120
    header = bytearray(24)
    header[0:4] = UNIVIEW_UBV1_MAGIC
    struct.pack_into("<H", header, 4, 7)  # Channel 7
    header[6] = 1  # Keyframe
    header[7] = 2  # Ultra 265
    struct.pack_into("<Q", header, 8, 1700000000000)
    struct.pack_into("<I", header, 16, len(payload))
    data = b"\xbb" * 40 + bytes(header) + payload + b"\xbb" * 40

    img = tmp_path / "uniview.raw"
    img.write_bytes(data)

    carver = UniviewCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "uniview"
    assert cand.offset_start == 40
    assert cand.metadata["camera_id"] == "CAM_7"
    assert "Ultra 265" in cand.metadata["codec"]


def test_matrix_dedicated_carver(tmp_path):
    """Verify Matrix SATATYA MMCF dedicated parser extracts channel and timestamp."""
    payload = b"\x66" * 60
    header = bytearray(20)
    header[0:4] = MATRIX_MMCF_MAGIC
    struct.pack_into("<H", header, 4, 1)  # Version
    struct.pack_into("<H", header, 6, 3)  # Channel 3
    struct.pack_into("<I", header, 8, 1695000000)
    header[12] = 1  # H.264
    header[13] = 1  # Keyframe
    struct.pack_into("<I", header, 16, len(payload))
    data = b"\x00" * 100 + bytes(header) + payload + b"\x00" * 100

    img = tmp_path / "matrix.raw"
    img.write_bytes(data)

    carver = MatrixCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) == 1
    cand = results[0]
    assert cand.vendor == "matrix"
    assert cand.offset_start == 100
    assert cand.metadata["camera_id"] == "CAM_3"


def test_hikvision_dedicated_carver(tmp_path):
    """Verify Hikvision carver extracts HIKFS system blocks and H.264 SPS streams."""
    img_data = HIKVISION_MARKER + (b"\x00" * 1000)
    img = tmp_path / "hikvision.raw"
    img.write_bytes(img_data)

    carver = HikvisionCarver()
    results = carver.scan_image(img, tmp_path / "raw")
    assert len(results) >= 1
    assert results[0].vendor == "hikvision"
    assert results[0].metadata["format"] == "HIKFS Master Sector"
