"""Gemini video analysis and Groq metadata correlation."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import GEMINI_FORENSIC_PROMPT
from app.key_manager import KeyRotator

logger = logging.getLogger(__name__)


def _parse_json_response(text: str) -> dict[str, Any]:
    """Safely parse model JSON; never raises to callers."""
    cleaned = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)```\s*$", cleaned, re.DOTALL | re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    return {
        "parse_error": True,
        "raw_excerpt": cleaned[:2000],
        "notes": "AI response was not valid JSON; stored raw excerpt for review.",
    }


def analyze_clip_with_ai(
    mp4_path: str,
    key_rotator: KeyRotator,
    *,
    enable_gemini: bool = True,
    enable_groq: bool = True,
) -> dict[str, Any]:
    """
    Run optional Gemini + Groq enrichment. Failures are captured in the returned dict.
    """
    result: dict[str, Any] = {
        "gemini": None,
        "groq_correlation": None,
        "gemini_error": None,
        "groq_error": None,
    }

    gemini_payload: dict[str, Any] | None = None

    if enable_gemini:
        try:
            raw = key_rotator.execute_gemini_video_task(mp4_path, GEMINI_FORENSIC_PROMPT)
            gemini_payload = _parse_json_response(raw)
            result["gemini"] = gemini_payload
        except Exception as exc:
            logger.warning("Gemini analysis failed for %s: %s", mp4_path, exc)
            result["gemini_error"] = str(exc)

    if enable_groq and gemini_payload is not None:
        try:
            prompt = (
                "Summarize and correlate the following forensic video metadata JSON "
                "for a multi-camera incident timeline. Reply in plain text, concise:\n"
                f"{json.dumps(gemini_payload, ensure_ascii=False)[:12000]}"
            )
            correlation = key_rotator.execute_groq_task(prompt)
            result["groq_correlation"] = correlation
        except Exception as exc:
            logger.warning("Groq correlation failed: %s", exc)
            result["groq_error"] = str(exc)

    return result


def format_ai_event_log(ai_result: dict[str, Any]) -> str:
    """Compact string stored on clip records and reports."""
    if ai_result.get("gemini_error") and not ai_result.get("gemini"):
        return f"AI unavailable: {ai_result['gemini_error']}"
    parts: list[str] = []
    if ai_result.get("gemini"):
        parts.append("Gemini: " + json.dumps(ai_result["gemini"], ensure_ascii=False)[:4000])
    if ai_result.get("groq_correlation"):
        parts.append("Groq: " + str(ai_result["groq_correlation"])[:2000])
    if ai_result.get("groq_error"):
        parts.append(f"Groq error: {ai_result['groq_error']}")
    return "\n".join(parts) if parts else "No AI metadata."
