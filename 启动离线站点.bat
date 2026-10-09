@echo off
title shawn Offline Site
cd /d "%~dp0"
echo Starting offline site server...
echo Address: http://127.0.0.1:8123/www.shawn.com/index.html
echo Press Ctrl+C to stop
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
