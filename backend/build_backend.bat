@echo off
setlocal
cd /d %~dp0

IF NOT EXIST .venv (
  py -3.11 -m venv .venv
)
call .venv\Scripts\activate

python -m pip install --upgrade pip wheel
pip install -r requirements.txt
pip install pyinstaller

REM Bundle any assets and config (avatar, etc.)
pyinstaller --noconfirm --onefile --noconsole ^
  --name nyra-backend ^
  --add-data "assets;assets" ^
  server.py

echo Built backend exe at dist\nyra-backend.exe