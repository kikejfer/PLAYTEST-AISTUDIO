const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting SebDom sequential tests...');
console.log('Order: 1) Block Loading, 2) Block Download\n');

try {
  // Run tests with the sequential configuration
  const command = 'npx playwright test --config=sequential-sebdom.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n✅ SebDom sequential tests completed successfully!');

} catch (error) {
  console.error('\n❌ SebDom sequential tests failed:', error.message);
  process.exit(1);
}