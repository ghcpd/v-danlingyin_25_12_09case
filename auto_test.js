// auto_test.js - Automatic test runner with OS detection and logging
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoTestRunner {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.logFile = path.join(this.logDir, 'test_run.log');
    this.ensureLogDir();
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Detect operating system
   */
  detectOS() {
    const platform = os.platform();
    if (platform === 'win32') {
      return 'Windows';
    } else if (platform === 'darwin') {
      return 'macOS';
    } else if (platform === 'linux') {
      return 'Linux';
    }
    return platform;
  }

  /**
   * Get the appropriate test script for the OS
   */
  getTestScript() {
    const platform = os.platform();
    if (platform === 'win32') {
      return 'run_test.bat';
    } else {
      return './run_test.sh';
    }
  }

  /**
   * Log message to both console and file
   */
  log(message) {
    console.log(message);
    fs.appendFileSync(this.logFile, message + '\n', 'utf8');
  }

  /**
   * Run the test suite
   */
  runTests() {
    const timestamp = this.getTimestamp();
    const osType = this.detectOS();
    const testScript = this.getTestScript();

    this.log('='.repeat(70));
    this.log(`Auto Test Runner - ${timestamp}`);
    this.log('='.repeat(70));
    this.log(`Operating System: ${osType}`);
    this.log(`Test Script: ${testScript}`);
    this.log('');

    try {
      // Make shell script executable on Unix-like systems
      if (os.platform() !== 'win32') {
        try {
          execSync('chmod +x run_test.sh', { stdio: 'ignore' });
        } catch (err) {
          // Ignore if chmod fails
        }
      }

      // Execute the test script
      this.log('Starting test execution...');
      this.log('');

      const output = execSync(testScript, {
        encoding: 'utf8',
        stdio: 'pipe',
        shell: true
      });

      this.log(output);
      this.log('');
      this.log('='.repeat(70));
      this.log('Final Status: TEST PASSED');
      this.log('='.repeat(70));
      
      return true;
    } catch (error) {
      // Test failed or error occurred
      if (error.stdout) {
        this.log(error.stdout.toString());
      }
      if (error.stderr) {
        this.log('Error output:');
        this.log(error.stderr.toString());
      }
      
      this.log('');
      this.log('='.repeat(70));
      this.log('Final Status: TEST FAILED');
      this.log('='.repeat(70));
      
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  const runner = new AutoTestRunner();
  const success = runner.runTests();
  
  console.log('');
  console.log(`Log file saved to: ${runner.logFile}`);
  
  process.exit(success ? 0 : 1);
}

module.exports = AutoTestRunner;
