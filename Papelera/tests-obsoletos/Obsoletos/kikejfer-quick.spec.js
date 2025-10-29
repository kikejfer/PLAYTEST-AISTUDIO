const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Kikejfer Quick Test', () => {

  test('Probar kikejfer rápidamente', async ({ page }) => {
    console.log('🎯 FUNCIÓN RÁPIDA PARA KIKEJFER');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(2000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test Profesor role only (quick)
    console.log('\n📊 PROBANDO ROL PROFESOR PARA KIKEJFER:');
    try {
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ KIKEJFER - ROL PROFESOR: ${profesorBlocks.length} bloques`);

      profesorBlocks.forEach((block, index) => {
        console.log(`${index + 1}. "${block.blockTitle}" - ${block.preguntas} preguntas, ${block.temas} temas`);
      });

    } catch (error) {
      console.log(`❌ Error Profesor: ${error.message}`);
    }

    console.log('\n✅ COMPLETADO PARA KIKEJFER');
  });

});