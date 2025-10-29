const { spawn } = require('child_process');
const path = require('path');

// Script para ejecutar tests del bloque 3 secuencialmente
async function runTestsSequentially() {
  const testFiles = [
    'tests/03-funcionalidad-core/sequential-block-test.spec.js', // 1. Crear bloque
    'tests/03-funcionalidad-core/block-loading.spec.js',         // 2. Cargar bloque
    'tests/03-funcionalidad-core/block-download.spec.js'         // 3. Descargar y eliminar
  ];

  console.log('🚀 Iniciando ejecución secuencial del bloque 3...\n');

  for (let i = 0; i < testFiles.length; i++) {
    const testFile = testFiles[i];
    const testName = path.basename(testFile, '.spec.js');

    console.log(`📝 Ejecutando ${i + 1}/${testFiles.length}: ${testName}`);
    console.log(`📁 Archivo: ${testFile}\n`);

    try {
      await runPlaywrightTest(testFile);
      console.log(`✅ ${testName} completado exitosamente\n`);
    } catch (error) {
      console.log(`❌ ${testName} falló:`, error.message);
      console.log(`⚠️  Continuando con el siguiente test...\n`);
    }
  }

  console.log('🏁 Ejecución secuencial del bloque 3 completada');
}

function runPlaywrightTest(testFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', 'test', testFile, '--reporter=line'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Ejecutar
runTestsSequentially().catch(console.error);