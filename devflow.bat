@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set "TARGET_DIR=%~dp0"
if "%TARGET_DIR:~-1%"=="\" set "TARGET_DIR=%TARGET_DIR:~0,-1%"
"C:\miniconda\python.exe" "C:\Users\long\.gemini\antigravity\scratch\rigorous-dev-workflow\cli.py" %* --target-dir "%TARGET_DIR%"
