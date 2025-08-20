#!/bin/bash

# NIRA Development Script
# Runs the application in development mode with hot reloading

set -e

echo "🚀 Starting NIRA in Development Mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the NIRA repository root"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up processes..."
    jobs -p | xargs -r kill
    exit
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Step 1: Start Backend in Development Mode
print_status "Starting backend server..."
cd backend

if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Start backend with reload
python server.py --reload &
BACKEND_PID=$!

cd ..

# Wait a moment for backend to start
sleep 3

# Step 2: Start UI in Development Mode
print_status "Starting UI development server..."
cd ui

if [ ! -d "node_modules" ]; then
    print_status "Installing UI dependencies..."
    npm install
fi

# Start UI dev server
npm run dev &
UI_PID=$!

cd ..

print_success "🎉 Development servers started!"
print_status "Backend: http://127.0.0.1:8000"
print_status "Frontend: http://localhost:3000"
print_status "Press Ctrl+C to stop all servers"

# Wait for all background jobs
wait