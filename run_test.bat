@echo off
REM run_test.bat - Test runner for Windows
REM Runs security tests on input_backup.ts (should fail) and input.ts (should pass)

setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "LOG_DIR=%PROJECT_DIR%logs"
set "LOG_FILE=%LOG_DIR%\test_run.log"

REM Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Initialize log file
(
  echo ==========================================
  echo Security Test Run Log
  echo Timestamp: %date% %time%
  echo ==========================================
  echo.
) > "%LOG_FILE%"

echo Running security tests...
echo Logs will be saved to: %LOG_FILE%
echo.

REM Run the main test.js script
node "%PROJECT_DIR%test.js" >> "%LOG_FILE%" 2>&1
set "TEST_EXIT_CODE=!ERRORLEVEL!"

REM Append final status to log
(
  echo.
  echo ==========================================
  if !TEST_EXIT_CODE! equ 0 (
    echo Final Status: TEST PASSED
  ) else (
    echo Final Status: TEST FAILED
  )
  echo End Timestamp: %date% %time%
  echo ==========================================
) >> "%LOG_FILE%"

exit /b %TEST_EXIT_CODE%
