// test.js - Security validation test script
const fs = require('fs');
const path = require('path');

/**
 * Test a file for security vulnerabilities and hardcoded secrets
 * @param {string} filePath - Path to the file to test
 * @returns {object} - Test result with pass/fail status and details
 */
function testFileForSecrets(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const issues = [];
  
  // Pattern definitions for common secrets and vulnerabilities
  const secretPatterns = [
    // API Keys
    { pattern: /['"]sk_live_[a-zA-Z0-9]{24,}['"]/, type: 'Stripe Live API Key', severity: 'Critical' },
    { pattern: /['"]sk_test_[a-zA-Z0-9]{24,}['"]/, type: 'Stripe Test API Key', severity: 'High' },
    { pattern: /['"]AKIA[0-9A-Z]{16}['"]/, type: 'AWS Access Key', severity: 'Critical' },
    { pattern: /['"]AIza[0-9A-Za-z\\-_]{35}['"]/, type: 'Google API Key', severity: 'Critical' },
    
    // Database URIs with credentials
    { pattern: /['"]mongodb:\/\/[^:]+:[^@]+@[^'"]+['"]/, type: 'MongoDB URI with credentials', severity: 'Critical' },
    { pattern: /['"]postgres:\/\/[^:]+:[^@]+@[^'"]+['"]/, type: 'PostgreSQL URI with credentials', severity: 'Critical' },
    { pattern: /['"]mysql:\/\/[^:]+:[^@]+@[^'"]+['"]/, type: 'MySQL URI with credentials', severity: 'Critical' },
    
    // JWT Secrets (hardcoded strings that look like secrets)
    { pattern: /jwtSecret\s*[:=]\s*['"][^'"]{16,}['"]/, type: 'Hardcoded JWT Secret', severity: 'Critical' },
    { pattern: /JWT_SECRET\s*[:=]\s*['"][^'"]{16,}['"]/, type: 'Hardcoded JWT Secret', severity: 'Critical' },
    
    // Private keys
    { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, type: 'Hardcoded Private Key', severity: 'Critical' },
    
    // Hardcoded passwords
    { pattern: /password\s*[:=]\s*['"][^'"]{1,}['"](?!.*process\.env)/, type: 'Hardcoded Password', severity: 'Critical' },
    { pattern: /const\s+adminPassword\s*=\s*['"][^'"]+['"]/, type: 'Hardcoded Admin Password', severity: 'Critical' },
    { pattern: /const\s+adminUser\s*=\s*['"]admin['"]/, type: 'Hardcoded Admin Username', severity: 'High' },
    
    // Generic secret patterns
    { pattern: /apiKey\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'Hardcoded API Key', severity: 'Critical' },
    { pattern: /api_key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'Hardcoded API Key', severity: 'Critical' },
    { pattern: /secret\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"](?!.*process\.env)/, type: 'Hardcoded Secret', severity: 'High' },
    { pattern: /token\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"](?!.*process\.env)/, type: 'Hardcoded Token', severity: 'High' },
  ];
  
  // Check each pattern
  secretPatterns.forEach(({ pattern, type, severity }) => {
    const matches = content.match(new RegExp(pattern, 'g'));
    if (matches) {
      // Find line numbers
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            type: type,
            severity: severity,
            snippet: line.trim().substring(0, 80)
          });
        }
      });
    }
  });
  
  // Check for insecure password comparison (not using timing-safe comparison)
  const insecureComparison = /password\s*[!=]==?\s*\w+/;
  if (insecureComparison.test(content) && !content.includes('timingSafeEqual')) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (insecureComparison.test(line)) {
        issues.push({
          line: index + 1,
          type: 'Insecure Password Comparison',
          severity: 'High',
          snippet: line.trim().substring(0, 80)
        });
      }
    });
  }
  
  return {
    fileName: fileName,
    passed: issues.length === 0,
    issuesFound: issues.length,
    issues: issues
  };
}

/**
 * Main test execution
 */
function runTests(fileToTest) {
  console.log('='.repeat(80));
  console.log('SECURITY VALIDATION TEST');
  console.log('='.repeat(80));
  console.log(`Testing: ${fileToTest}`);
  console.log('-'.repeat(80));
  
  if (!fs.existsSync(fileToTest)) {
    console.error(`ERROR: File not found: ${fileToTest}`);
    process.exit(1);
  }
  
  const result = testFileForSecrets(fileToTest);
  
  if (result.passed) {
    console.log('✅ PASSED: No hardcoded secrets or vulnerabilities detected');
    console.log(`File: ${result.fileName}`);
    console.log('Status: SECURE');
    console.log('='.repeat(80));
    process.exit(0);
  } else {
    console.log('❌ FAILED: Security issues detected');
    console.log(`File: ${result.fileName}`);
    console.log(`Total Issues: ${result.issuesFound}`);
    console.log('-'.repeat(80));
    
    result.issues.forEach((issue, index) => {
      console.log(`\nIssue #${index + 1}:`);
      console.log(`  Line: ${issue.line}`);
      console.log(`  Type: ${issue.type}`);
      console.log(`  Severity: ${issue.severity}`);
      console.log(`  Code: ${issue.snippet}`);
    });
    
    console.log('\n' + '='.repeat(80));
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  const fileToTest = process.argv[2];
  if (!fileToTest) {
    console.error('Usage: node test.js <file-to-test>');
    process.exit(1);
  }
  runTests(fileToTest);
}

module.exports = { testFileForSecrets };
