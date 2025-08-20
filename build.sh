#!/bin/bash

# NIRA Build Script (Linux/Mac)
# Builds the complete NIRA desktop application

set -e

echo "🚀 Building NIRA Desktop Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the NIRA repository root"
    exit 1
fi

# Check for required tools
print_status "Checking for required tools..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi

print_success "All required tools found"

# Step 1: Build Backend
print_status "Building backend..."
cd backend

if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

print_status "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

print_status "Building backend executable with PyInstaller..."
pyinstaller --onefile --windowed --name=server server.py

if [ ! -f "dist/server" ]; then
    print_error "Backend build failed"
    exit 1
fi

print_success "Backend built successfully"
cd ..

# Step 2: Build UI
print_status "Building React UI..."
cd ui

print_status "Installing UI dependencies..."
npm install

print_status "Building UI for production..."
npm run build

if [ ! -d "dist" ]; then
    print_error "UI build failed"
    exit 1
fi

print_success "UI built successfully"
cd ..

# Step 3: Copy UI to Electron
print_status "Copying UI to Electron..."
cd electron

# Create ui directory in electron if it doesn't exist
mkdir -p ui

# Copy built UI
cp -r ../ui/dist ui/

print_success "UI copied to Electron"

# Step 4: Build Electron App
print_status "Building Electron application..."
npm install

# Copy backend executable
mkdir -p backend/dist
cp ../backend/dist/server backend/dist/

print_status "Creating Electron package..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npm run build:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    npm run build:linux
else
    print_warning "Unknown OS, trying generic build..."
    npm run build
fi

print_success "Electron application built successfully"
cd ..

# Final success message
print_success "🎉 NIRA build completed successfully!"
print_status "Built files are in the electron/dist directory"

if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "macOS: Look for NIRA.dmg"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Linux: Look for NIRA.AppImage"
fi

print_status "You can now distribute the installer file!"