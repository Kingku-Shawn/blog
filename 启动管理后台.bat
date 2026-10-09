@echo off
title xiwnn Admin Panel
cd /d "%~dp0"
set "PY="
if exist "C:\Users\shaoj\AppData\Local\Programs\Python\Python310\python.exe" set "PY=C:\Users\shaoj\AppData\Local\Programs\Python\Python310\python.exe"
if "%PY%"=="" (where python >nul 2>nul && set "PY=python")
if "%PY%"=="" (
echo [ERROR] Python 3.8+ not found in PATH.
echo Install Python from https://www.python.org/downloads/ or edit this file.
pause
exit /b 1
)
echo Starting shawn admin panel at http://127.0.0.1:8124/admin/
echo Super admin: root / 123456    Admin: admin / 123456
echo Press Ctrl+C to stop
echo.
"%PY%" "%~dp0admin\server.py"
pause
