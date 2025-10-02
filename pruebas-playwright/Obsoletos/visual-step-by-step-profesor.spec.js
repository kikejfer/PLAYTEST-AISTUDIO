const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Marcar Cada Elemento Paso a Paso', () => {

  test('Marcar visualmente cada elemento hasta el botón Profesor', async ({ page }) => {
    console.log('🎯 MARCANDO CADA ELEMENTO PASO A PASO HASTA PROFESOR');
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

    console.log('📍 PASO 1: MARCAR HEADER-CONTAINER');
    const headerContainer = page.locator('#header-container');
    await headerContainer.evaluate(element => {
      element.style.border = '3px solid blue';
      element.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
      element.scrollIntoView();
    });
    console.log('🔵 #header-container marcado en AZUL');
    await page.waitForTimeout(2000);

    console.log('📍 PASO 2: MARCAR USER-HEADER');
    const userHeader = page.locator('#header-container .user-header');
    await userHeader.evaluate(element => {
      element.style.border = '3px solid purple';
      element.style.backgroundColor = 'rgba(128, 0, 128, 0.1)';
      element.scrollIntoView();
    });
    console.log('🟣 .user-header marcado en PÚRPURA');
    await page.waitForTimeout(2000);

    console.log('📍 PASO 3: MARCAR BOTÓN "CREADOR DE CONTENIDO"');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();

    if (creadorExists > 0) {
      await creadorButton.evaluate(element => {
        element.style.border = '5px solid orange';
        element.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
        element.scrollIntoView();
      });
      console.log('🟠 Botón "Creador de contenido" marcado en NARANJA');
      await page.waitForTimeout(3000);

      console.log('📍 PASO 4: CLICK EN "CREADOR DE CONTENIDO"');
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Click ejecutado en "Creador de contenido"');
    }

    console.log('📍 PASO 5: MARCAR ROLE-SELECTOR-CONTAINER');
    const roleSelectorContainer = page.locator('#role-selector-container');
    await roleSelectorContainer.evaluate(element => {
      element.style.border = '5px solid red';
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      element.scrollIntoView();
    });
    console.log('🔴 #role-selector-container marcado en ROJO');
    await page.waitForTimeout(3000);

    console.log('📍 PASO 6: CLICK EN ROLE-SELECTOR-CONTAINER');
    await roleSelectorContainer.click();
    await page.waitForTimeout(1000);
    console.log('✅ Click ejecutado en #role-selector-container');

    console.log('📍 PASO 7: MARCAR ROLE-SELECTOR-BTN');
    const roleSelectorBtn = page.locator('#role-selector-btn');
    await roleSelectorBtn.evaluate(element => {
      element.style.border = '5px solid cyan';
      element.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
      element.scrollIntoView();
    });
    console.log('🔵 #role-selector-btn marcado en CIAN');
    await page.waitForTimeout(3000);

    console.log('📍 PASO 8: CLICK EN ROLE-SELECTOR-BTN');
    await roleSelectorBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ Click ejecutado en #role-selector-btn');

    console.log('📍 PASO 9: MARCAR ROLE-OPTIONS DROPDOWN');
    const roleOptions = page.locator('#role-options');
    const optionsVisible = await roleOptions.isVisible();

    if (optionsVisible) {
      await roleOptions.evaluate(element => {
        element.style.border = '5px solid green';
        element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        element.scrollIntoView();
      });
      console.log('🟢 #role-options marcado en VERDE');
      await page.waitForTimeout(2000);

      console.log('📍 PASO 10: MARCAR TODAS LAS OPCIONES DE ROL');
      const allSpans = await roleOptions.locator('span').all();

      for (let i = 0; i < allSpans.length; i++) {
        const span = allSpans[i];
        const text = await span.textContent();

        if (text && text.trim()) {
          const color = text.includes('Profesor') ? 'yellow' : 'lightgray';

          await span.evaluate((element, color) => {
            element.style.border = `3px solid ${color === 'yellow' ? 'gold' : 'gray'}`;
            element.style.backgroundColor = color;
            element.style.padding = '5px';
            element.scrollIntoView();
          }, color);

          console.log(`📋 Span ${i + 1}: "${text.trim()}" marcado en ${color.toUpperCase()}`);

          if (text.includes('Profesor')) {
            console.log('🎯 ¡ESTE ES EL SPAN "PROFESOR" TARGET!');
            await page.waitForTimeout(3000);

            console.log('📍 PASO 11: CLICK EN SPAN "PROFESOR"');
            await span.click();
            await page.waitForTimeout(3000);
            console.log('✅ Click ejecutado en span "Profesor"');

            // Check role change
            const currentRoleName = page.locator('#current-role-name');
            const currentRole = await currentRoleName.textContent();
            console.log(`🎯 Rol actual después del click: "${currentRole}"`);

            break;
          }

          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('❌ #role-options no es visible');
    }

    console.log('📍 PASO 12: MARCAR PESTAÑA RECURSOS');
    await page.waitForTimeout(2000);
    const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")');
    const recursosExists = await recursosTab.count();

    if (recursosExists > 0) {
      await recursosTab.first().evaluate(element => {
        element.style.border = '5px solid magenta';
        element.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
        element.scrollIntoView();
      });
      console.log('🟣 Pestaña "Recursos" marcada en MAGENTA');
      await page.waitForTimeout(3000);

      await recursosTab.first().click();
      await page.waitForTimeout(3000);
      console.log('✅ Click ejecutado en pestaña "Recursos"');
    }

    console.log('📍 PASO 13: MARCAR CONTAINER FINAL');
    const finalContainer = page.locator('#recursos-bloques-creados-container');
    const containerExists = await finalContainer.count();

    if (containerExists > 0) {
      await finalContainer.evaluate(element => {
        element.style.border = '5px solid lime';
        element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        element.scrollIntoView();
      });
      console.log('🟢 Container final marcado en LIMA');
    }

    console.log('\n✅ TODOS LOS ELEMENTOS MARCADOS PASO A PASO');
    console.log('⏸️ Manteniendo navegador abierto para inspección...');
    await page.waitForTimeout(30000);
  });

});