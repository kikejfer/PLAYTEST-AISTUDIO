const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Test desde Creators Panel', () => {

  test('Probar cambios de rol desde creators-panel-content.html', async ({ page }) => {
    console.log('🎯 PROBANDO CAMBIOS DE ROL DESDE CREATORS-PANEL-CONTENT');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to creators panel (better for role switching)
    console.log('🔄 Navegando a creators-panel-content.html...');
    await page.goto(`${BASE_URL}/creators-panel-content.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // TEST CREADOR FIRST (from creators panel, should work)
    console.log('\n📝 PROBANDO ROL CREADOR DESDE CREATORS PANEL (esperado: 3 bloques):');
    console.log('=' .repeat(50));

    try {
      const creadorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

      console.log(`\n📊 CREADOR RESULTADO: ${creadorBlocks.length} bloques`);

      if (creadorBlocks.length === 3) {
        console.log('✅ ¡CORRECTO! Creador tiene 3 bloques como esperado');
      } else {
        console.log(`❌ INCORRECTO! Creador tiene ${creadorBlocks.length} bloques, esperado: 3`);
      }

      creadorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error probando Creador: ${error.message}`);
    }

    // Wait between role changes
    await page.waitForTimeout(5000);

    // TEST PROFESOR FROM CREATORS PANEL (should have 1 block)
    console.log('\n\n👩‍🏫 PROBANDO ROL PROFESOR DESDE CREATORS PANEL (esperado: 1 bloque):');
    console.log('=' .repeat(50));

    try {
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n📊 PROFESOR RESULTADO: ${profesorBlocks.length} bloques`);

      if (profesorBlocks.length === 1) {
        console.log('✅ ¡CORRECTO! Profesor tiene 1 bloque como esperado');
      } else {
        console.log(`❌ INCORRECTO! Profesor tiene ${profesorBlocks.length} bloques, esperado: 1`);
      }

      profesorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

      // Check if we found "Constitución Española 1978"
      const constitucionFound = profesorBlocks.some(block =>
        block.blockTitle.includes('Constitución') && block.blockTitle.includes('1978')
      );

      if (constitucionFound) {
        console.log('✅ ¡ENCONTRADO! Bloque "Constitución Española 1978" como Profesor');
      } else {
        console.log('⚠️ No se encontró "Constitución Española 1978" como Profesor');
      }

    } catch (error) {
      console.log(`❌ Error probando Profesor: ${error.message}`);
    }

    console.log('\n📋 RESUMEN FINAL:');
    console.log('=' .repeat(40));
    console.log('🎯 ESPERADO: Creador=3 bloques, Profesor=1 bloque ("Constitución Española 1978")');
    console.log('📊 Probando desde creators-panel-content.html en lugar de teachers-panel');
  });

});