const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Probar Función Actualizada', () => {

  test('Extraer bloques Toñi con función corregida', async ({ page }) => {
    console.log('🎯 PROBANDO FUNCIÓN CREATOR-BLOCKS-HELPER ACTUALIZADA');
    console.log('=' .repeat(60));

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel for role testing
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // PARTE 1: BLOQUES COMO CREADORA
    console.log('\n📝 PARTE 1: BLOQUES COMO CREADORA');
    console.log('=' .repeat(50));

    try {
      const creadoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

      console.log(`\n✅ BLOQUES DE TOÑI COMO CREADORA: ${creadoraBlocks.length} encontrados`);
      console.log('-' .repeat(40));

      creadoraBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. Título: "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error extrayendo bloques como Creadora: ${error.message}`);
    }

    // PARTE 2: BLOQUES COMO PROFESORA
    console.log('\n\n👩‍🏫 PARTE 2: BLOQUES COMO PROFESORA');
    console.log('=' .repeat(50));

    try {
      const profesoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ BLOQUES DE TOÑI COMO PROFESORA: ${profesoraBlocks.length} encontrados`);
      console.log('-' .repeat(40));

      profesoraBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. Título: "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);

        // Check for Constitución Española
        if (block.blockTitle.includes('Constitución Española')) {
          console.log(`   🎯 ¡ENCONTRADO! Bloque "Constitución Española 1978"`);
        }
      });

    } catch (error) {
      console.log(`❌ Error extrayendo bloques como Profesora: ${error.message}`);
    }

    console.log('\n🎉 EXTRACCIÓN COMPLETADA CON FUNCIÓN ACTUALIZADA');
    console.log('Función creator-blocks-helper.js ahora usa la secuencia correcta:');
    console.log('1. Click #role-selector-container');
    console.log('2. Click #role-selector-btn');
    console.log('3. Wait for #role-options visible');
    console.log('4. Click span role');
    console.log('5. Verify role change via #current-role-name');
  });

});