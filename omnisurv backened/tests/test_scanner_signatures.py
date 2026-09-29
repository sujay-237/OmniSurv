from __future__ import annotations

import struct

from app.recovery.base import find_all, iter_image_buffers
from app.recovery.dahua import DHAV_SIGNATURE, DahuaCarver, DahuaHeaderConfig
from app.recovery.generic_h264 import NAL_SPS, GenericH264Carver


def _build_dhav_frame(payload: bytes, payload_len: int | None = None) -> bytes:
    length = payload_len if payload_len is not None else len(payload)
    header = bytearray(16)
    header[0:4] = DHAV_SIGNATURE
    struct.pack_into("<I", header, 12, length)
    return bytes(header) + payload


def test_buffer_boundary_dhav_detection(tmp_path):
    """DHAV split across 4MB boundary must still be detected."""
    buffer_size = 64
    overlap = 8
    split_at = buffer_size - 2
    part1 = b"\x00" * split_at + DHAV_SIGNATURE[:2]
    payload = b"\xab" * 32
    part2 = DHAV_SIGNATURE[2:] + (b"\x00" * 8) + struct.pack("<I", len(payload)) + payload
    data = part1 + part2
    image = tmp_path / "boundary.dd"
    image.write_bytes(data)

    hits: list[int] = []
    with image.open("rb") as handle:
        for base, buf in iter_image_buffers(handle, buffer_size, overlap):
            for rel in find_all(buf, DHAV_SIGNATURE):
                hits.append(base + rel)

    assert hits == [split_at]


def test_dahua_carver_absolute_offsets(tmp_path):
    payload = b"\xcc" * 40
    frame = _build_dhav_frame(payload)
    padding = b"\xff" * 100
    image = tmp_path / "dahua.dd"
    image.write_bytes(padding + frame + padding)

    carver = DahuaCarver(DahuaHeaderConfig())
    raw_dir = tmp_path / "raw"
    results = carver.scan_image(image, raw_dir)

    assert len(results) == 1
    cand = results[0]
    assert cand.offset_start == 100
    assert cand.offset_end == 100 + len(frame)
    assert cand.signature == DHAV_SIGNATURE.hex()


def test_h264_nal_detection(tmp_path):
    sps = NAL_SPS + b"\x01\x02"
    pps = b"\x00\x00\x00\x01\x68\x03\x04"
    gap = b"\x00" * 50
    stream = sps + pps + gap + NAL_SPS + b"\x05\x06"
    image = tmp_path / "h264.dd"
    image.write_bytes(stream)

    carver = GenericH264Carver()
    results = carver.scan_image(image, tmp_path / "raw")
    assert len(results) >= 1
    assert results[0].offset_start == 0
