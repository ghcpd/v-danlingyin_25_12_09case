# Security Audit & Tests

Generated files and purpose:
- `input_backup.ts` — preserved insecure original (contains hardcoded secrets for demonstration).
- `input.ts` — secure, fixed version that loads secrets from env vars and uses safe comparisons.
- `report.json` — machine-readable vulnerability report covering detected issues.
- `test.js` — scanner that detects hardcoded secrets in a TypeScript file.
- `test_runner.js` — orchestrates tests: expects `input_backup.ts` to fail and `input.ts` to pass.
- `run_test.sh` / `run_test.bat` — wrapper scripts for running tests on Linux/macOS and Windows.
- `auto_test.js` — OS-aware runner that invokes the correct script and writes logs to `logs/test_run.log`.

How to run tests
- Linux/macOS: ./run_test.sh
- Windows: run_test.bat
- Or run `node auto_test.js` to auto-detect OS and log results.

How to read logs
- Logs are appended to `logs/test_run.log` with timestamp, script executed, stdout/stderr, and final status.

How to confirm security fixes
- `input.ts` is the secure copy — it uses environment variables for secrets and implements safe password verification.
- `test.js` will PASS on `input.ts` and FAIL on `input_backup.ts`.
- The JSON report (`report.json`) lists the vulnerabilities detected in the insecure copy and recommended fixes.
