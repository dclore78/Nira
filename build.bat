@echo off
REM NIRA Build Script (Windows)
REM Builds the complete NIRA desktop application

echo 🚀 Building NIRA Desktop Application...

REM Check if we're in the right directory
if not exist "README.md" (
    echo [ERROR] Please run this script from the NIRA repository root
    exit /b 1
)

REM Check for required tools
echo [INFO] Checking for required tools...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is required but not installed
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but not installed
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is required but not installed
    exit /b 1
)

echo [SUCCESS] All required tools found

REM Step 1: Build Backend
echo [INFO] Building backend...
cd backend

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment and installing dependencies...
call venv\Scripts\activate
pip install -r requirements.txt

echo [INFO] Building backend executable with PyInstaller...
pyinstaller --onefile --windowed --name=server server.py

if not exist "dist\server.exe" (
    echo [ERROR] Backend build failed
    exit /b 1
)

echo [SUCCESS] Backend built successfully
cd ..

REM Step 2: Build UI
echo [INFO] Building React UI...
cd ui

echo [INFO] Installing UI dependencies...
npm install

echo [INFO] Building UI for production...
npm run build

if not exist "dist" (
    echo [ERROR] UI build failed
    exit /b 1
)

echo [SUCCESS] UI built successfully
cd ..

REM Step 3: Copy UI to Electron
echo [INFO] Copying UI to Electron...
cd electron

REM Create ui directory in electron if it doesn't exist
if not exist "ui" mkdir ui

REM Copy built UI
xcopy /E /I /Y ..\ui\dist ui\dist

echo [SUCCESS] UI copied to Electron

REM Step 4: Build Electron App
echo [INFO] Building Electron application...
npm install

REM Copy backend executable
if not exist "backend\dist" mkdir backend\dist
copy ..\backend\dist\server.exe backend\dist\

echo [INFO] Creating Electron package...
npm run build:win

echo [SUCCESS] Electron application built successfully
cd ..

REM Final success message
echo [SUCCESS] 🎉 NIRA build completed successfully!
echo [INFO] Built files are in the electron\dist directory
echo [INFO] Windows: Look for NIRA Setup.exe
echo [INFO] You can now distribute the installer file!

pause