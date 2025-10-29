const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Función 1 Visual - Profesor', () => {

  test('Mostrar visualmente función 1 para rol Profesor con clicks marcados', async ({ page }) => {
    console.log('🎯 FUNCIÓN 1 VISUAL - PROBLEMA CON ROL PROFESOR');
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

    console.log('🎯 APLICANDO FUNCIÓN 1 PARA ROL PROFESOR (VISUAL):');
    console.log('=' .repeat(50));

    // Modificar la función para que sea visual - interceptar antes de la ejecución
    console.log('📍 Preparando elementos visuales...');

    // Highlight role selector before function execution
    const roleSelector = page.locator('#role-selector-container');
    await roleSelector.evaluate(element => {
      element.style.border = '5px solid red';
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      element.scrollIntoView();
    });

    console.log('🔴 Resaltado #role-selector-container en ROJO');
    await page.waitForTimeout(2000);

    // Now execute function 1
    try {
      console.log('⚡ EJECUTANDO FUNCIÓN 1...');
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ FUNCIÓN 1 COMPLETADA - BLOQUES PROFESOR: ${profesorBlocks.length}`);
      console.log('=' .repeat(40));

      profesorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

      // Highlight the final container
      if (profesorBlocks.length > 0) {
        const container = page.locator('#recursos-bloques-creados-container');
        await container.evaluate(element => {
          element.style.border = '5px solid green';
          element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
          element.scrollIntoView();
        });
        console.log('🟢 Resaltado container final en VERDE');
      }

    } catch (error) {
      console.log(`❌ ERROR en función 1 para Profesor: ${error.message}`);

      // Highlight error elements in red
      const possibleContainers = [
        '#recursos-bloques-creados-container',
        '#bloques-creados-container',
        '.tab-button:has-text("Recursos")'
      ];

      for (const selector of possibleContainers) {
        const element = page.locator(selector);
        const exists = await element.count();
        const visible = exists > 0 ? await element.isVisible() : false;

        console.log(`🔍 ${selector}: exists=${exists > 0}, visible=${visible}`);

        if (exists > 0) {
          await element.evaluate(element => {
            element.style.border = '3px solid orange';
            element.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
            element.scrollIntoView();
          });
        }
      }
    }

    console.log('\n⏸️ Manteniendo navegador abierto para inspección visual...');
    await page.waitForTimeout(30000);
  });

});