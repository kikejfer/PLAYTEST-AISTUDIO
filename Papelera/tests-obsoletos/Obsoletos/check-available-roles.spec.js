const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Check Available Roles on Render', () => {

  test('Verify all roles available for Toñi on Render', async ({ page }) => {
    console.log('🎯 VERIFICANDO ROLES DISPONIBLES EN RENDER');
    console.log(`📍 URL: ${BASE_URL}`);
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Go to creators panel to check roles (CORRECT PAGE)
    console.log('🔄 Navegando al panel de creadores (PÁGINA CORRECTA)...');
    await page.goto(`${BASE_URL}/creators-panel-content.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if "Creador de contenido" button exists
    console.log('🔍 Verificando botón "Creador de contenido"...');
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
      console.log('🔍 ROLES DISPONIBLES EN RENDER:');
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
      } else {
        console.log('❌ No se encontraron spans en role-options');
      }

      // Also check all buttons/options within role-options
      const allElements = await page.locator('#role-options *').all();
      console.log(`\n📋 Todos los elementos en role-options: ${allElements.length}`);

      for (let i = 0; i < Math.min(allElements.length, 15); i++) {
        const element = allElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent();
        const className = await element.getAttribute('class') || '';
        console.log(`  ${i + 1}. <${tagName.toLowerCase()}> "${text?.trim()}" class="${className}"`);
      }

      // Specifically check for expected roles
      const expectedRoles = ['Creador', 'Profesor', 'Administrador Secundario', 'Admin'];
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

    // Check current role display
    console.log('\n🔍 Verificando rol actual mostrado...');
    const currentRole = page.locator('#current-role-name');
    const currentRoleExists = await currentRole.count();

    if (currentRoleExists > 0) {
      const roleText = await currentRole.textContent();
      console.log(`📋 Rol actual: "${roleText}"`);
    } else {
      console.log('❌ No se puede determinar el rol actual');
    }

    // Check URL to verify we're on Render and correct page
    const currentURL = page.url();
    console.log(`\n📍 URL actual: ${currentURL}`);
    console.log(`🌐 ¿En Render?: ${currentURL.includes('onrender.com') ? '✅ SÍ' : '❌ NO'}`);
    console.log(`📄 ¿Página correcta?: ${currentURL.includes('creators-panel-content') ? '✅ SÍ' : '❌ NO'}`);

    console.log('\n⏸️ Manteniendo navegador abierto para inspección...');
    await page.waitForTimeout(30000);
  });

});