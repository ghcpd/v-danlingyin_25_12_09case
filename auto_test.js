const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * auto_test.js - Automatic test runner that detects OS and runs appropriate test script
 * Saves results to logs/test_run.log
 */

const isWindows = process.platform === 'win32';
const projectDir = __dirname;
const logsDir = path.join(projectDir, 'logs');
const logFile = path.join(logsDir, 'test_run.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

console.log('====================================');
console.log('   AUTOMATIC SECURITY TEST RUNNER');
console.log('====================================\n');

console.log(`Detected OS: ${isWindows ? 'Windows' : 'Linux/macOS'}`);
console.log(`Project Directory: ${projectDir}`);
console.log(`Log File: ${logFile}\n`);

let testScript;
if (isWindows) {
  testScript = path.join(projectDir, 'run_test.bat');
} else {
  testScript = path.join(projectDir, 'run_test.sh');
}

if (!fs.existsSync(testScript)) {
  console.error(`✗ ERROR: Test script not found: ${testScript}`);
  process.exit(1);
}

console.log(`Executing: ${path.basename(testScript)}\n`);

try {
  // Log header
  const logHeader = `
==========================================
Automatic Security Test Run
Timestamp: ${new Date().toISOString()}
OS: ${isWindows ? 'Windows' : 'Linux/macOS'}
Test Script: ${testScript}
==========================================

`;

  fs.appendFileSync(logFile, logHeader);

  // Execute test script
  let command;
  if (isWindows) {
    command = `cmd /c "${testScript}"`;
  } else {
    command = `bash "${testScript}"`;
  }

  const output = execSync(command, {
    cwd: projectDir,
    encoding: 'utf-8',
    stdio: 'pipe',
    shell: isWindows ? 'cmd.exe' : '/bin/bash'
  });

  // Write output to console and log file
  console.log(output);
  fs.appendFileSync(logFile, output);

  // Log footer
  const logFooter = `
==========================================
Final Status: TEST PASSED
End Timestamp: ${new Date().toISOString()}
==========================================
`;

  fs.appendFileSync(logFile, logFooter);
  console.log('✓ Tests passed successfully!');
  process.exit(0);
} catch (err) {
  // Write error to log file
  const errorOutput = `${err.stdout || ''}
Error executing test script: ${err.message}

==========================================
Final Status: TEST FAILED
End Timestamp: ${new Date().toISOString()}
==========================================
`;

  fs.appendFileSync(logFile, errorOutput);

  console.error('✗ Tests failed!');
  console.error('See logs/test_run.log for details');
  process.exit(1);
}
