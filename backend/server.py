#!/usr/bin/env python3
"""
NIRA FastAPI Backend Server
Main server providing REST API for chat, model management, and voice processing.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
import asyncio
import subprocess
import tempfile
import base64

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="NIRA API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static assets
assets_dir = Path(__file__).parent / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# Data models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "llama2"
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    model: str
    timestamp: str

class ModelInfo(BaseModel):
    name: str
    size: str
    available: bool
    downloading: bool = False
    progress: float = 0.0

# Global state
conversation_history: List[ChatMessage] = []
available_models = {
    "llama2": ModelInfo(name="llama2", size="3.8GB", available=False),
    "mistral": ModelInfo(name="mistral", size="4.1GB", available=False),
    "codellama": ModelInfo(name="codellama", size="3.8GB", available=False),
}

@app.get("/")
async def root():
    """Root endpoint returning API info."""
    return {"message": "NIRA Backend API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "NIRA backend is running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that processes user messages and returns AI responses.
    For now, returns mock responses. Will integrate with Ollama later.
    """
    from datetime import datetime
    
    # Mock AI response for now
    mock_responses = [
        "Hello! I'm NIRA, your AI assistant. How can I help you today?",
        "That's an interesting question. Let me think about that...",
        "I understand what you're asking. Here's my perspective on that topic.",
        "Great point! I'd be happy to help you with that.",
        "Thanks for sharing that with me. Here's what I think...",
    ]
    
    import random
    response_text = random.choice(mock_responses)
    
    # Add to conversation history
    user_message = ChatMessage(
        role="user", 
        content=request.message,
        timestamp=datetime.now().isoformat()
    )
    ai_message = ChatMessage(
        role="assistant", 
        content=response_text,
        timestamp=datetime.now().isoformat()
    )
    
    conversation_history.extend([user_message, ai_message])
    
    return ChatResponse(
        response=response_text,
        model=request.model or "llama2",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/models", response_model=List[ModelInfo])
async def get_models():
    """Get list of available AI models."""
    return list(available_models.values())

@app.post("/api/models/{model_name}/download")
async def download_model(model_name: str):
    """
    Start downloading a specific model.
    For now, this is a mock implementation.
    """
    if model_name not in available_models:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Mock download process
    available_models[model_name].downloading = True
    available_models[model_name].progress = 0.0
    
    # Simulate download progress (in real implementation, this would be async)
    import time
    for progress in range(0, 101, 10):
        available_models[model_name].progress = progress
        time.sleep(0.1)  # Simulate download time
    
    available_models[model_name].downloading = False
    available_models[model_name].available = True
    
    return {"status": "completed", "model": model_name}

@app.get("/api/conversation")
async def get_conversation():
    """Get the current conversation history."""
    return {"messages": conversation_history}

@app.delete("/api/conversation")
async def clear_conversation():
    """Clear the conversation history."""
    global conversation_history
    conversation_history = []
    return {"status": "cleared"}

@app.post("/api/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Convert speech audio to text using Whisper.
    For now, returns a mock transcription.
    """
    # Mock transcription for now
    mock_transcriptions = [
        "Hello, can you help me with my project?",
        "What's the weather like today?",
        "Tell me about artificial intelligence.",
        "How do I learn to code?",
        "What are your capabilities?",
    ]
    
    import random
    transcription = random.choice(mock_transcriptions)
    
    return {"transcription": transcription}

@app.post("/api/text-to-speech")
async def text_to_speech(request: dict):
    """
    Convert text to speech using pyttsx3.
    Returns audio data encoded as base64.
    """
    text = request.get("text", "")
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    # Mock audio response for now
    # In real implementation, this would generate actual audio
    mock_audio_b64 = "UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAA="
    
    return {
        "audio": mock_audio_b64,
        "format": "wav",
        "text": text
    }

def main():
    """Main entry point for the server."""
    import argparse
    
    parser = argparse.ArgumentParser(description="NIRA Backend Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    logger.info(f"Starting NIRA Backend Server on {args.host}:{args.port}")
    
    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()