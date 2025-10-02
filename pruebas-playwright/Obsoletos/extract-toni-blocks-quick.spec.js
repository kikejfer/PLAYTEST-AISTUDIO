const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Extraer Bloques Toñi - Versión Rápida', () => {

  test('Obtener características de bloques sin timeouts largos', async ({ page }) => {
    console.log('🎯 EXTRAYENDO BLOQUES DE TOÑI (VERSIÓN RÁPIDA)');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // PARTE 1: Como CREADORA
    console.log('\n📝 PARTE 1: BLOQUES COMO CREADORA');
    console.log('=' .repeat(50));

    try {
      // Manual role selection with reduced timeouts
      await page.locator('button:has(span:text("Creador de contenido"))').click();
      await page.waitForTimeout(2000);

      await page.locator('#role-selector-container').click();
      await page.waitForTimeout(1000);

      await page.locator('#role-options span:text("Creador")').first().click();
      await page.waitForTimeout(3000); // Reduced from 8000

      // Navigate to Contenido tab
      await page.locator('.tab-button:has-text("Contenido"), button:has-text("Contenido")').first().click();
      await page.waitForTimeout(2000);

      // Extract blocks
      await page.waitForSelector('#bloques-creados-container', { timeout: 10000 });
      const container = page.locator('#bloques-creados-container');
      const blockCards = container.locator('.bc-block-card');
      const cardCount = await blockCards.count();

      console.log(`✅ BLOQUES COMO CREADORA: ${cardCount} encontrados`);

      for (let i = 0; i < cardCount; i++) {
        const card = blockCards.nth(i);
        const titleElement = card.locator('.bc-block-title');
        const title = await titleElement.textContent();

        // Extract stats
        const preguntas = await extractStat(card, 'Preguntas');
        const temas = await extractStat(card, 'Temas');
        const usuarios = await extractStat(card, 'Usuarios');

        console.log(`\n${i + 1}. Título: "${title?.trim()}"`);
        console.log(`   📝 Preguntas: ${preguntas || '0'}`);
        console.log(`   📚 Temas: ${temas || '0'}`);
        console.log(`   👥 Usuarios: ${usuarios || '0'}`);
      }

    } catch (error) {
      console.log(`❌ Error como Creadora: ${error.message}`);
    }

    // PARTE 2: Como PROFESORA
    console.log('\n\n👩‍🏫 PARTE 2: BLOQUES COMO PROFESORA');
    console.log('=' .repeat(50));

    try {
      // Change to Profesor role
      await page.locator('#role-selector-container').click();
      await page.waitForTimeout(1000);

      await page.locator('#role-options span:text("Profesor")').first().click();
      await page.waitForTimeout(3000);

      // Navigate to Recursos tab
      await page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first().click();
      await page.waitForTimeout(2000);

      // Extract blocks
      await page.waitForSelector('#recursos-bloques-creados-container', { timeout: 10000 });
      const container = page.locator('#recursos-bloques-creados-container');
      const blockCards = container.locator('.bc-block-card');
      const cardCount = await blockCards.count();

      console.log(`✅ BLOQUES COMO PROFESORA: ${cardCount} encontrados`);

      for (let i = 0; i < cardCount; i++) {
        const card = blockCards.nth(i);
        const titleElement = card.locator('.bc-block-title');
        const title = await titleElement.textContent();

        // Extract stats
        const preguntas = await extractStat(card, 'Preguntas');
        const temas = await extractStat(card, 'Temas');
        const usuarios = await extractStat(card, 'Usuarios');

        console.log(`\n${i + 1}. Título: "${title?.trim()}"`);
        console.log(`   📝 Preguntas: ${preguntas || '0'}`);
        console.log(`   📚 Temas: ${temas || '0'}`);
        console.log(`   👥 Usuarios: ${usuarios || '0'}`);

        // Check for Constitución Española
        if (title && title.includes('Constitución Española')) {
          console.log(`🎯 ¡ENCONTRADO! Bloque "Constitución Española 1978"`);
        }
      }

    } catch (error) {
      console.log(`❌ Error como Profesora: ${error.message}`);
    }

    console.log('\n🎯 EXTRACCIÓN COMPLETADA');

    // Helper function to extract stats
    async function extractStat(card, statName) {
      try {
        // Try inline format first
        const inlineStatsDiv = card.locator('div[style*="margin-bottom"]');
        const inlineExists = await inlineStatsDiv.count();

        if (inlineExists > 0) {
          const statSpan = inlineStatsDiv.locator(`span:has(strong:has-text("${statName}:"))`);
          const spanExists = await statSpan.count();

          if (spanExists > 0) {
            const spanText = await statSpan.textContent();
            return spanText.split(':')[1]?.trim();
          }
        }

        // Fallback to old format
        const statItems = card.locator('.bc-stat-item');
        const itemCount = await statItems.count();

        for (let i = 0; i < itemCount; i++) {
          const item = statItems.nth(i);
          const labelElement = item.locator('.bc-stat-label');
          const labelExists = await labelElement.count();

          if (labelExists > 0) {
            const labelText = await labelElement.textContent();
            if (labelText && labelText.toLowerCase().includes(statName.toLowerCase())) {
              const numberElement = item.locator('.bc-stat-number');
              const numberExists = await numberElement.count();
              if (numberExists > 0) {
                return await numberElement.textContent();
              }
            }
          }
        }

        return null;
      } catch (error) {
        return null;
      }
    }
  });

});