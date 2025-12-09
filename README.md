# Security audit — input.ts

Files created and their purpose:

- `input_backup.ts` — backup copy of the original file (intentionally insecure)
- `input.ts` — hardened, fixed secure version
- `report.json` — JSON vulnerability report summarizing findings and fixes
- `test.js` — Node script that inspects a source file for insecure patterns (returns non-zero on fail)
- `test_runner.js` — runs `test.js` across two targets and reports pass rate
- `run_test.sh` / `run_test.bat` — platform-specific wrappers to run the test runner
- `auto_test.js` — auto test runner that detects OS, runs tests and appends results to `logs/test_run.log`

How to run tests

Linux / macOS:
```
./run_test.sh
node auto_test.js
```

Windows (PowerShell / cmd):
```
run_test.bat
node auto_test.js
```

Where to find logs

- Test run logs are appended to `logs/test_run.log`. Each entry contains a timestamp, stdout/stderr from the run, duration and final status (`TEST PASSED` or `TEST FAILED`).

Confirm security fixes

1. `input_backup.ts` contains the original insecure patterns (synchronous PBKDF2 calls and leaking env variable names). The tests will report FAIL on that file.
2. `input.ts` contains the hardened implementation (async PBKDF2, minimum iteration checks, sanitized private key path, and mitigations for username enumeration). The tests will report PASS on this file.
