const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Extracción Simple Bloques Toñi', () => {

  test('Bloques Toñi - usando selectores exactos', async ({ page }) => {
    console.log('🎯 EXTRAYENDO BLOQUES TOÑI - SELECTORES EXACTOS');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // CREADORA - Ya estamos en creators-panel-content
    console.log('\n📝 BLOQUES COMO CREADORA:');
    try {
      // Go directly to Contenido tab (should be default)
      await page.locator('button:has-text("📝 Contenido")').first().click();
      await page.waitForTimeout(2000);

      const container = page.locator('#bloques-creados-container');
      const blockCards = container.locator('.bc-block-card');
      const cardCount = await blockCards.count();

      console.log(`✅ Encontrados ${cardCount} bloques como Creadora`);

      for (let i = 0; i < cardCount; i++) {
        const card = blockCards.nth(i);
        const title = await card.locator('.bc-block-title').textContent();
        console.log(`  ${i + 1}. "${title?.trim()}"`);
      }

    } catch (error) {
      console.log(`❌ Error Creadora: ${error.message}`);
    }

    // PROFESORA - cambiar rol
    console.log('\n👩‍🏫 BLOQUES COMO PROFESORA:');
    try {
      // Click role selector
      await page.locator('#role-selector-container').click();
      await page.waitForTimeout(1000);

      // Wait for dropdown to be visible and click Profesor
      await page.waitForSelector('#role-options', { state: 'visible', timeout: 5000 });
      await page.locator('#role-options span:text("Profesor")').first().click();
      await page.waitForTimeout(2000);

      // Navigate to Recursos tab
      await page.locator('button:has-text("Recursos")').first().click();
      await page.waitForTimeout(2000);

      const container = page.locator('#recursos-bloques-creados-container');
      const blockCards = container.locator('.bc-block-card');
      const cardCount = await blockCards.count();

      console.log(`✅ Encontrados ${cardCount} bloques como Profesora`);

      for (let i = 0; i < cardCount; i++) {
        const card = blockCards.nth(i);
        const title = await card.locator('.bc-block-title').textContent();
        console.log(`  ${i + 1}. "${title?.trim()}"`);

        if (title && title.includes('Constitución')) {
          console.log(`    🎯 ¡Es el bloque de Constitución Española!`);
        }
      }

    } catch (error) {
      console.log(`❌ Error Profesora: ${error.message}`);
    }

    console.log('\n✅ EXTRACCIÓN COMPLETADA');
  });

});