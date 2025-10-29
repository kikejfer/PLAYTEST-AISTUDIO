const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Analizar Ruta al Botón Profesor', () => {

  test('Describir todos los elementos en el camino al botón Profesor', async ({ page }) => {
    console.log('🔍 ANALIZANDO RUTA AL BOTÓN PROFESOR');
    console.log('=' .repeat(60));

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📍 PASO 1: ESTRUCTURA DEL HEADER');
    console.log('-' .repeat(40));

    // Analyze header-container
    const headerContainer = page.locator('#header-container');
    const headerExists = await headerContainer.count();
    console.log(`#header-container existe: ${headerExists > 0 ? 'SÍ' : 'NO'}`);

    if (headerExists > 0) {
      // Get all children of header-container
      const headerChildren = await headerContainer.locator('*').all();
      console.log(`Elementos hijos de #header-container: ${headerChildren.length}`);

      for (let i = 0; i < Math.min(headerChildren.length, 10); i++) {
        const child = headerChildren[i];
        const tagName = await child.evaluate(el => el.tagName);
        const className = await child.getAttribute('class') || '';
        const id = await child.getAttribute('id') || '';
        console.log(`  ${i + 1}. <${tagName.toLowerCase()}> class="${className}" id="${id}"`);
      }
    }

    console.log('\n📍 PASO 2: ESTRUCTURA USER-HEADER');
    console.log('-' .repeat(40));

    // Analyze user-header within header-container
    const userHeader = page.locator('#header-container .user-header');
    const userHeaderExists = await userHeader.count();
    console.log(`.user-header existe: ${userHeaderExists > 0 ? 'SÍ' : 'NO'}`);

    if (userHeaderExists > 0) {
      const userHeaderChildren = await userHeader.locator('*').all();
      console.log(`Elementos hijos de .user-header: ${userHeaderChildren.length}`);

      for (let i = 0; i < userHeaderChildren.length; i++) {
        const child = userHeaderChildren[i];
        const tagName = await child.evaluate(el => el.tagName);
        const className = await child.getAttribute('class') || '';
        const id = await child.getAttribute('id') || '';
        const text = await child.textContent();
        console.log(`  ${i + 1}. <${tagName.toLowerCase()}> class="${className}" id="${id}" text="${text?.trim().substring(0, 50)}"`);
      }
    }

    console.log('\n📍 PASO 3: ROLE-SELECTOR-CONTAINER');
    console.log('-' .repeat(40));

    // Analyze role-selector-container
    const roleSelectorContainer = page.locator('#role-selector-container');
    const roleSelectorExists = await roleSelectorContainer.count();
    console.log(`#role-selector-container existe: ${roleSelectorExists > 0 ? 'SÍ' : 'NO'}`);

    if (roleSelectorExists > 0) {
      const isVisible = await roleSelectorContainer.isVisible();
      const boundingBox = await roleSelectorContainer.boundingBox();
      console.log(`Visible: ${isVisible ? 'SÍ' : 'NO'}`);
      console.log(`Posición: x=${boundingBox?.x}, y=${boundingBox?.y}, width=${boundingBox?.width}, height=${boundingBox?.height}`);

      // Get children of role-selector-container
      const roleSelectorChildren = await roleSelectorContainer.locator('*').all();
      console.log(`Elementos hijos: ${roleSelectorChildren.length}`);

      for (let i = 0; i < roleSelectorChildren.length; i++) {
        const child = roleSelectorChildren[i];
        const tagName = await child.evaluate(el => el.tagName);
        const className = await child.getAttribute('class') || '';
        const id = await child.getAttribute('id') || '';
        const text = await child.textContent();
        console.log(`  ${i + 1}. <${tagName.toLowerCase()}> class="${className}" id="${id}" text="${text?.trim()}"`);
      }
    }

    console.log('\n📍 PASO 4: CLICK EN ROLE-SELECTOR-CONTAINER');
    console.log('-' .repeat(40));

    // Click "Creador de contenido" first if needed
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();
    if (creadorExists > 0) {
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked "Creador de contenido" button');
    }

    // Click role-selector-container
    if (roleSelectorExists > 0) {
      await roleSelectorContainer.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked #role-selector-container');

      // Check if role-options appeared
      const roleOptions = page.locator('#role-options');
      const optionsExists = await roleOptions.count();
      const optionsVisible = await roleOptions.isVisible();

      console.log(`#role-options existe: ${optionsExists > 0 ? 'SÍ' : 'NO'}`);
      console.log(`#role-options visible: ${optionsVisible ? 'SÍ' : 'NO'}`);

      if (optionsExists > 0) {
        console.log('\n📍 PASO 5: CONTENIDO DE ROLE-OPTIONS');
        console.log('-' .repeat(40));

        // Analyze all elements within role-options
        const allOptionsElements = await roleOptions.locator('*').all();
        console.log(`Total elementos en #role-options: ${allOptionsElements.length}`);

        for (let i = 0; i < allOptionsElements.length; i++) {
          const element = allOptionsElements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class') || '';
          const id = await element.getAttribute('id') || '';
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          const boundingBox = await element.boundingBox();

          console.log(`  ${i + 1}. <${tagName.toLowerCase()}> class="${className}" id="${id}"`);
          console.log(`      text: "${text?.trim()}"`);
          console.log(`      visible: ${isVisible ? 'SÍ' : 'NO'}, enabled: ${isEnabled ? 'SÍ' : 'NO'}`);
          console.log(`      position: x=${boundingBox?.x}, y=${boundingBox?.y}`);

          // If this is the Profesor span, give extra details
          if (text && text.includes('Profesor')) {
            console.log(`      🎯 ¡ESTE ES EL ELEMENTO "PROFESOR"!`);

            // Try to get parent information
            const parent = element.locator('..');
            const parentTagName = await parent.evaluate(el => el.tagName).catch(() => 'unknown');
            const parentClass = await parent.getAttribute('class').catch(() => '');
            const parentId = await parent.getAttribute('id').catch(() => '');

            console.log(`      Padre: <${parentTagName.toLowerCase()}> class="${parentClass}" id="${parentId}"`);
          }
        }

        console.log('\n📍 PASO 6: ESPECÍFICAMENTE SPANS CON TEXTO');
        console.log('-' .repeat(40));

        // Look specifically at spans
        const allSpans = await roleOptions.locator('span').all();
        console.log(`Total spans en #role-options: ${allSpans.length}`);

        for (let i = 0; i < allSpans.length; i++) {
          const span = allSpans[i];
          const text = await span.textContent();
          const isVisible = await span.isVisible();
          const isEnabled = await span.isEnabled();
          const style = await span.getAttribute('style') || '';

          console.log(`  Span ${i + 1}: "${text?.trim()}"`);
          console.log(`    visible: ${isVisible}, enabled: ${isEnabled}`);
          console.log(`    style: "${style}"`);

          if (text && text.trim() === 'Profesor') {
            console.log(`    🎯 ¡ESTE ES EL SPAN "Profesor" EXACTO!`);
          }
        }
      }
    }

    console.log('\n⏸️ Análisis completado, manteniendo navegador abierto...');
    await page.waitForTimeout(30000);
  });

});