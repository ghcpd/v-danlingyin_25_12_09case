#!/usr/bin/env node
// test_runner.js — runs tests (expect pass/fail) and prints pass rate
const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  { file: 'input_backup.ts', expect: 'FAIL' },
  { file: 'input.ts', expect: 'PASS' }
];

let passed = 0;
tests.forEach((t) => {
  const filePath = path.resolve(t.file);
  const res = spawnSync(process.execPath, [path.resolve(__dirname, 'test.js'), filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const ok = (res.status === 0 && t.expect === 'PASS') || (res.status !== 0 && t.expect === 'FAIL');
  const statusStr = ok ? 'OK' : 'UNEXPECTED';
  console.log(`${t.file}: ${statusStr} (expected ${t.expect})`);
  if (ok) passed += 1;
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
});

const rate = (passed / tests.length) * 100;
console.log(`\nResult: ${passed}/${tests.length} tests passed (${rate.toFixed(0)}%)`);

if (passed !== tests.length) process.exit(1);
process.exit(0);
