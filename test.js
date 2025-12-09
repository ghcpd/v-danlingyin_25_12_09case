// test.js — scans a TypeScript file for common hardcoded secret patterns
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node test.js <file.ts>');
  process.exit(2);
}

const file = process.argv[2];
if (!file) usage();
const content = fs.readFileSync(file, 'utf8');

const findings = [];
const lines = content.split(/\r?\n/);

function record(lineNumber, reason) { findings.push({ lineNumber, reason }); }

// patterns
const patterns = [
  { re: /(sk_live|sk_test)_[A-Za-z0-9_-]{8,}/g, reason: 'Hardcoded API key' },
  { re: /postgres:\/\/.+?:.+?@/g, reason: 'Hardcoded DB credentials in connection string' },
  { re: /JWT_SECRET\s*=|JWT_SECRET\s*:/g, reason: 'JWT secret assignment' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, reason: 'Private key block' },
  { re: /ADMIN_PASSWORD\s*=|ADMIN_USER\s*=|password123/g, reason: 'Hardcoded admin credentials or weak password' },
  { re: /===\s*['\"][^'\"]+['\"]/g, reason: 'Plaintext password comparison' }
];

lines.forEach((ln, idx) => {
  for (const p of patterns) {
    if (p.re.test(ln)) record(idx + 1, p.reason);
    p.re.lastIndex = 0;
  }
});

if (findings.length) {
  console.error('FAIL: Hardcoded secrets or insecure patterns detected:');
  findings.forEach(f => console.error(`  line ${f.lineNumber}: ${f.reason}`));
  process.exit(1);
}

console.log('PASS: No obvious hardcoded secrets detected');
process.exit(0);
