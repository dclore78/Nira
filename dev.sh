#!/bin/bash
# Development mode for NIRA

echo "=== NIRA Development Mode ==="

# Function to cleanup background processes
cleanup() {
  echo "Cleaning up..."
  pkill -f "python.*mock_backend.py" 2>/dev/null || true
  pkill -f "npm run dev" 2>/dev/null || true
  exit 0
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start mock backend
echo "Starting mock backend on port 5000..."
python3 << 'EOF' &
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

class MockHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        path = urlparse(self.path).path
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if path == '/health':
            response = {'ok': True, 'llm_ready': True, 'ollama_ok': True}
        elif path == '/ollama/health':
            response = {'ok': True}
        elif path == '/models/catalog':
            response = {'models': ['llama3.1:8b-instruct', 'mistral:instruct', 'phi3:mini-4k-instruct']}
        elif path == '/models/local':
            response = {'models': [{'name': 'llama3.1:8b-instruct', 'size': 4700000000}]}
        else:
            response = {'error': 'Not found'}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        path = urlparse(self.path).path
        if path == '/chat':
            response = {'reply': 'Hello! This is a mock response from NIRA.', 'tts_url': None, 'avatar_url': None}
        elif path == '/stt':
            response = {'text': 'Mock speech recognition result'}
        else:
            response = {'error': 'Not found'}
        
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        pass  # Suppress logs

server = HTTPServer(('127.0.0.1', 5000), MockHandler)
print("Mock backend running on http://127.0.0.1:5000")
server.serve_forever()
EOF

BACKEND_PID=$!
sleep 2

# Start UI dev server
echo "Starting UI dev server on port 5173..."
cd ui
npm run dev &
UI_PID=$!

echo ""
echo "Development servers running:"
echo "- Backend (mock): http://127.0.0.1:5000"
echo "- UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait