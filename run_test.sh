#!/bin/bash
# run_test.sh - Test script for Linux/macOS

echo "======================================"
echo "Security Test Suite - Linux/macOS"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Run the test runner
node test_runner.js

# Capture exit code
EXIT_CODE=$?

echo ""
echo "Test execution completed with exit code: $EXIT_CODE"

exit $EXIT_CODE
