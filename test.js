// test.js - Security validation test for input.ts
const fs = require('fs');
const path = require('path');

/**
 * Scans a file for hardcoded secrets and security vulnerabilities
 * @param {string} filePath - Path to the file to scan
 * @returns {Object} - Test results with pass/fail status and findings
 */
function scanForSecurityIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Patterns that indicate hardcoded secrets
  const secretPatterns = [
    { regex: /['"]sk_live_[a-zA-Z0-9]{24,}['"]/, type: 'Stripe Live API Key' },
    { regex: /['"]sk_test_[a-zA-Z0-9]{24,}['"]/, type: 'Stripe Test API Key' },
    { regex: /['"]pk_live_[a-zA-Z0-9]{24,}['"]/, type: 'Stripe Publishable Key' },
    { regex: /['"]AKIA[0-9A-Z]{16}['"]/, type: 'AWS Access Key' },
    { regex: /mongodb:\/\/[^'"]+:[^'"]+@/, type: 'MongoDB Connection String with Credentials' },
    { regex: /mysql:\/\/[^'"]+:[^'"]+@/, type: 'MySQL Connection String with Credentials' },
    { regex: /postgres:\/\/[^'"]+:[^'"]+@/, type: 'PostgreSQL Connection String with Credentials' },
    { regex: /['"][a-zA-Z0-9_-]{32,}['"]\s*[;,]?\s*\/\/\s*(?:jwt|secret|token)/i, type: 'Hardcoded JWT Secret' },
    { regex: /password\s*[:=]\s*['"]\w{4,}['"]/, type: 'Hardcoded Password' },
    { regex: /apikey\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'Hardcoded API Key' },
    { regex: /-----BEGIN (?:RSA |)PRIVATE KEY-----/, type: 'Embedded Private Key' },
    { regex: /['"]admin['"]:\s*['"]admin['"]/i, type: 'Default Admin Credentials' },
  ];

  // Check for hardcoded secrets
  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      issues.push({
        type: pattern.type,
        severity: 'CRITICAL',
        evidence: matches[0].substring(0, 50) + '...'
      });
    }
  });

  // Check for insecure patterns
  const insecurePatterns = [
    { regex: /eval\s*\(/, type: 'Use of eval() function', severity: 'HIGH' },
    { regex: /Function\s*\(\s*['"]/, type: 'Dynamic code execution', severity: 'HIGH' },
  ];

  insecurePatterns.forEach(pattern => {
    if (pattern.regex.test(content)) {
      issues.push({
        type: pattern.type,
        severity: pattern.severity
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues: issues,
    file: path.basename(filePath)
  };
}

function runTest(testFile) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testFile}`);
  console.log('='.repeat(60));

  try {
    const result = scanForSecurityIssues(testFile);
    
    console.log(`\nScan Results for ${result.file}:`);
    console.log(`Total Issues Found: ${result.issues.length}`);
    
    if (result.issues.length > 0) {
      console.log('\n⚠️  Security Issues Detected:');
      result.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity}] ${issue.type}`);
        if (issue.evidence) {
          console.log(`     Evidence: ${issue.evidence}`);
        }
      });
      console.log('\n❌ TEST FAILED - Security vulnerabilities detected');
      return false;
    } else {
      console.log('\n✅ TEST PASSED - No security vulnerabilities detected');
      return true;
    }
  } catch (error) {
    console.error(`\n❌ TEST ERROR: ${error.message}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  const testFile = process.argv[2] || 'input.ts';
  const result = runTest(testFile);
  process.exit(result ? 0 : 1);
}

module.exports = { scanForSecurityIssues, runTest };
