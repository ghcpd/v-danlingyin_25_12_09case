// test_runner.js — runs test.js for multiple items and reports pass rate
const { spawnSync } = require('child_process');

const tests = [
  { file: 'input_backup.ts', expectPass: false },
  { file: 'input.ts', expectPass: true }
];

let passed = 0;
let total = tests.length;

for (const t of tests) {
  const cmd = 'node';
  const args = ['test.js', t.file];
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  const ok = res.status === 0;
  const expected = t.expectPass;
  const testPassed = ok === expected;
  console.log(`${t.file}: expectPass=${expected} -> ${testPassed ? 'PASS' : 'FAIL'}`);
  if (!testPassed) {
    console.log('  stdout:', res.stdout);
    console.log('  stderr:', res.stderr);
  } else passed++;
}

const rate = Math.round((passed / total) * 100);
console.log(`\nSummary: ${passed}/${total} passed — ${rate}%`);

process.exit(passed === total ? 0 : 1);
