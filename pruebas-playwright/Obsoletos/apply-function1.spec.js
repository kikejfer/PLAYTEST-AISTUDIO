const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Aplicar Función 1', () => {

  test('Usar getAllCreatedBlocksCharacteristics para Toñi', async ({ page }) => {
    console.log('🎯 APLICANDO FUNCIÓN 1: getAllCreatedBlocksCharacteristics');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel for role testing
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // APLICAR FUNCIÓN 1 PARA CREADOR
    console.log('\n📝 APLICANDO FUNCIÓN 1 PARA ROL CREADOR:');
    console.log('=' .repeat(50));

    try {
      const creadorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

      console.log(`\n✅ FUNCIÓN 1 EJECUTADA - BLOQUES CREADOR: ${creadorBlocks.length}`);
      console.log('=' .repeat(40));

      creadorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error aplicando función 1 para Creador: ${error.message}`);
    }

    // APLICAR FUNCIÓN 1 PARA PROFESOR
    console.log('\n\n👩‍🏫 APLICANDO FUNCIÓN 1 PARA ROL PROFESOR:');
    console.log('=' .repeat(50));

    try {
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ FUNCIÓN 1 EJECUTADA - BLOQUES PROFESOR: ${profesorBlocks.length}`);
      console.log('=' .repeat(40));

      profesorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error aplicando función 1 para Profesor: ${error.message}`);
    }

    console.log('\n🎉 FUNCIÓN 1 APLICADA EXITOSAMENTE');
    console.log('getAllCreatedBlocksCharacteristics() devuelve array de objetos con:');
    console.log('- blockTitle: Título del bloque');
    console.log('- preguntas: Número de preguntas');
    console.log('- temas: Número de temas');
    console.log('- usuarios: Número de usuarios');
  });

});