#!/bin/bash
# Build script for NIRA - complete build process

set -e

echo "=== NIRA Build Process ==="

# Step 1: Build Backend
echo "Step 1: Building backend..."
cd backend
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Installing backend dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

echo "Building backend executable..."
pyinstaller --noconfirm --onefile --noconsole \
  --name nyra-backend \
  --add-data "assets:assets" \
  --add-data "config.example.json:." \
  server.py

echo "Backend built successfully!"
cd ..

# Step 2: Build UI
echo "Step 2: Building UI..."
cd ui
npm install
npm run build
echo "UI built successfully!"
cd ..

# Step 3: Copy UI to Electron
echo "Step 3: Copying UI to Electron..."
mkdir -p electron/renderer
cp -r ui/dist/* electron/renderer/
echo "UI copied to Electron!"

# Step 4: Build Electron App
echo "Step 4: Building Electron app..."
cd electron
npm install
npm run prebuild

# Copy backend executable
mkdir -p resources
cp ../backend/dist/nyra-backend.exe resources/ 2>/dev/null || echo "Backend exe not found - will be copied during build"

echo "Building Windows installer..."
npm run build:win

echo "=== Build Complete ==="
echo "Installer should be available at: electron/dist/NIRA-Setup-*.exe"
echo ""
echo "To run in development mode:"
echo "1. Start backend: cd backend && source .venv/bin/activate && python server.py"
echo "2. Start UI: cd ui && npm run dev"
echo "3. Start Electron: cd electron && npm run dev"