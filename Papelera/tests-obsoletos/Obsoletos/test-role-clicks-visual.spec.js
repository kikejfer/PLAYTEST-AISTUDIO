const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Visual Role Clicks Test', () => {

  test('Show role button clicks step by step', async ({ page }) => {
    console.log('🎯 PRUEBA DE CLICKS EN BOTONES DE ROL');
    console.log('=' .repeat(50));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    console.log('🔄 Navegando al panel de profesores...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // STEP 1: Look for and highlight "Creador de contenido" button
    console.log('🔄 PASO 1: Buscando botón "Creador de contenido"...');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();

    console.log(`📋 Botones "Creador de contenido" encontrados: ${creadorExists}`);

    if (creadorExists > 0) {
      // Highlight the button before clicking
      await creadorButton.evaluate(element => {
        element.style.border = '10px solid red';
        element.style.backgroundColor = 'yellow';
        element.scrollIntoView();
      });

      console.log('🟡 Botón "Creador de contenido" resaltado en AMARILLO con borde ROJO');
      await page.waitForTimeout(3000);

      // Click the button
      console.log('📋 Haciendo click en "Creador de contenido"...');
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Click en "Creador de contenido" ejecutado');

    } else {
      console.log('❌ Botón "Creador de contenido" NO encontrado');
    }

    // STEP 2: Look for role selector container
    console.log('🔄 PASO 2: Buscando selector de roles...');
    const roleSelector = page.locator('#role-selector-container');
    const selectorExists = await roleSelector.count();

    console.log(`📋 Selectores de rol encontrados: ${selectorExists}`);

    if (selectorExists > 0) {
      // Highlight role selector
      await roleSelector.evaluate(element => {
        element.style.border = '10px solid blue';
        element.style.backgroundColor = 'lightblue';
        element.scrollIntoView();
      });

      console.log('🔵 Selector de roles resaltado en AZUL CLARO con borde AZUL');
      await page.waitForTimeout(3000);

      // Click to open dropdown
      console.log('📋 Haciendo click en selector de roles...');
      await roleSelector.click();
      await page.waitForTimeout(1500);
      console.log('✅ Click en selector de roles ejecutado');

    } else {
      console.log('❌ Selector de roles NO encontrado');
    }

    // STEP 3: Look for role options
    console.log('🔄 PASO 3: Buscando opciones de rol...');
    const roleOptions = page.locator('#role-options');
    const optionsExists = await roleOptions.count();
    const optionsVisible = await roleOptions.isVisible();

    console.log(`📋 Contenedor de opciones encontrado: ${optionsExists > 0 ? 'SÍ' : 'NO'}`);
    console.log(`📋 Contenedor de opciones visible: ${optionsVisible ? 'SÍ' : 'NO'}`);

    if (optionsExists > 0) {
      // Try to make visible if hidden
      if (!optionsVisible) {
        console.log('⚠️ Opciones ocultas, intentando hacer click de nuevo...');
        await roleSelector.click();
        await page.waitForTimeout(1000);
      }

      // Highlight role options
      await roleOptions.evaluate(element => {
        element.style.border = '10px solid green';
        element.style.backgroundColor = 'lightgreen';
        element.scrollIntoView();
      });

      console.log('🟢 Opciones de rol resaltadas en VERDE CLARO con borde VERDE');
      await page.waitForTimeout(2000);

      // Look for "Profesor" span specifically within role-options
      console.log('🔄 PASO 4: Buscando span "Profesor" en role-options...');
      const profesorSpan = page.locator('#role-options span:text("Profesor")');
      const profesorExists = await profesorSpan.count();

      console.log(`📋 Spans "Profesor" encontrados: ${profesorExists}`);

      if (profesorExists > 0) {
        // Highlight Profesor span
        await profesorSpan.evaluate(element => {
          element.style.border = '5px solid orange';
          element.style.backgroundColor = 'orange';
          element.style.padding = '10px';
          element.scrollIntoView();
        });

        console.log('🟠 Span "Profesor" resaltado en NARANJA');
        await page.waitForTimeout(3000);

        // Click Profesor
        console.log('📋 Haciendo click en span "Profesor"...');
        await profesorSpan.click();
        await page.waitForTimeout(3000);
        console.log('✅ Click en "Profesor" ejecutado');

      } else {
        console.log('❌ Span "Profesor" NO encontrado');

        // Debug: show all available spans
        const allSpans = await page.locator('#role-options span').all();
        console.log(`🔍 Total spans en role-options: ${allSpans.length}`);

        for (let i = 0; i < allSpans.length; i++) {
          const span = allSpans[i];
          const text = await span.textContent();
          console.log(`  - Span ${i}: "${text?.trim()}"`);
        }
      }

    } else {
      console.log('❌ Contenedor de opciones NO encontrado');
    }

    console.log('\n🔄 PASO 5: Estado final de la página...');

    // Check current role display
    const currentRole = page.locator('#current-role-name');
    const currentRoleExists = await currentRole.count();

    if (currentRoleExists > 0) {
      const roleText = await currentRole.textContent();
      console.log(`📋 Rol actual mostrado: "${roleText}"`);
    } else {
      console.log('❌ No se puede determinar el rol actual');
    }

    console.log('⏸️ Manteniendo navegador abierto para inspección...');
    await page.waitForTimeout(30000);
  });

});