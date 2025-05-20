@echo off
PowerShell -ExecutionPolicy Bypass -File "%~dp0build.ps1" -Version 1.0.0
echo.
echo Extension built successfully! Press any key to exit.
pause > nul
