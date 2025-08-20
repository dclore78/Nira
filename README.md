# NIRA - Neural Interactive Response Assistant

A complete Windows desktop AI chat application with Electron frontend, FastAPI backend, and local AI model integration.

## Features

- **Modern Desktop Interface**: Electron-based app with cyan/blue themed UI
- **Local AI Integration**: Built-in support for Ollama models (Llama2, Mistral, CodeLlama)
- **Voice Processing**: Offline speech-to-text and text-to-speech capabilities
- **Avatar System**: Visual AI assistant with animation support
- **Journal Integration**: Built-in note-taking and thought tracking
- **Offline Operation**: No internet required after initial setup

## Quick Start

### Development Mode

1. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # OR
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   
   # Frontend
   cd ../ui
   npm install
   
   # Electron
   cd ../electron
   npm install
   ```

2. **Start Development Environment**:
   ```bash
   # Linux/Mac
   ./dev.sh
   
   # Windows
   dev.bat
   ```

   This starts:
   - Backend API server at `http://127.0.0.1:8000`
   - React dev server at `http://localhost:3000`
   - Auto-reload for both frontend and backend

### Production Build

```bash
# Linux/Mac
./build.sh

# Windows
build.bat
```

This creates a complete installer package in `electron/dist/`.

## Architecture

### Backend (`backend/`)
- **FastAPI Server** (`server.py`) - REST API for chat, models, and voice
- **Requirements** (`requirements.txt`) - Python dependencies
- **Voice Processing** - Whisper STT + pyttsx3 TTS (coming soon)
- **Model Management** - Ollama integration (coming soon)

### Frontend (`ui/`)
- **React + TypeScript** - Modern web stack with Vite
- **4-Panel Layout**: Sidebar navigation, chat area, avatar panel, journal
- **Real-time Chat** - WebSocket-ready architecture
- **Voice Recording** - Browser-based audio capture
- **Responsive Design** - Optimized for desktop use

### Electron (`electron/`)
- **Main Process** (`main.js`) - Backend lifecycle management
- **Window Management** - Single window with dev tools support
- **Resource Bundling** - Includes backend executable and UI assets
- **Cross-platform** - Windows, Linux, macOS support

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Send chat message
- `GET /api/models` - List available AI models
- `POST /api/models/{name}/download` - Download AI model
- `GET /api/conversation` - Get chat history
- `DELETE /api/conversation` - Clear chat history
- `POST /api/speech-to-text` - Convert speech to text
- `POST /api/text-to-speech` - Convert text to speech

## Development

### File Structure
```
├── backend/          # FastAPI server
│   ├── server.py     # Main API server
│   └── requirements.txt
├── ui/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/      # Utilities
│   │   └── App.tsx     # Main app
│   ├── package.json
│   └── vite.config.ts
├── electron/        # Electron wrapper
│   ├── main.js      # Main process
│   ├── preload.js   # Preload script
│   └── package.json
├── build.sh/.bat    # Build scripts
├── dev.sh          # Development script
└── README.md
```

### Adding Features

1. **Backend Features**: Add new endpoints in `backend/server.py`
2. **Frontend Components**: Create in `ui/src/components/`
3. **API Integration**: Update `ui/src/utils/api.ts`
4. **Electron Features**: Modify `electron/main.js`

## Roadmap

- [x] Basic chat interface
- [x] Model selection UI
- [x] Voice recording interface
- [x] Avatar panel with controls
- [x] Journal/notes system
- [x] Cross-platform build system
- [ ] Ollama integration
- [ ] Real voice processing (Whisper + TTS)
- [ ] Avatar animations (SadTalker)
- [ ] Model download progress
- [ ] Settings persistence
- [ ] Plugin system

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details
