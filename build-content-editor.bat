@echo off
cd /d "%~dp0"
echo Building Content Editor...
call npm install
call npm run build
echo Build complete!
pause 