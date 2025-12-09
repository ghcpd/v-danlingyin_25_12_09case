// auto_test.js - Automatic test runner with OS detection and logging
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Ensure logs directory exists
 */
function ensureLogsDirectory() {
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Detect operating system and return appropriate test script
 */
function getTestScript() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return {
      name: 'run_test.bat',
      command: 'run_test.bat',
      os: 'Windows'
    };
  } else if (platform === 'darwin' || platform === 'linux') {
    return {
      name: 'run_test.sh',
      command: 'bash run_test.sh',
      os: platform === 'darwin' ? 'macOS' : 'Linux'
    };
  } else {
    return {
      name: 'unknown',
      command: null,
      os: platform
    };
  }
}

/**
 * Write log entry
 */
function writeLog(logsDir, logContent) {
  const logFile = path.join(logsDir, 'test_run.log');
  const logEntry = `\n${'='.repeat(80)}\n${logContent}\n${'='.repeat(80)}\n`;
  
  fs.appendFileSync(logFile, logEntry, 'utf8');
  return logFile;
}

/**
 * Run the test script
 */
function runTest() {
  console.log('='.repeat(80));
  console.log('AUTOMATIC TEST RUNNER');
  console.log('='.repeat(80));
  
  const startTime = getTimestamp();
  console.log(`Start Time: ${startTime}`);
  
  // Detect OS
  const testScript = getTestScript();
  console.log(`Detected OS: ${testScript.os}`);
  console.log(`Test Script: ${testScript.name}`);
  
  if (!testScript.command) {
    console.error(`ERROR: Unsupported operating system: ${testScript.os}`);
    process.exit(1);
  }
  
  // Ensure logs directory exists
  const logsDir = ensureLogsDirectory();
  console.log(`Logs Directory: ${logsDir}`);
  console.log('='.repeat(80));
  
  // Execute test script
  console.log(`\nRunning: ${testScript.command}\n`);
  
  exec(testScript.command, { cwd: __dirname }, (error, stdout, stderr) => {
    const endTime = getTimestamp();
    const exitCode = error ? error.code : 0;
    const status = exitCode === 0 ? 'TEST PASSED' : 'TEST FAILED';
    
    // Prepare log content
    let logContent = '';
    logContent += `Timestamp: ${startTime}\n`;
    logContent += `End Time: ${endTime}\n`;
    logContent += `Operating System: ${testScript.os}\n`;
    logContent += `Test Script: ${testScript.name}\n`;
    logContent += `Tested Files: input_backup.ts, input.ts\n`;
    logContent += `\nOutput:\n${'-'.repeat(80)}\n`;
    logContent += stdout;
    
    if (stderr) {
      logContent += `\nErrors:\n${'-'.repeat(80)}\n`;
      logContent += stderr;
    }
    
    logContent += `\n${'-'.repeat(80)}\n`;
    logContent += `Exit Code: ${exitCode}\n`;
    logContent += `Final Status: ${status}\n`;
    
    // Write to log file
    const logFile = writeLog(logsDir, logContent);
    
    // Display results
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST EXECUTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Status: ${status}`);
    console.log(`Exit Code: ${exitCode}`);
    console.log(`Log File: ${logFile}`);
    console.log('='.repeat(80));
    
    process.exit(exitCode);
  });
}

// Run if called directly
if (require.main === module) {
  runTest();
}

module.exports = { runTest, getTestScript, ensureLogsDirectory };
