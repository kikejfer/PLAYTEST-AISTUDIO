const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

// Configuration
const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Visual Debug Toñi Profesora', () => {

  test('Show what the function is doing step by step', async ({ page }) => {
    console.log('🔄 PASO 1: Haciendo login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);
    console.log('✅ Login completado');

    console.log('🔄 PASO 2: Navegando a teachers-panel-schedules.html...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Página cargada');

    console.log('🔄 PASO 3: Buscando tab "Recursos"...');
    const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first();

    // Highlight the tab we're about to click
    await recursosTab.evaluate(element => {
      element.style.border = '3px solid red';
      element.style.backgroundColor = 'yellow';
    });

    await page.waitForTimeout(2000);
    console.log('✅ Tab "Recursos" encontrado y resaltado');

    console.log('🔄 PASO 4: Haciendo click en tab "Recursos"...');
    await recursosTab.click();
    await page.waitForTimeout(3000);
    console.log('✅ Click en "Recursos" realizado');

    console.log('🔄 PASO 5: Buscando contenedor de bloques...');
    const container = page.locator('#recursos-bloques-creados-container');

    // Highlight the container
    await container.evaluate(element => {
      element.style.border = '5px solid blue';
      element.style.backgroundColor = 'lightblue';
    });

    await page.waitForTimeout(2000);
    console.log('✅ Contenedor encontrado y resaltado');

    console.log('🔄 PASO 6: Contando bloques en el contenedor...');
    const blockCards = container.locator('.bc-block-card');
    const cardCount = await blockCards.count();
    console.log(`📊 Encontrados ${cardCount} bloques`);

    console.log('🔄 PASO 7: Resaltando cada bloque encontrado...');
    for (let i = 0; i < cardCount; i++) {
      const card = blockCards.nth(i);
      const titleElement = card.locator('.bc-block-title');

      // Highlight each block
      await card.evaluate((element, index) => {
        element.style.border = '3px solid green';
        element.style.margin = '10px';
        element.style.backgroundColor = 'lightgreen';
      }, i);

      const titleText = await titleElement.textContent();
      console.log(`📝 Bloque ${i + 1}: "${titleText?.trim()}"`);

      await page.waitForTimeout(1500);
    }

    console.log('🔍 PASO 8: Buscando específicamente "Constitución Española 1978"...');
    const constitucionElements = await page.locator('text="Constitución Española 1978"').count();

    if (constitucionElements > 0) {
      console.log('✅ ENCONTRADO: "Constitución Española 1978"');
      const constitucionElement = page.locator('text="Constitución Española 1978"').first();
      await constitucionElement.evaluate(element => {
        element.style.border = '5px solid orange';
        element.style.backgroundColor = 'orange';
        element.style.padding = '10px';
      });
    } else {
      console.log('❌ NO ENCONTRADO: "Constitución Española 1978"');
    }

    // Search for partial matches
    console.log('🔍 PASO 9: Buscando bloques que contengan "Constitución"...');
    const allText = await page.textContent('body');
    if (allText?.includes('Constitución')) {
      console.log('✅ La palabra "Constitución" SÍ aparece en la página');
    } else {
      console.log('❌ La palabra "Constitución" NO aparece en la página');
    }

    console.log('⏸️ PAUSA FINAL: Puedes ver el estado actual de la página');
    console.log('🔍 REVISA:');
    console.log('  - ¿Estás en el panel correcto?');
    console.log('  - ¿Los bloques mostrados son los correctos para el rol Profesora?');
    console.log('  - ¿Hay algún selector de rol que falte activar?');

    // Wait 30 seconds so user can inspect the page
    await page.waitForTimeout(30000);
  });

});