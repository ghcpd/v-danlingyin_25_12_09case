#!/usr/bin/env node
// test.js — checks a TypeScript source file for insecure patterns
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node test.js <file>');
  process.exit(2);
}

const target = process.argv[2];
const src = fs.readFileSync(path.resolve(target), 'utf8');

const checks = [
  {name: 'insecure_sync_pbkdf2', rx: /pbkdf2Sync/},
  {name: 'env_name_leak', rx: /Missing required environment variable:\s*[${]?name[}]?/},
  {name: 'raw_private_key_env_access', rx: /return\s+process\.env\['PRIVATE_KEY_PATH'\]/},
  // catch any obvious private key blocks in code (e.g. BEGIN PRIVATE KEY)
  {name: 'hardcoded_private_key_block', rx: /-----BEGIN (RSA |EC |DSA |)PRIVATE KEY-----/i},
];

const matches = [];
checks.forEach((c) => {
  if (c.rx.test(src)) matches.push(c.name);
});

if (matches.length > 0) {
  console.error('FAIL - insecure patterns found:', matches.join(', '));
  process.exit(1);
} else {
  console.log('PASS - no insecure patterns found');
  process.exit(0);
}
