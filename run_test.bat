@echo off
REM run_test.bat - Test script for Windows

echo ======================================
echo Security Test Suite - Windows
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    exit /b 1
)

REM Run the test runner
node test_runner.js

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo Test execution completed with exit code: %EXIT_CODE%

exit /b %EXIT_CODE%
