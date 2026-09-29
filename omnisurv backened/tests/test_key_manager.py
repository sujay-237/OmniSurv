from __future__ import annotations

import pytest

from app.key_manager import KeyRotator


def test_key_rotation_requires_keys(monkeypatch):
    monkeypatch.delenv("GROQ_KEYS", raising=False)
    rotator = KeyRotator()
    rotator._groq_keys = ["k1", "k2"]
    rotator._groq_cycle = __import__("itertools").cycle(rotator._groq_keys)
    assert rotator.next_groq_key() == "k1"
    assert rotator.next_groq_key() == "k2"

    rotator._groq_keys = []
    rotator._groq_cycle = None
    with pytest.raises(RuntimeError):
        rotator.next_groq_key()
