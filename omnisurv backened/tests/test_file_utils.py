from __future__ import annotations

import pytest

from app.file_utils import sanitize_upload_filename


def test_sanitize_strips_path_traversal():
    assert sanitize_upload_filename("../../evil.dd") == "evil.dd"
    assert sanitize_upload_filename("nested/path/image.img") == "image.img"


def test_sanitize_rejects_invalid():
    with pytest.raises(ValueError):
        sanitize_upload_filename("../..")
