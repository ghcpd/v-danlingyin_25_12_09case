#!/usr/bin/env bash
set -euo pipefail

# Runs the test runner
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/test_runner.js"
