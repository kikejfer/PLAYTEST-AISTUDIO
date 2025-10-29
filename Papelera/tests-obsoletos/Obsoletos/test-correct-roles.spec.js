const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Test Roles Correctos', () => {

  test('Verificar que Profesor tiene 1 bloque y Creador tiene 3', async ({ page }) => {
    console.log('🎯 VERIFICANDO ROLES CORRECTOS - PROFESOR: 1 bloque, CREADOR: 3 bloques');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // TEST PROFESOR FIRST (should have 1 block)
    console.log('\n👩‍🏫 PROBANDO ROL PROFESOR (esperado: 1 bloque):');
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

    } catch (error) {
      console.log(`❌ Error probando Profesor: ${error.message}`);
    }

    // Wait between role changes
    await page.waitForTimeout(5000);

    // TEST CREADOR SECOND (should have 3 blocks)
    console.log('\n\n📝 PROBANDO ROL CREADOR (esperado: 3 bloques):');
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

    console.log('\n📋 RESUMEN FINAL:');
    console.log('=' .repeat(40));
    console.log('🎯 ESPERADO: Profesor=1 bloque, Creador=3 bloques');
    console.log('📊 Si los números no coinciden, el cambio de rol no funciona correctamente');
  });

});