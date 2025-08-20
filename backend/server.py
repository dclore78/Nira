from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
import uvicorn
from llm import LocalLLM, Message
from pathlib import Path
import json
import os
import uuid

try:
    from tts import TextToSpeechEngine
except Exception:
    TextToSpeechEngine = None
try:
    from stt import SpeechTranscriber
except Exception:
    SpeechTranscriber = None
try:
    from avatar import animate_avatar
except Exception:
    animate_avatar = None

from ollama_manager import (
    ensure_server, list_local_models, start_pull_job, get_pull_status, is_model_installed
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parent
UI_OUT_DIR = PROJECT_ROOT / "ui_out"
ASSETS_DIR = PROJECT_ROOT / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)
UI_OUT_DIR.mkdir(parents=True, exist_ok=True)
CHAT_LOG = UI_OUT_DIR / "chat.jsonl"
app.mount("/static", StaticFiles(directory=str(UI_OUT_DIR)), name="static")

DEFAULT_AVATAR = os.getenv("AVATAR_IMAGE_PATH", str(ASSETS_DIR / "avatar.jpg"))

_llm: Optional[LocalLLM] = None
_llm_init_error: Optional[str] = None
try:
    _llm = LocalLLM()
except Exception as e:
    _llm_init_error = str(e)

def _append_chat_line(speaker: str, message: str) -> None:
    try:
        line = {"speaker": speaker, "message": message}
        with CHAT_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    except Exception:
        pass

def _uniq_filename(suffix: str) -> str:
    return f"{uuid.uuid4().hex[:12]}{suffix}"

class ChatMessage(BaseModel):
    role: str
    content: str
    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in {"system", "user", "assistant"}:
            raise ValueError("role must be one of: system, user, assistant")
        return v

class ChatRequest(BaseModel):
    history: List[ChatMessage]

@app.get("/ollama/health")
def ollama_health():
    ok, err = ensure_server()
    return {"ok": ok, "error": err}

CATALOG = [
    "llama3.1:8b-instruct",
    "mistral:instruct",
    "phi3:mini-4k-instruct",
    "qwen2:7b-instruct",
    "neural-chat:7b-v3"
]

@app.get("/models/catalog")
def models_catalog():
    return {"models": CATALOG}

@app.get("/models/local")
def models_local():
    try:
        models = list_local_models()
        items = [{"name": m.get("name"), "size": m.get("size", 0)} for m in models if m.get("name")]
        return {"models": items}
    except Exception as e:
        return {"error": str(e), "models": []}

@app.post("/models/pull")
def models_pull(payload: dict):
    model = payload.get("model")
    if not model:
        return {"error": "model is required"}
    try:
        if is_model_installed(model):
            return {"job_id": None, "done": True, "progress": 100}
        job_id = start_pull_job(model)
        return {"job_id": job_id, "done": False, "progress": 0}
    except Exception as e:
        return {"error": str(e)}

@app.get("/models/pull/{job_id}")
def models_pull_status(job_id: str):
    return get_pull_status(job_id)

@app.post("/chat")
def chat(req: ChatRequest, model_name: Optional[str] = Query(default=None)):
    if _llm is None:
        return {"error": f"LLM not available. {_llm_init_error or 'Unknown initialization error.'}"}

    ok, err = ensure_server()
    if not ok:
        return {"error": f"Ollama not available: {err}"}

    messages = [Message(role=m.role, content=m.content) for m in req.history]
    user_text = req.history[-1].content if req.history else ""

    try:
        if model_name:
            reply = _llm.generate_with_model_name(messages, model_name)
        else:
            reply = _llm.generate(messages)
    except Exception as e:
        return {"error": f"LLM call failed: {e}"}

    if user_text:
        _append_chat_line("User", user_text)
    _append_chat_line("NIRA", reply)

    tts_url = None
    wav_path = None
    if TextToSpeechEngine is not None:
        try:
            tts = TextToSpeechEngine(engine="pyttsx3")
            wav_name = _uniq_filename(".wav")
            wav_path = UI_OUT_DIR / wav_name
            tts.speak_to_file(reply, str(wav_path))
            tts_url = f"/static/{wav_name}"
        except Exception:
            tts_url = None

    avatar_url = None
    try:
        portrait = Path(DEFAULT_AVATAR)
        if animate_avatar is not None and wav_path and portrait.is_file():
            out_name = _uniq_filename(".mp4")
            out_path = UI_OUT_DIR / out_name
            generated = animate_avatar(str(portrait), str(wav_path), str(out_path))
            gp = Path(generated)
            if gp.is_file() and gp.suffix.lower() == ".mp4":
                avatar_url = f"/static/{gp.name}"
            else:
                dest = UI_OUT_DIR / portrait.name
                if portrait.is_file():
                    if not dest.exists():
                        try:
                            dest.write_bytes(portrait.read_bytes())
                        except Exception:
                            pass
                    avatar_url = f"/static/{portrait.name}"
        else:
            if portrait.is_file():
                dest = UI_OUT_DIR / portrait.name
                if not dest.exists():
                    try:
                        dest.write_bytes(portrait.read_bytes())
                    except Exception:
                        pass
                avatar_url = f"/static/{portrait.name}"
    except Exception:
        avatar_url = None

    return {"reply": reply, "tts_url": tts_url, "avatar_url": avatar_url}

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    if SpeechTranscriber is None:
        return {"error": "STT not available: stt.py or dependencies not installed."}
    ext = Path(file.filename or "").suffix or ".webm"
    tmp_path = UI_OUT_DIR / _uniq_filename(ext)
    try:
        with open(tmp_path, "wb") as out:
            out.write(await file.read())
    except Exception as e:
        return {"error": f"Failed to save uploaded audio: {e}"}
    try:
        transcriber = SpeechTranscriber(use_whisper=True, whisper_model_name="base")
        text = transcriber.transcribe(str(tmp_path))
    except Exception as e:
        return {"error": f"STT failed: {e}"}
    if text:
        _append_chat_line("User", text)
    return {"text": text}

@app.get("/health")
def health():
    ok, err = ensure_server()
    return {"ok": True, "llm_ready": _llm is not None, "ollama_ok": ok, "ollama_error": err}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)