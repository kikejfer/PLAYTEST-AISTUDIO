const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Extraer Bloques Toñi Profesora', () => {

  test('Bloques de Toñi como Profesora en teachers-panel', async ({ page }) => {
    console.log('👩‍🏫 EXTRAYENDO BLOQUES TOÑI COMO PROFESORA');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    try {
      // Click "Creador de contenido" button first
      const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
      const creadorExists = await creadorButton.count();

      if (creadorExists > 0) {
        await creadorButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked "Creador de contenido"');
      }

      // Click role selector
      await page.locator('#role-selector-container').click();
      await page.waitForTimeout(1500);

      // Select Profesor role
      await page.locator('#role-options span:text("Profesor")').first().click();
      await page.waitForTimeout(3000);
      console.log('✅ Selected Profesor role');

      // Navigate to Recursos tab
      await page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first().click();
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to Recursos tab');

      // Extract blocks from recursos container
      const container = page.locator('#recursos-bloques-creados-container');
      const containerExists = await container.count();

      if (containerExists > 0) {
        const blockCards = container.locator('.bc-block-card');
        const cardCount = await blockCards.count();

        console.log(`\n✅ BLOQUES DE TOÑI COMO PROFESORA: ${cardCount} encontrados`);
        console.log('-' .repeat(50));

        for (let i = 0; i < cardCount; i++) {
          const card = blockCards.nth(i);
          const titleElement = card.locator('.bc-block-title');
          const title = await titleElement.textContent();

          console.log(`\n${i + 1}. Título: "${title?.trim()}"`);

          // Try to extract characteristics
          try {
            // Try inline format first
            const inlineStatsDiv = card.locator('div[style*="margin-bottom"]');
            const inlineExists = await inlineStatsDiv.count();

            if (inlineExists > 0) {
              console.log('   Formato inline encontrado');
              const allSpans = await inlineStatsDiv.locator('span').all();
              for (let j = 0; j < allSpans.length; j++) {
                const spanText = await allSpans[j].textContent();
                console.log(`   Span ${j}: "${spanText?.trim()}"`);
              }
            }

            // Try old format
            const statItems = card.locator('.bc-stat-item');
            const itemCount = await statItems.count();
            console.log(`   Stat items encontrados: ${itemCount}`);

            for (let j = 0; j < itemCount; j++) {
              const item = statItems.nth(j);
              const label = await item.locator('.bc-stat-label').textContent();
              const number = await item.locator('.bc-stat-number').textContent();
              console.log(`   ${label}: ${number}`);
            }

          } catch (statError) {
            console.log(`   ⚠️ Error extrayendo stats: ${statError.message}`);
          }

          // Check if this is the Constitución block
          if (title && title.includes('Constitución')) {
            console.log(`   🎯 ¡ESTE ES EL BLOQUE DE CONSTITUCIÓN ESPAÑOLA!`);
          }
        }

      } else {
        console.log('❌ Container #recursos-bloques-creados-container not found');
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n✅ EXTRACCIÓN PROFESORA COMPLETADA');
  });

});