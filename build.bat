@echo off
REM Sharepoint Video Catcher - Build Script Wrapper
REM 
REM This batch file is a simple wrapper around the PowerShell build script.
REM It provides an easy way to build the extension without having to manually run PowerShell.
REM
REM Usage: Simply double-click this file to run it.
REM
REM @author Sharepoint Video Catcher Team
REM @version 1.0.0
REM @license MIT

echo Sharepoint Video Catcher - Build Process
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell is not installed or not in your PATH.
    echo Please install PowerShell to continue.
    goto :error
)

echo Building extension...
PowerShell -ExecutionPolicy Bypass -File "%~dp0build.ps1" -Version 1.0.0

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Build process failed. Check the output above for details.
    goto :error
)

echo.
echo Extension built successfully!
echo The package is available in the dist directory.
echo.
echo Press any key to exit.
pause > nul
exit /b 0

:error
echo.
echo Build process terminated with errors.
echo.
echo Press any key to exit.
pause > nul
exit /b 1
