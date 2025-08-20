# NIRA — Local Windows App (Installer)

What you get
- Electron desktop app with only one visible window
- Windowless FastAPI backend EXE (PyInstaller)
- Headless Ollama auto-start and in-app model download
- Offline STT (Whisper) and TTS (pyttsx3)
- Cyan/blue brand + wordmark + splash
- NSIS installer (Next → Next → Install)

## Prerequisites
- **Node.js 18+** (download from [nodejs.org](https://nodejs.org))
- **Python 3.11+** (download from [python.org](https://python.org))
- **PowerShell** (included with Windows)

## First Time Setup

Before building, you need to install dependencies:

1. **Install UI dependencies:**
   ```bash
   cd ui
   npm install
   ```

2. **Install Electron dependencies:**
   ```bash
   cd electron
   npm install
   ```

3. **Install Python backend dependencies:**
   ```bash
   cd backend
   python -m pip install -r requirements.txt
   ```

## Quick Build (Automated)

**Windows:**
```bat
build.bat
```

**Linux/MacOS:**
```bash
./build.sh
```

The installer will be at `electron/dist/NIRA-Setup-1.0.0.exe`

## Manual Build Steps

1. **Backend EXE**
   ```bat
   cd backend
   build_backend.bat
   ```

2. **UI build**
   ```bash
   cd ui
   npm i && npm run build
   ```

3. **Electron installer**
   ```bash
   cd electron
   npm i && npm run build:win
   ```

## Development Mode

For testing and development:
```bash
./dev.sh
```

This starts mock backend + UI dev server.

## Manual Development Setup

1. **Start Mock Backend:**
   ```bash
   python3 /tmp/mock_backend.py
   ```

2. **Start UI Dev:**
   ```bash
   cd ui && npm run dev
   ```

3. **Start Electron (optional):**
   ```bash
   cd electron && npm run dev
   ```

## Runtime
- App starts backend and headless Ollama automatically
- Pick a model from the dropdown; if not installed, it will download with progress
- Default avatar: `backend/assets/avatar.jpg`
- Models stored in `%LOCALAPPDATA%\NIRA\ollama\models`

## Project Structure
```
backend/          FastAPI server, Ollama manager, TTS/STT
ui/              React + Vite + TypeScript frontend  
electron/        Electron wrapper + installer config
build.sh/.bat    Automated build scripts
dev.sh           Development mode script
```

## Key Features
- ✅ Single window Electron app (no tray icons)
- ✅ Headless backend and Ollama processes
- ✅ In-app model selector with download progress
- ✅ Voice pipeline: mic → STT → LLM → TTS
- ✅ Modern cyan/blue theme with custom fonts
- ✅ Offline operation (fonts bundled locally)
- ✅ NSIS installer with standard Windows wizard
