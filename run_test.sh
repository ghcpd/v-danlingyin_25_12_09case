#!/bin/bash

# run_test.sh - Test runner for Linux/macOS
# Runs security tests on input_backup.ts (should fail) and input.ts (should pass)

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/test_run.log"

# Create logs directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Initialize log file
{
  echo "=========================================="
  echo "Security Test Run Log"
  echo "Timestamp: $(date)"
  echo "=========================================="
  echo ""
} > "${LOG_FILE}"

echo "Running security tests..."
echo "Logs will be saved to: ${LOG_FILE}"
echo ""

# Run the main test.js script
node "${PROJECT_DIR}/test.js" 2>&1 | tee -a "${LOG_FILE}"

TEST_EXIT_CODE=${PIPESTATUS[0]}

# Append final status to log
{
  echo ""
  echo "=========================================="
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "Final Status: TEST PASSED"
  else
    echo "Final Status: TEST FAILED"
  fi
  echo "End Timestamp: $(date)"
  echo "=========================================="
} >> "${LOG_FILE}"

exit $TEST_EXIT_CODE
