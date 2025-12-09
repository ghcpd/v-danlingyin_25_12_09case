const fs = require('fs');
const path = require('path');

/**
 * test_runner.js - Test execution framework with expected pass/fail tracking
 * Supports running individual tests and reporting pass rates
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  /**
   * Register a test case
   * @param {string} name - Test name
   * @param {function} testFn - Test function (should return true for pass, false for fail)
   * @param {boolean} expectPass - Whether this test is expected to pass
   */
  addTest(name, testFn, expectPass = true) {
    this.tests.push({ name, testFn, expectPass });
  }

  /**
   * Run all registered tests
   */
  runAll() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         SECURITY TEST RUNNER - FULL SUITE                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let passedCount = 0;
    let failedCount = 0;

    for (const test of this.tests) {
      const result = this._runTest(test);
      this.results.push(result);

      if (result.success) {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    this._printSummary(passedCount, failedCount);
    return failedCount === 0 ? 0 : 1;
  }

  /**
   * Run a single test
   * @private
   */
  _runTest(test) {
    process.stdout.write(`  [${test.expectPass ? 'EXPECT PASS' : 'EXPECT FAIL'}] ${test.name} ... `);

    try {
      const testResult = test.testFn();
      const actualPassed = testResult === true;
      const expectedPassed = test.expectPass === true;
      const success = actualPassed === expectedPassed;

      if (success) {
        console.log('✓');
      } else {
        console.log('✗');
      }

      return {
        name: test.name,
        expectPass: test.expectPass,
        actualPassed: actualPassed,
        success: success
      };
    } catch (err) {
      console.log('✗ (Exception)');
      return {
        name: test.name,
        expectPass: test.expectPass,
        actualPassed: false,
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Print test summary
   * @private
   */
  _printSummary(passed, failed) {
    const total = passed + failed;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║  Total Tests:    ${String(total).padEnd(50, ' ')}║`);
    console.log(`║  Passed:         ${String(passed).padEnd(50, ' ')}║`);
    console.log(`║  Failed:         ${String(failed).padEnd(50, ' ')}║`);
    console.log(`║  Pass Rate:      ${String(`${passRate}%`).padEnd(50, ' ')}║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }

  /**
   * Get all test results
   */
  getResults() {
    return this.results;
  }
}

// Export the TestRunner class
module.exports = TestRunner;
