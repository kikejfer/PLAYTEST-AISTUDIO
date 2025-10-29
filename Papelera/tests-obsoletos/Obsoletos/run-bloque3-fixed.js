const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bloque 3 FIXED sequential execution...');
console.log('📋 Guaranteed sequential order:');
console.log('   PASO 1: AndGar crea bloque CE1978');
console.log('   PASO 2: JaiGon carga el bloque');
console.log('   PASO 3: SebDom carga el bloque');
console.log('   PASO 4: SebDom descarga el bloque');
console.log('   PASO 5: AndGar elimina el bloque\n');

try {
  // Run tests with the fixed sequential configuration
  const command = 'npx playwright test --config=bloque3-sequential.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n🏆 BLOQUE 3 FIXED SEQUENTIAL EXECUTION COMPLETED SUCCESSFULLY!');
  console.log('✅ All 5 steps executed in guaranteed order');

} catch (error) {
  console.error('\n❌ Bloque 3 fixed sequential execution failed:', error.message);
  console.error('💡 Check individual test steps for specific issues');
  process.exit(1);
}