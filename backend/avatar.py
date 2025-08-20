from __future__ import annotations
import os
import subprocess
from typing import Optional
from shutil import which
import sys

CREATE_NO_WINDOW = 0x08000000 if sys.platform.startswith("win") else 0

def animate_avatar(image_path: str, audio_path: str, output_path: Optional[str] = None) -> str:
    if not os.path.isfile(image_path) or not os.path.isfile(audio_path):
        return image_path
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_file = output_path or f"animated_{base_name}.mp4"
    result_dir = os.path.dirname(out_file) or "."
    os.makedirs(result_dir, exist_ok=True)
    if which("sadtalker") is None:
        return image_path
    cmd = [
        "sadtalker",
        "--driven_audio", audio_path,
        "--source_image", image_path,
        "--result_dir", result_dir,
        "--result_name", os.path.basename(out_file),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
    except Exception:
        return image_path
    return out_file if os.path.isfile(out_file) else image_path