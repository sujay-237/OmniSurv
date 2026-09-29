"""FFmpeg subprocess wrapper for lossless remux to MP4."""

from __future__ import annotations

import logging
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class FFmpegResult:
    success: bool
    output_path: str | None
    stderr: str
    stdout: str


def _ffmpeg_path() -> str:
    path = shutil.which("ffmpeg")
    if not path:
        raise FileNotFoundError(
            "ffmpeg executable not found on PATH. Install FFmpeg to remux clips."
        )
    return path


def remux_h264_to_mp4(
    input_path: str | Path,
    output_path: str | Path,
    *,
    input_format: str = "h264",
) -> FFmpegResult:
    """
    Lossless remux: stream copy only (-c:v copy), no transcoding.
    """
    inp = Path(input_path)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        _ffmpeg_path(),
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        input_format,
        "-i",
        str(inp.resolve()),
        "-c:v",
        "copy",
        "-movflags",
        "+faststart",
        str(out.resolve()),
    ]

    try:
        completed = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        logger.warning("FFmpeg timed out for %s", inp.name)
        if out.exists():
            out.unlink(missing_ok=True)
        return FFmpegResult(False, None, "FFmpeg timed out", "")
    except FileNotFoundError as exc:
        return FFmpegResult(False, None, str(exc), "")

    if completed.returncode != 0 or not out.is_file() or out.stat().st_size == 0:
        logger.warning(
            "FFmpeg remux failed for %s: %s",
            inp.name,
            completed.stderr.strip() or completed.stdout.strip(),
        )
        if out.exists():
            out.unlink(missing_ok=True)
        return FFmpegResult(
            success=False,
            output_path=None,
            stderr=completed.stderr,
            stdout=completed.stdout,
        )

    return FFmpegResult(
        success=True,
        output_path=str(out.resolve()),
        stderr=completed.stderr,
        stdout=completed.stdout,
    )
