// auto_test.js — detects OS, runs platform-appropriate test script, writes logs
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const script = isWin ? 'run_test.bat' : './run_test.sh';
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const logFile = path.join(logsDir, 'test_run.log');

function timestamp() { return new Date().toISOString(); }

const child = spawn(script, [], { shell: true });

let out = '';
let err = '';
child.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
child.stderr.on('data', d => { err += d.toString(); process.stderr.write(d); });

child.on('close', code => {
  const status = code === 0 ? 'TEST PASSED' : 'TEST FAILED';
  const log = [
    `timestamp: ${timestamp()}`,
    `script: ${script}`,
    `exit_code: ${code}`,
    `status: ${status}`,
    '--- STDOUT ---',
    out.trim(),
    '--- STDERR ---',
    err.trim(),
    '\n'
  ].join('\n');
  fs.appendFileSync(logFile, log + '\n');
  console.log(`\nFinal status: ${status} — details written to ${logFile}`);
  process.exit(code);
});
