const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Test Base URL for All Available Roles', () => {

  test('Check all roles on base URL as user specified', async ({ page }) => {
    console.log('🎯 VERIFICANDO ROLES EN URL BASE CORRECTA');
    console.log(`📍 URL: ${BASE_URL}`);
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Check current page after login
    const currentURL = page.url();
    console.log(`📍 URL después del login: ${currentURL}`);

    // Look for "Jugador" button first
    console.log('🔄 Buscando botón "Jugador"...');
    const jugadorButton = page.locator('button:has(span:text("Jugador"))');
    const jugadorExists = await jugadorButton.count();
    console.log(`📋 Botón "Jugador": ${jugadorExists > 0 ? '✅ Encontrado' : '❌ NO encontrado'}`);

    if (jugadorExists > 0) {
      await jugadorButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Click en "Jugador" ejecutado');
    }

    // Look for "Creador de contenido" button
    console.log('🔄 Buscando botón "Creador de contenido"...');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();
    console.log(`📋 Botón "Creador de contenido": ${creadorExists > 0 ? '✅ Encontrado' : '❌ NO encontrado'}`);

    if (creadorExists > 0) {
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Click en "Creador de contenido" ejecutado');
    }

    // Check role selector
    console.log('🔍 Verificando selector de roles...');
    const roleSelector = page.locator('#role-selector-container');
    const selectorExists = await roleSelector.count();
    console.log(`📋 Selector de roles: ${selectorExists > 0 ? '✅ Encontrado' : '❌ NO encontrado'}`);

    if (selectorExists > 0) {
      await roleSelector.click();
      await page.waitForTimeout(1500);

      // Try again if options not visible
      const roleOptions = page.locator('#role-options');
      const optionsVisible = await roleOptions.isVisible();
      if (!optionsVisible) {
        await roleSelector.click();
        await page.waitForTimeout(1000);
      }

      // List all available role options
      console.log('🔍 TODOS LOS ROLES DISPONIBLES EN URL BASE:');
      console.log('-' .repeat(40));

      const allSpans = await page.locator('#role-options span').all();
      console.log(`📋 Total spans en role-options: ${allSpans.length}`);

      if (allSpans.length > 0) {
        for (let i = 0; i < allSpans.length; i++) {
          const span = allSpans[i];
          const text = await span.textContent();
          const isVisible = await span.isVisible();
          console.log(`  ${i + 1}. "${text?.trim()}" ${isVisible ? '(visible)' : '(oculto)'}`);
        }
      }

      // Specifically check for expected roles including Administrador Secundario
      const expectedRoles = ['Creador', 'Profesor', 'Administrador Secundario', 'Admin', 'Jugador'];
      console.log('\n🔍 VERIFICANDO ROLES ESPERADOS:');
      console.log('-' .repeat(40));

      for (const role of expectedRoles) {
        const roleSpan = page.locator(`#role-options span:text("${role}")`);
        const roleExists = await roleSpan.count();
        console.log(`  📋 ${role}: ${roleExists > 0 ? '✅ Disponible' : '❌ NO disponible'}`);
      }

    } else {
      console.log('❌ No se puede verificar roles - selector no encontrado');
    }

    // Check all available elements on page for debugging
    console.log('\n🔍 ELEMENTOS DISPONIBLES EN LA PÁGINA:');
    console.log('-' .repeat(40));

    const allButtons = await page.locator('button').all();
    console.log(`📋 Total botones en la página: ${allButtons.length}`);

    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      if (text && text.trim()) {
        console.log(`  Botón ${i + 1}: "${text.trim()}" ${isVisible ? '(visible)' : '(oculto)'}`);
      }
    }

    console.log('\n⏸️ Manteniendo navegador abierto para inspección...');
    await page.waitForTimeout(30000);
  });

});