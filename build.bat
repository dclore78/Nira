@echo off
setlocal
echo === NIRA Windows Build Process ===

REM Step 1: Build Backend
echo Step 1: Building backend...
cd backend
IF NOT EXIST .venv (
  echo Creating Python virtual environment...
  py -3.11 -m venv .venv
)

echo Installing backend dependencies...
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

echo Building backend executable...
pyinstaller --noconfirm --onefile --noconsole ^
  --name nyra-backend ^
  --add-data "assets;assets" ^
  --add-data "config.example.json;." ^
  server.py

echo Backend built successfully!
cd ..

REM Step 2: Build UI
echo Step 2: Building UI...
cd ui
call npm install
call npm run build
echo UI built successfully!
cd ..

REM Step 3: Copy UI to Electron
echo Step 3: Copying UI to Electron...
if not exist electron\renderer mkdir electron\renderer
xcopy /E /Y ui\dist\* electron\renderer\
echo UI copied to Electron!

REM Step 4: Build Electron App
echo Step 4: Building Electron app...
cd electron
call npm install
call npm run prebuild

REM Copy backend executable
if not exist resources mkdir resources
copy ..\backend\dist\nyra-backend.exe resources\ 2>nul || echo Backend exe not found - will be copied during build

echo Building Windows installer...
call npm run build:win

echo === Build Complete ===
echo Installer should be available at: electron\dist\NIRA-Setup-*.exe
echo.
echo To run in development mode:
echo 1. Start backend: cd backend ^&^& .venv\Scripts\activate ^&^& python server.py
echo 2. Start UI: cd ui ^&^& npm run dev
echo 3. Start Electron: cd electron ^&^& npm run dev

pause