from __future__ import annotations
import os
import threading
from dataclasses import dataclass
from typing import Optional

try:
    import whisper  # type: ignore
    _HAS_WHISPER = True
except ImportError:
    _HAS_WHISPER = False

@dataclass
class SpeechTranscriber:
    use_whisper: bool = True
    whisper_model_name: str = "base"

    def __post_init__(self) -> None:
        if self.use_whisper and not _HAS_WHISPER:
            raise ImportError("Whisper is not installed. Install via `pip install -U openai-whisper`")
        self._lock = threading.Lock()
        self._whisper_model = None

    def _load_whisper(self) -> None:
        if self._whisper_model is None:
            download_root = os.getenv("WHISPER_MODEL_DIR")
            if download_root and os.path.isdir(download_root):
                self._whisper_model = whisper.load_model(self.whisper_model_name, download_root=download_root)
            else:
                self._whisper_model = whisper.load_model(self.whisper_model_name)

    def transcribe(self, audio_file: str) -> str:
        with self._lock:
            self._load_whisper()
            assert self._whisper_model is not None
            result = self._whisper_model.transcribe(audio_file)
            return result.get("text", "").strip()