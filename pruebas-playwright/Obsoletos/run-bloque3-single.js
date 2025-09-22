const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bloque 3 SINGLE WORKFLOW - GUARANTEED ORDER...');
console.log('📋 Un solo test con 5 pasos secuenciales:');
console.log('   PASO 1: AndGar crea bloque CE1978');
console.log('   PASO 2: JaiGon carga el bloque');
console.log('   PASO 3: SebDom carga el bloque');
console.log('   PASO 4: SebDom descarga el bloque');
console.log('   PASO 5: AndGar elimina el bloque');
console.log('');
console.log('💡 SOLUCIÓN: Todo en un solo test para evitar que Playwright cambie el orden\n');

try {
  // Run the single workflow test
  const command = 'npx playwright test --config=bloque3-single.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n🏆 BLOQUE 3 SINGLE WORKFLOW COMPLETED SUCCESSFULLY!');
  console.log('✅ Todos los 5 pasos ejecutados en UN SOLO TEST con orden garantizado');

} catch (error) {
  console.error('\n❌ Bloque 3 single workflow failed:', error.message);
  console.error('💡 Check the single test for specific step failures');
  process.exit(1);
}