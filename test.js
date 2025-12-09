const fs = require('fs');
const path = require('path');

// Test configuration
const tests = [
  {
    name: 'input_backup.ts (original - should fail)',
    file: './input_backup.ts',
    expectedToPass: false
  },
  {
    name: 'input.ts (fixed - should pass)',
    file: './input.ts',
    expectedToPass: true
  }
];

// Vulnerability detection patterns
const vulnerabilityPatterns = [
  {
    name: 'Hardcoded API keys',
    regex: /(['"`]?(?:sk_live_|sk_test_|pk_live_|pk_test_)[a-zA-Z0-9_]{20,}['"`]?)/gi
  },
  {
    name: 'Hardcoded credentials in code',
    regex: /(password\s*[=:]\s*['"`][^'"`]*['"`]|username\s*[=:]\s*['"`][^'"`]*['"`])/gi
  },
  {
    name: 'Hardcoded JWT secrets',
    regex: /(jwt_secret\s*[=:]\s*['"`][^'"`]*['"`]|secret\s*[=:]\s*['"`][^'"`]*['"`])/gi
  },
  {
    name: 'DB connection strings in code',
    regex: /(mongodb:\/\/|postgres:\/\/|mysql:\/\/)[a-zA-Z0-9:@.\/%?&=_-]+/gi
  },
  {
    name: 'Missing rate limiting on login',
    regex: /export\s+function\s+login\s*\([^)]*\)\s*:\s*string\s*{[^}]*if\s*\(\s*user\s*!==/
  },
  {
    name: 'Unvalidated login input',
    regex: /export\s+function\s+login\s*\([^)]*\)\s*:\s*string\s*{(?![\s\S]*validateLoginInput)[^}]*return/
  }
];

// Test a file for vulnerabilities
function testFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        passed: false,
        error: `File not found: ${filePath}`
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const vulnerabilitiesFound = [];

    for (const pattern of vulnerabilityPatterns) {
      if (pattern.regex.test(content)) {
        vulnerabilitiesFound.push(pattern.name);
        pattern.regex.lastIndex = 0; // Reset regex state
      }
    }

    // If vulnerabilities found, test fails
    if (vulnerabilitiesFound.length > 0) {
      return {
        passed: false,
        vulnerabilities: vulnerabilitiesFound
      };
    }

    // Check for security features in fixed version
    if (filePath.includes('input.ts') && !filePath.includes('backup')) {
      const hasRateLimiting = /checkRateLimit|MAX_ATTEMPTS|loginAttempts/.test(content);
      const hasInputValidation = /validateLoginInput/.test(content);
      const hasIterationValidation = /iterations\s*[<>]\s*10000|iterations\s*[<>]\s*1000000/.test(content);

      if (!hasRateLimiting || !hasInputValidation || !hasIterationValidation) {
        return {
          passed: false,
          missingFixes: [
            !hasRateLimiting && 'Rate limiting',
            !hasInputValidation && 'Input validation',
            !hasIterationValidation && 'Iteration bounds validation'
          ].filter(Boolean)
        };
      }
    }

    return {
      passed: true,
      vulnerabilities: []
    };
  } catch (err) {
    return {
      passed: false,
      error: err.message
    };
  }
}

// Run all tests
function runTests() {
  console.log('====================================');
  console.log('    SECURITY AUDIT TEST SUITE');
  console.log('====================================\n');

  let passedCount = 0;
  let failedCount = 0;
  const results = [];

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const result = testFile(test.file);

    const testPassed = result.passed === test.expectedToPass;

    if (testPassed) {
      passedCount++;
      console.log(`✓ PASS\n`);
      results.push({
        test: test.name,
        status: 'PASS',
        details: result.passed ? 'No vulnerabilities detected' : 'Vulnerabilities detected as expected'
      });
    } else {
      failedCount++;
      console.log(`✗ FAIL`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
        results.push({ test: test.name, status: 'FAIL', error: result.error });
      }
      if (result.vulnerabilities && result.vulnerabilities.length > 0) {
        console.log(`  Vulnerabilities found: ${result.vulnerabilities.join(', ')}`);
        results.push({ test: test.name, status: 'FAIL', vulnerabilities: result.vulnerabilities });
      }
      if (result.missingFixes && result.missingFixes.length > 0) {
        console.log(`  Missing fixes: ${result.missingFixes.join(', ')}`);
        results.push({ test: test.name, status: 'FAIL', missingFixes: result.missingFixes });
      }
      console.log();
    }
  }

  // Summary
  console.log('====================================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Pass Rate: ${((passedCount / tests.length) * 100).toFixed(2)}%`);
  console.log('====================================\n');

  return failedCount === 0 ? 0 : 1;
}

process.exit(runTests());
