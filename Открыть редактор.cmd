@echo off
cd /d "%~dp0"
set "emotion_node=node"
where node >nul 2>nul
if errorlevel 1 set "emotion_node=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%emotion_node%" tools\build-export.cjs
if errorlevel 1 exit /b 1
start "" "http://127.0.0.1:8937/editor.html"
"%emotion_node%" serve.cjs
pause
