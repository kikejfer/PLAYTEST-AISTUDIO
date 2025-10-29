const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Probar Función Corregida', () => {

  test('Usar función corregida basada en logs del usuario', async ({ page }) => {
    console.log('🎯 PROBANDO FUNCIÓN CORREGIDA CON SECUENCIA DEL USUARIO');
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

    console.log('\n🔄 SECUENCIA CORREGIDA:');
    console.log('1. Click directo en #role-selector-btn (sin #role-selector-container)');
    console.log('2. Click en span con texto del rol');
    console.log('=' .repeat(50));

    // Test Profesor role
    console.log('\n👩‍🏫 PROBANDO ROL PROFESOR CON SECUENCIA CORREGIDA:');
    try {
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ FUNCIÓN CORREGIDA - PROFESOR: ${profesorBlocks.length} bloques`);
      console.log('-' .repeat(40));

      profesorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error con función corregida para Profesor: ${error.message}`);
    }

    // Test Creador role
    console.log('\n\n📝 PROBANDO ROL CREADOR CON SECUENCIA CORREGIDA:');
    try {
      const creadorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

      console.log(`\n✅ FUNCIÓN CORREGIDA - CREADOR: ${creadorBlocks.length} bloques`);
      console.log('-' .repeat(40));

      creadorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error con función corregida para Creador: ${error.message}`);
    }

    console.log('\n🎉 PRUEBA DE FUNCIÓN CORREGIDA COMPLETADA');
    console.log('📋 Cambios aplicados basados en logs del usuario:');
    console.log('- Eliminado click en #role-selector-container');
    console.log('- Click directo en #role-selector-btn');
    console.log('- Selector más flexible para spans de rol');
  });

});