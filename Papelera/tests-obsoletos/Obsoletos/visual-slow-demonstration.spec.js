const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Demostración Visual Lenta', () => {

  test('Mostrar visualmente cada paso con pausa larga para observación', async ({ page }) => {
    console.log('🎯 DEMOSTRACIÓN VISUAL LENTA - PARA QUE PUEDAS VER TODO');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 PASO 1: Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);
    console.log('✅ Login completado - PAUSA 5 segundos para observar');
    await page.waitForTimeout(5000);

    // Navigate to teachers panel
    console.log('🔄 PASO 2: Navegando a teachers panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ En teachers panel - PAUSA 5 segundos para observar');
    await page.waitForTimeout(5000);

    // Highlight and show current state
    console.log('📍 PASO 3: Mostrando estado inicial...');
    const headerContainer = page.locator('#header-container');
    await headerContainer.evaluate(element => {
      element.style.border = '3px solid blue';
      element.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    });

    const currentRoleInitial = page.locator('#current-role-name');
    const initialRoleText = await currentRoleInitial.textContent();
    console.log(`🎯 ROL INICIAL: "${initialRoleText}"`);

    await currentRoleInitial.evaluate(element => {
      element.style.border = '3px solid red';
      element.style.backgroundColor = 'yellow';
      element.style.fontSize = '20px';
      element.style.padding = '10px';
    });
    console.log('✅ Rol inicial marcado - PAUSA 8 segundos para observar');
    await page.waitForTimeout(8000);

    // Step 4: Click Creador de contenido
    console.log('📍 PASO 4: Buscando y marcando botón "Creador de contenido"...');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();
    console.log(`Botón "Creador de contenido" existe: ${creadorExists > 0 ? 'SÍ' : 'NO'}`);

    if (creadorExists > 0) {
      await creadorButton.evaluate(element => {
        element.style.border = '5px solid orange';
        element.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
        element.style.transform = 'scale(1.1)';
        element.scrollIntoView();
      });
      console.log('✅ Botón "Creador de contenido" marcado - PAUSA 5 segundos');
      await page.waitForTimeout(5000);

      console.log('🔄 HACIENDO CLICK en "Creador de contenido"...');
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Click ejecutado - PAUSA 5 segundos para ver cambios');
      await page.waitForTimeout(5000);
    }

    // Step 5: Role selector container
    console.log('📍 PASO 5: Marcando role-selector-container...');
    const roleSelectorContainer = page.locator('#role-selector-container');
    await roleSelectorContainer.evaluate(element => {
      element.style.border = '5px solid red';
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      element.style.transform = 'scale(1.05)';
      element.scrollIntoView();
    });
    console.log('✅ Role-selector-container marcado - PAUSA 5 segundos');
    await page.waitForTimeout(5000);

    console.log('🔄 HACIENDO CLICK en role-selector-container...');
    await roleSelectorContainer.click();
    await page.waitForTimeout(1000);
    console.log('✅ Click ejecutado - PAUSA 3 segundos');
    await page.waitForTimeout(3000);

    // Step 6: Role selector btn
    console.log('📍 PASO 6: Marcando role-selector-btn...');
    const roleSelectorBtn = page.locator('#role-selector-btn');
    await roleSelectorBtn.evaluate(element => {
      element.style.border = '5px solid cyan';
      element.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
      element.style.transform = 'scale(1.05)';
      element.scrollIntoView();
    });
    console.log('✅ Role-selector-btn marcado - PAUSA 5 segundos');
    await page.waitForTimeout(5000);

    console.log('🔄 HACIENDO CLICK en role-selector-btn...');
    await roleSelectorBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ Click ejecutado - PAUSA 5 segundos para ver dropdown');
    await page.waitForTimeout(5000);

    // Step 7: Show dropdown options
    console.log('📍 PASO 7: Analizando opciones del dropdown...');
    const roleOptions = page.locator('#role-options');
    const optionsVisible = await roleOptions.isVisible();
    console.log(`Dropdown visible: ${optionsVisible ? 'SÍ' : 'NO'}`);

    if (optionsVisible) {
      await roleOptions.evaluate(element => {
        element.style.border = '5px solid green';
        element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        element.scrollIntoView();
      });

      const allSpans = await roleOptions.locator('span').all();
      console.log(`Total spans encontrados: ${allSpans.length}`);

      for (let i = 0; i < allSpans.length; i++) {
        const span = allSpans[i];
        const text = await span.textContent();
        console.log(`Span ${i + 1}: "${text?.trim()}"`);

        if (text && text.trim() === 'Profesor') {
          await span.evaluate(element => {
            element.style.border = '5px solid gold';
            element.style.backgroundColor = 'yellow';
            element.style.fontSize = '18px';
            element.style.padding = '10px';
            element.style.transform = 'scale(1.2)';
            element.scrollIntoView();
          });
          console.log('🎯 ¡SPAN "PROFESOR" MARCADO EN DORADO!');
          console.log('✅ PAUSA 8 segundos para que observes el span Profesor');
          await page.waitForTimeout(8000);

          console.log('🔄 HACIENDO CLICK en span "Profesor"...');
          await span.click();
          await page.waitForTimeout(3000);
          console.log('✅ Click en "Profesor" ejecutado');

          // Check role change immediately
          const currentRoleAfter = await currentRoleInitial.textContent();
          console.log(`🎯 ROL DESPUÉS DEL CLICK: "${currentRoleAfter}"`);
          console.log('✅ PAUSA 10 segundos para ver si cambió el rol');
          await page.waitForTimeout(10000);

          break;
        }
      }
    }

    console.log('\n🎯 ESTADO FINAL - PUEDES OBSERVAR LA PÁGINA');
    console.log('⏸️ El navegador permanecerá abierto 60 segundos para inspección manual');
    await page.waitForTimeout(60000);
  });

});