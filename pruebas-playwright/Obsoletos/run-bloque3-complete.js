const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bloque 3 COMPLETE sequential tests...');
console.log('📋 Complete workflow:');
console.log('   1) AndGar creates block CE1978 (sequential-block-test.spec.js)');
console.log('   2) JaiGon & SebDom load the block (block-loading.spec.js)');
console.log('   3) SebDom downloads block & AndGar deletes it (block-download.spec.js)\n');

try {
  // Run tests with the sequential configuration
  const command = 'npx playwright test --config=sequential-sebdom.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n🎉 BLOQUE 3 COMPLETE WORKFLOW EXECUTED SUCCESSFULLY!');
  console.log('✅ All tests passed: Creation → Loading → Download → Deletion');

} catch (error) {
  console.error('\n❌ Bloque 3 complete workflow failed:', error.message);
  console.error('💡 Make sure to run tests in the correct order!');
  process.exit(1);
}