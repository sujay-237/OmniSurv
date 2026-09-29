from __future__ import annotations

import hashlib

from app.hash_utils import stream_md5, stream_sha256


def test_stream_md5_and_sha256(tmp_path):
    payload = b"omnisurv-forensics-test-data"
    sample = tmp_path / "sample.bin"
    sample.write_bytes(payload)

    assert stream_md5(sample) == hashlib.md5(payload).hexdigest()
    assert stream_sha256(sample) == hashlib.sha256(payload).hexdigest()
