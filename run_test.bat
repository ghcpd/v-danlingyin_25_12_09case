@echo off
REM Run the Node test runner
setlocal enableextensions enabledelayedexpansion
set SCRIPT_DIR=%~dp0
node "%SCRIPT_DIR%test_runner.js"
endlocal
