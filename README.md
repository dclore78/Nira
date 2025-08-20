# NIRA — Local Windows App (Installer)

What you get
- Electron desktop app with only one visible window
- Windowless FastAPI backend EXE (PyInstaller)
- Headless Ollama auto-start and in-app model download
- Offline STT (Whisper) and TTS (pyttsx3)
- Cyan/blue brand + wordmark + splash
- NSIS installer (Next → Next → Install)

Prereqs (Windows)
- Node 18+
- Python 3.11+
- PowerShell

Build steps (first time)
1. Backend EXE
   - Open PowerShell at backend/ and run: `./build_backend.bat`
2. UI build
   - Open PowerShell at ui/ and run: `npm i && npm run build`
3. Electron installer
   - Open PowerShell at electron/ and run: `npm i && npm run build:win`

The installer will be at electron/dist/NIRA-Setup-1.0.0.exe (version may differ).

Runtime
- App starts backend and headless Ollama automatically.
- Pick a model from the dropdown; if not installed, it will download with progress.
- Your default avatar lives at backend/assets/avatar.jpg.
