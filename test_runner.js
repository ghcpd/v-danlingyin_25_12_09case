// test_runner.js - Test runner with expected results validation
const { scanForSecurityIssues } = require('./test.js');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0
    };
  }

  /**
   * Add a test case
   * @param {string} file - File to test
   * @param {boolean} expectPass - Whether the test is expected to pass
   * @param {string} description - Test description
   */
  addTest(file, expectPass, description) {
    this.tests.push({ file, expectPass, description });
  }

  /**
   * Run all registered tests
   */
  runAll() {
    console.log('='.repeat(70));
    console.log('Security Test Runner');
    console.log('='.repeat(70));
    console.log(`Running ${this.tests.length} test(s)...\n`);

    this.tests.forEach((test, index) => {
      this.results.total++;
      console.log(`\nTest ${index + 1}/${this.tests.length}: ${test.description}`);
      console.log('-'.repeat(70));
      console.log(`File: ${test.file}`);
      console.log(`Expected: ${test.expectPass ? 'PASS' : 'FAIL'}`);
      
      try {
        if (!fs.existsSync(test.file)) {
          console.log(`❌ ERROR: File not found: ${test.file}`);
          this.results.failed++;
          return;
        }

        const result = scanForSecurityIssues(test.file);
        const actualPass = result.passed;
        const testPassed = (actualPass === test.expectPass);

        console.log(`Actual: ${actualPass ? 'PASS' : 'FAIL'}`);
        
        if (result.issues.length > 0) {
          console.log(`\nIssues found (${result.issues.length}):`);
          result.issues.forEach((issue, idx) => {
            console.log(`  ${idx + 1}. [${issue.severity}] ${issue.type}`);
            if (issue.evidence) {
              console.log(`     Evidence: ${issue.evidence}`);
            }
          });
        } else {
          console.log('\nNo security issues found.');
        }

        if (testPassed) {
          console.log(`\n✅ TEST PASSED - Result matches expectation`);
          this.results.passed++;
        } else {
          console.log(`\n❌ TEST FAILED - Result does not match expectation`);
          console.log(`   Expected the test to ${test.expectPass ? 'PASS' : 'FAIL'}, but it ${actualPass ? 'PASSED' : 'FAILED'}`);
          this.results.failed++;
        }
      } catch (error) {
        console.log(`\n❌ TEST ERROR: ${error.message}`);
        this.results.failed++;
      }
    });

    this.printSummary();
    return this.results.failed === 0;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('Test Summary');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    const passRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(2)
      : 0;
    
    console.log(`Pass Rate: ${passRate}%`);
    console.log('='.repeat(70));

    if (this.results.failed === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`❌ ${this.results.failed} test(s) failed.`);
    }
  }
}

// Main execution
if (require.main === module) {
  const runner = new TestRunner();
  
  // Define test cases
  runner.addTest(
    'input_backup.ts',
    true,  // Expected to pass (no vulnerabilities in this case)
    'Validate input_backup.ts for security issues'
  );
  
  runner.addTest(
    'input.ts',
    true,  // Expected to pass (secure version)
    'Validate input.ts for security issues'
  );

  const allPassed = runner.runAll();
  process.exit(allPassed ? 0 : 1);
}

module.exports = TestRunner;
