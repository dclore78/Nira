from __future__ import annotations
import os
import time
import uuid
import threading
from pathlib import Path
from typing import Dict, Optional, Tuple, Any, List
import subprocess
import requests
import sys
from shutil import which

CREATE_NO_WINDOW = 0x08000000 if sys.platform.startswith("win") else 0
_OLLAMA_PROC = None
_PULL_JOBS: Dict[str, Dict[str, Any]] = {}
_PULL_LOCK = threading.Lock()

def _app_data_dir() -> Path:
    base = os.getenv("LOCALAPPDATA") or os.getenv("APPDATA") or str(Path.home() / ".nira")
    d = Path(base) / "NIRA"
    d.mkdir(parents=True, exist_ok=True)
    return d

def _default_env() -> dict:
    env = os.environ.copy()
    models_dir = _app_data_dir() / "ollama" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    env["OLLAMA_MODELS"] = str(models_dir)
    env.setdefault("OLLAMA_HOST", "127.0.0.1:11434")
    return env

def _find_ollama_binary() -> Optional[str]:
    env_bin = os.getenv("OLLAMA_BIN")
    if env_bin and Path(env_bin).is_file():
        return env_bin
    candidates = [
        Path(__file__).resolve().parent / "bin" / "ollama.exe",
        Path(__file__).resolve().parent / "bin" / "ollama",
    ]
    for c in candidates:
        if c.is_file():
            return str(c)
    return which("ollama")

def ensure_server(base_url: str = "http://127.0.0.1:11434") -> Tuple[bool, Optional[str]]:
    global _OLLAMA_PROC
    try:
        r = requests.get(f"{base_url.rstrip('/')}/api/version", timeout=2)
        if r.ok:
            return True, None
    except Exception:
        pass

    ollama_bin = _find_ollama_binary()
    if not ollama_bin:
        return False, "Ollama binary not found. It should be bundled at backend/bin/ollama.exe"

    try:
        _OLLAMA_PROC = subprocess.Popen(
            [ollama_bin, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            env=_default_env(),
            creationflags=CREATE_NO_WINDOW,
            close_fds=True
        )
    except Exception as e:
        return False, f"Failed to start Ollama: {e}"

    start = time.time()
    while time.time() - start < 20:
        try:
            r = requests.get(f"{base_url.rstrip('/')}/api/version", timeout=2)
            if r.ok:
                return True, None
        except Exception:
            time.sleep(0.4)
    return False, "Timed out waiting for Ollama to start."

def list_local_models(base_url: str = "http://127.0.0.1:11434") -> List[dict]:
    ok, err = ensure_server(base_url)
    if not ok:
        raise RuntimeError(err or "Ollama not available")
    r = requests.get(f"{base_url.rstrip('/')}/api/tags", timeout=15)
    r.raise_for_status()
    data = r.json()
    return data.get("models", [])

def _pull_runner(job_id: str, model: str, base_url: str) -> None:
    status = _PULL_JOBS[job_id]
    try:
        ok, err = ensure_server(base_url)
        if not ok:
            raise RuntimeError(err or "Ollama not available")
        url = f"{base_url.rstrip('/')}/api/pull"
        with requests.post(url, json={"name": model}, stream=True, timeout=600) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                try:
                    event = line.decode("utf-8")
                    import json as _json
                    evt = _json.loads(event)
                    with _PULL_LOCK:
                        status["raw"] = evt
                        status["status"] = evt.get("status") or status["status"]
                        total = evt.get("total") or status.get("total") or 0
                        comp = evt.get("completed") or status.get("completed") or 0
                        status["total"] = total
                        status["completed"] = comp
                        if total:
                            status["progress"] = min(100, int(comp * 100 / total))
                except Exception:
                    continue
        with _PULL_LOCK:
            status["done"] = True
            status["error"] = None
            status["progress"] = 100
    except Exception as e:
        with _PULL_LOCK:
            status["done"] = True
            status["error"] = str(e)

def start_pull_job(model: str, base_url: str = "http://127.0.0.1:11434") -> str:
    job_id = uuid.uuid4().hex[:12]
    with _PULL_LOCK:
        _PULL_JOBS[job_id] = {
            "model": model,
            "status": "starting",
            "progress": 0,
            "completed": 0,
            "total": 0,
            "done": False,
            "error": None,
        }
    t = threading.Thread(target=_pull_runner, args=(job_id, model, base_url), daemon=True)
    t.start()
    return job_id

def get_pull_status(job_id: str) -> Dict[str, Any]:
    with _PULL_LOCK:
        st = _PULL_JOBS.get(job_id)
        if not st:
            return {"error": "job not found"}
        return dict(st)

def is_model_installed(target: str, base_url: str = "http://127.0.0.1:11434") -> bool:
    models = list_local_models(base_url)
    names = {m.get("name") for m in models}
    return target in names

def stop_server():
    global _OLLAMA_PROC
    try:
        if _OLLAMA_PROC and _OLLAMA_PROC.poll() is None:
            _OLLAMA_PROC.terminate()
    except Exception:
        pass
    _OLLAMA_PROC = None