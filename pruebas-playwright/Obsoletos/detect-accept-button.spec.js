const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Detectar Botón Aceptar', () => {

  test('Detectar todos los elementos después de click en rol', async ({ page }) => {
    console.log('🎯 DETECTANDO BOTÓN ACEPTAR DESPUÉS DE CLICK EN ROL');
    console.log('=' .repeat(60));

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Click Creador de contenido
    console.log('📋 PASO 1: Click en Creador de contenido...');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    await creadorButton.click();
    await page.waitForTimeout(2000);

    // Step 2: Click role selector
    console.log('📋 PASO 2: Click en role-selector-btn...');
    const roleSelectorBtn = page.locator('#role-selector-btn');
    await roleSelectorBtn.click();
    await page.waitForTimeout(1500);

    // Step 3: Click on Profesor span
    console.log('📋 PASO 3: Click en span Profesor...');
    const profesorSpan = page.locator('span:text("Profesor")').first();
    await profesorSpan.click();

    console.log('⏱️ Esperando 3 segundos para que aparezca el popup...');
    await page.waitForTimeout(3000);

    console.log('🔍 DETECTANDO TODOS LOS ELEMENTOS VISIBLES DESPUÉS DEL CLICK:');
    console.log('=' .repeat(50));

    // Check for all buttons
    const allButtons = await page.locator('button').all();
    console.log(`📋 Total botones en página: ${allButtons.length}`);

    let acceptFound = false;

    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      try {
        const isVisible = await button.isVisible();
        if (isVisible) {
          const text = await button.textContent();
          const id = await button.getAttribute('id') || 'no-id';
          const className = await button.getAttribute('class') || 'no-class';

          if (text && (
            text.toLowerCase().includes('aceptar') ||
            text.toLowerCase().includes('confirmar') ||
            text.toLowerCase().includes('ok') ||
            text.toLowerCase().includes('accept')
          )) {
            console.log(`🎯 POSIBLE BOTÓN ACEPTAR ${i + 1}:`);
            console.log(`   📝 Texto: "${text.trim()}"`);
            console.log(`   🆔 ID: "${id}"`);
            console.log(`   🎨 Class: "${className}"`);
            console.log(`   👁️ Visible: ${isVisible}`);
            acceptFound = true;
          }
        }
      } catch (error) {
        // Skip this button
      }
    }

    // Check for all inputs
    const allInputs = await page.locator('input[type="button"], input[type="submit"]').all();
    console.log(`📋 Total inputs de botón: ${allInputs.length}`);

    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      try {
        const isVisible = await input.isVisible();
        if (isVisible) {
          const value = await input.getAttribute('value') || '';
          const id = await input.getAttribute('id') || 'no-id';

          if (value && (
            value.toLowerCase().includes('aceptar') ||
            value.toLowerCase().includes('confirmar') ||
            value.toLowerCase().includes('ok')
          )) {
            console.log(`🎯 POSIBLE INPUT ACEPTAR ${i + 1}:`);
            console.log(`   📝 Value: "${value}"`);
            console.log(`   🆔 ID: "${id}"`);
            console.log(`   👁️ Visible: ${isVisible}`);
            acceptFound = true;
          }
        }
      } catch (error) {
        // Skip this input
      }
    }

    // Check for modals/popups
    const modalSelectors = [
      '.modal',
      '.popup',
      '.dialog',
      '.swal2-container',
      '[role="dialog"]',
      '.overlay'
    ];

    console.log('🔍 BUSCANDO MODALS/POPUPS:');
    for (const selector of modalSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`📋 Encontrados ${elements.length} elementos con selector: ${selector}`);

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          if (isVisible) {
            console.log(`   Modal ${i + 1} visible: ${isVisible}`);

            // Look for buttons within this modal
            const modalButtons = await element.locator('button').all();
            for (let j = 0; j < modalButtons.length; j++) {
              const btn = modalButtons[j];
              const btnText = await btn.textContent();
              const btnVisible = await btn.isVisible();
              console.log(`     Botón en modal: "${btnText?.trim()}" visible: ${btnVisible}`);
            }
          }
        }
      }
    }

    if (!acceptFound) {
      console.log('❌ NO SE ENCONTRÓ NINGÚN BOTÓN ACEPTAR OBVIO');
      console.log('🔍 Mostrando TODOS los botones visibles:');

      for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
        const button = allButtons[i];
        try {
          const isVisible = await button.isVisible();
          if (isVisible) {
            const text = await button.textContent();
            const id = await button.getAttribute('id') || 'no-id';
            console.log(`   Botón ${i + 1}: "${text?.trim()}" id="${id}"`);
          }
        } catch (error) {
          // Skip
        }
      }
    }

    console.log('\n⏸️ Manteniendo página abierta 30 segundos para inspección manual...');
    await page.waitForTimeout(30000);
  });

});