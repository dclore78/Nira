from dataclasses import dataclass
from typing import List, Literal, Dict, Any, Optional
from pathlib import Path
import os
import json
import requests

Role = Literal["system", "user", "assistant"]

@dataclass
class Message:
    role: Role
    content: str

@dataclass
class ModelConfig:
    provider: Literal["ollama"]
    model: str
    base_url: str

def _resolve_config_path() -> Path:
    env_path = os.getenv("NYRA_CONFIG")
    if env_path and Path(env_path).is_file():
        return Path(env_path)
    here = Path(__file__).resolve().parent
    for c in [here / "config.local.json", here / "config.example.json"]:
        if c.is_file():
            return c
    raise FileNotFoundError("Nyra config not found. Set NYRA_CONFIG to your config.local.json.")

def load_config() -> Dict[str, Any]:
    with open(_resolve_config_path(), "r", encoding="utf-8-sig") as f:
        return json.load(f)

class LocalLLM:
    def __init__(self):
        cfg = load_config()
        self.default_model_key: str = cfg.get("default_model_key", "")
        self.models: Dict[str, ModelConfig] = {}
        models_raw = cfg.get("models", {})
        for key, m in models_raw.items():
            self.models[key] = ModelConfig(
                provider=m.get("provider", "ollama"),
                model=m["model"],
                base_url=m.get("base_url", "http://127.0.0.1:11434"),
            )
        if not self.models:
            # Provide a default to the local server
            self.models["local"] = ModelConfig(provider="ollama", model="llama3.1:8b-instruct", base_url="http://127.0.0.1:11434")
            self.default_model_key = "local"
        if self.default_model_key not in self.models:
            self.default_model_key = next(iter(self.models.keys()))
        self.session = requests.Session()

    def _post_ollama(self, base_url: str, model_name: str, messages: List[Message]) -> str:
        url = f"{base_url.rstrip('/')}/api/chat"
        payload = {
            "model": model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
        }
        r = self.session.post(url, json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        msg = data.get("message") or {}
        content = msg.get("content")
        if not isinstance(content, str):
            raise RuntimeError(f"Unexpected Ollama response: {data}")
        return content

    def generate(self, messages: List[Message], model_key: Optional[str] = None) -> str:
        key = model_key or self.default_model_key
        if key not in self.models:
            raise ValueError(f"Model key '{key}' not found in config")
        cfg = self.models[key]
        return self._post_ollama(cfg.base_url, cfg.model, messages)

    def generate_with_model_name(self, messages: List[Message], model_name: str, base_url: Optional[str] = None) -> str:
        base_url = base_url or next(iter(self.models.values())).base_url
        return self._post_ollama(base_url, model_name, messages)