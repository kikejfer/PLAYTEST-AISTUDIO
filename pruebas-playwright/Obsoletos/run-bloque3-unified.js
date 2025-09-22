const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting BLOQUE 3 UNIFIED WORKFLOW...');
console.log('📋 Flujo completo unificado en un solo test:');
console.log('');
console.log('   PASO 1: AndGar crea bloque CE1978');
console.log('     • Login como AndGar');
console.log('     • Navegar a Añadir Preguntas → Subir Fichero');
console.log('     • Subir directorio con archivos CE1978');
console.log('     • Seleccionar archivos específicos');
console.log('     • Cargar y guardar archivos múltiples');
console.log('     • Subir archivo individual CE1978_Título III');
console.log('     • Cargar y guardar archivo individual');
console.log('');
console.log('   PASO 2: JaiGon carga el bloque');
console.log('     • Login como JaiGon');
console.log('     • Navegar a Carga de Bloques');
console.log('     • Verificar bloques disponibles');
console.log('     • Cargar bloque de AndGar');
console.log('');
console.log('   PASO 3: SebDom carga el bloque');
console.log('     • Login como SebDom');
console.log('     • Navegar a Carga de Bloques');
console.log('     • Cargar bloque de AndGar');
console.log('');
console.log('   PASO 4: SebDom descarga el bloque');
console.log('     • Navegar a Carga de Bloques');
console.log('     • Buscar bloque CE1978');
console.log('     • Hacer clic en Descargar');
console.log('     • Verificar descarga');
console.log('');
console.log('   PASO 5: AndGar elimina el bloque');
console.log('     • Login como AndGar');
console.log('     • Navegar a Contenido');
console.log('     • Buscar bloque CE1978');
console.log('     • Eliminar bloque');
console.log('     • Confirmar eliminación');
console.log('');
console.log('💡 GARANTÍA: Un solo test con 5 pasos secuenciales - ORDEN INALTERABLE');
console.log('⏱️  Timeout extendido: 6 minutos para flujo completo con React robusto');
console.log('🚪 Logout explícito entre usuarios + limpieza completa de estado');
console.log('⚡ Estrategia robusta para aplicaciones React/SPA lentas');
console.log('');

try {
  // Run the unified workflow test
  const command = 'npx playwright test --config=bloque3-unified.config.js';

  console.log(`Executing: ${command}\n`);

  execSync(command, {
    stdio: 'inherit',
    cwd: path.dirname(__filename)
  });

  console.log('\n🏆 BLOQUE 3 UNIFIED WORKFLOW COMPLETED SUCCESSFULLY!');
  console.log('✅ Flujo completo ejecutado en orden secuencial garantizado');
  console.log('✅ Todos los 5 pasos completados exitosamente');

} catch (error) {
  console.error('\n❌ Bloque 3 unified workflow failed:', error.message);
  console.error('💡 Check individual steps in the unified test for specific issues');
  process.exit(1);
}