const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Debug: Localizar botón de subida de archivo individual', () => {

  test('Navegación paso a paso para mostrar dónde está el botón', async ({ page }) => {

    await test.step('1. Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/creators-panel-content/, { timeout: 15000 });
      console.log('✅ AndGar logged in successfully');
    });

    await test.step('2. Navegar a pestaña Añadir Preguntas', async () => {
      await page.waitForTimeout(2000);

      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Add Questions tab');

      // SCREENSHOT 1: Pestaña "Añadir Preguntas" inicial
      await page.screenshot({
        path: 'debug-step1-add-questions-tab.png',
        fullPage: true
      });
      console.log('📸 Screenshot 1: Add Questions tab - debug-step1-add-questions-tab.png');
    });

    await test.step('3. Navegar a subpestaña Subir Fichero', async () => {
      const uploadFileSubTab = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
      await uploadFileSubTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Upload File subtab');

      // SCREENSHOT 2: Subpestaña "Subir Fichero"
      await page.screenshot({
        path: 'debug-step2-upload-file-subtab.png',
        fullPage: true
      });
      console.log('📸 Screenshot 2: Upload File subtab - debug-step2-upload-file-subtab.png');
    });

    await test.step('4. Buscar texto "Subir Fichero (.txt)" y elementos relacionados', async () => {
      // Buscar texto específico
      console.log('🔍 Searching for "Subir Fichero (.txt)" text...');

      const variations = [
        'Subir Fichero (.txt)',
        'Subir Fichero',
        'Subir fichero',
        'subir fichero',
        '.txt'
      ];

      for (const variation of variations) {
        const textLocator = page.locator(`text=${variation}`);
        const count = await textLocator.count();
        console.log(`📝 "${variation}": ${count} instances found`);
      }

      // Buscar todos los inputs de archivo
      const allFileInputs = await page.locator('input[type="file"]').all();
      console.log(`📁 Total file inputs found: ${allFileInputs.length}`);

      for (let i = 0; i < allFileInputs.length; i++) {
        const input = allFileInputs[i];
        const isVisible = await input.isVisible();
        const id = await input.getAttribute('id');
        const className = await input.getAttribute('class');
        const webkitDir = await input.getAttribute('webkitdirectory');
        const multiple = await input.getAttribute('multiple');
        console.log(`Input ${i}: visible=${isVisible}, id="${id}", class="${className}", webkitdirectory=${webkitDir}, multiple=${multiple}`);
      }

      // Buscar todos los botones con texto relacionado
      const allButtons = await page.locator('button').all();
      console.log(`🔘 Total buttons found: ${allButtons.length}`);

      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        if (text && (
          text.includes('archiv') ||
          text.includes('file') ||
          text.includes('subir') ||
          text.includes('examinar') ||
          text.includes('elegir') ||
          text.includes('Subir') ||
          text.includes('Examinar') ||
          text.includes('Elegir')
        )) {
          console.log(`Button ${i}: "${text.trim()}", visible=${isVisible}`);
        }
      }

      // SCREENSHOT 3: Estado actual con debug info
      await page.screenshot({
        path: 'debug-step3-current-state.png',
        fullPage: true
      });
      console.log('📸 Screenshot 3: Current state with debug info - debug-step3-current-state.png');
    });

    console.log('🏁 Debug test completed. Check screenshots to locate the file upload button.');
    console.log('📁 Screenshots saved:');
    console.log('   - debug-step1-add-questions-tab.png');
    console.log('   - debug-step2-upload-file-subtab.png');
    console.log('   - debug-step3-current-state.png');
  });
});