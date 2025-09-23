import { execSync } from 'child_process';

try {
  console.log('🚀 Ejecutando todos los tests con Playwright...\n');
  execSync('npx playwright test tests', { stdio: 'inherit' });

  console.log('\n📊 Generando reporte HTML...');
  execSync('npx playwright show-report', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Error al ejecutar los tests');
  process.exit(1);
}
 
