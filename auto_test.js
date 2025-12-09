#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const script = isWindows ? 'run_test.bat' : 'run_test.sh';
const scriptPath = path.resolve(__dirname, script);

if (!fs.existsSync(scriptPath)) {
  console.error('Test script not found:', scriptPath);
  process.exit(2);
}

const logDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'test_run.log');

const startTime = new Date();
let r;
if (process.platform === 'win32') {
  // run batch file via cmd
  r = spawnSync('cmd.exe', ['/c', scriptPath], { encoding: 'utf8' });
} else {
  // run shell script with bash
  r = spawnSync('bash', [scriptPath], { encoding: 'utf8' });
}

const endTime = new Date();
const status = r.status === 0 ? 'TEST PASSED' : 'TEST FAILED';

const entry = {
  timestamp: startTime.toISOString(),
  duration_ms: endTime - startTime,
  tested_script: script,
  stdout: r.stdout,
  stderr: r.stderr,
  final_status: status
};

fs.appendFileSync(logFile, JSON.stringify(entry, null, 2) + '\n');

console.log('Auto test runner finished:', status);
console.log('Log written to', logFile);
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);

process.exit(r.status === 0 ? 0 : 1);
