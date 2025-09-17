const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bloque 3 complete sequential tests...');
console.log('Order: 1) Block Creation, 2) Block Loading, 3) Block Download\n');

try {
  // Run tests with the sequential configuration
  const command = 'npx playwright test --config=sequential-sebdom.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n✅ Bloque 3 complete sequential tests completed successfully!');

} catch (error) {
  console.error('\n❌ Bloque 3 sequential tests failed:', error.message);
  process.exit(1);
}