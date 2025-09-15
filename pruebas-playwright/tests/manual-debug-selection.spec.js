const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Manual Debug: Pausa para selección manual', () => {
  
  test('Pausa después de subir archivos para selección manual', async ({ page }) => {
    
    await test.step('Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      await expect(page).toHaveURL(/creators-panel-content/);
      console.log('✅ AndGar logged in successfully');
    });
    
    await test.step('Ir a Añadir Preguntas y activar Subida Múltiple', async () => {
      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Add Questions tab');
      
      // PASO CRÍTICO: Activar "Subida Múltiple desde Carpeta" primero
      const multipleUploadOption = page.locator('text="Subida Múltiple desde Carpeta", button:has-text("Subida Múltiple"), .multiple-upload-option').first();
      
      if (await multipleUploadOption.count() > 0) {
        await multipleUploadOption.click();
        await page.waitForTimeout(1000);
        console.log('✅ "Subida Múltiple desde Carpeta" option activated');
      } else {
        console.log('⚠️ "Subida Múltiple desde Carpeta" option not found, trying alternatives');
        
        const alternativeOptions = [
          'text="Múltiple"',
          'text="Carpeta"', 
          'text="Multiple"',
          'button:has-text("Múltiple")'
        ];
        
        for (const selector of alternativeOptions) {
          const option = page.locator(selector).first();
          if (await option.count() > 0) {
            await option.click();
            await page.waitForTimeout(1000);
            console.log(`✅ Activated multiple upload with: ${selector}`);
            break;
          }
        }
      }
      
      // Subir archivos después de activar múltiple
      const multiFileUpload = page.locator('input[type="file"]:not([webkitdirectory])').first();
      await multiFileUpload.setInputFiles([
        'tests/CE1978_Título I Derechos y Deberes.txt',
        'tests/CE1978_Título II La Corona.txt', 
        'tests/CE1978_Título III Cortes Generales.txt'
      ]);
      console.log('✅ Files uploaded successfully after activating multiple upload');
      
      await page.waitForTimeout(3000); // Esperar a que aparezcan los archivos
      console.log('📋 Files should now be visible for selection');
    });
    
    await test.step('🛑 PAUSA MANUAL - Selecciona los archivos', async () => {
      console.log('\n🛑 PAUSA MANUAL ACTIVADA');
      console.log('📋 Por favor:');
      console.log('1. Selecciona manualmente los 3 archivos CE1978 en el navegador');
      console.log('2. Pulsa "Cargar" o el botón correspondiente');
      console.log('3. Observa la estructura de los elementos');
      console.log('4. Presiona cualquier tecla en la consola para continuar...');
      
      // PAUSA INDEFINIDA hasta que presiones una tecla
      await page.pause();
      
      console.log('✅ Continuando después de selección manual...');
    });
    
    await test.step('Analizar elementos después de selección manual', async () => {
      console.log('\n=== 🔍 ANÁLISIS POST-SELECCIÓN MANUAL ===');
      
      // Verificar estado de todos los checkboxes
      const allCheckboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await allCheckboxes.count();
      console.log(`📊 Total checkboxes after manual selection: ${checkboxCount}`);
      
      for (let i = 0; i < Math.min(checkboxCount, 10); i++) {
        const checkbox = allCheckboxes.nth(i);
        const isVisible = await checkbox.isVisible();
        const isChecked = await checkbox.isChecked();
        const value = await checkbox.getAttribute('value') || 'no-value';
        
        console.log(`Checkbox ${i + 1}: visible=${isVisible}, checked=${isChecked}, value="${value}"`);
        
        if (isChecked) {
          console.log(`  ✅ ESTE CHECKBOX ESTÁ SELECCIONADO`);
          
          // Analizar el elemento padre del checkbox seleccionado
          try {
            const parentHTML = await checkbox.evaluate((el) => {
              const parent = el.parentElement;
              return parent ? parent.outerHTML : 'no-parent';
            });
            console.log(`  📋 Parent HTML: ${parentHTML.substring(0, 200)}...`);
          } catch (e) {
            console.log(`  📋 Parent HTML: error`);
          }
        }
      }
      
      // Buscar botones activos
      const buttons = page.locator('button:not([disabled])');
      const buttonCount = await buttons.count();
      console.log(`\n🔘 Active buttons found: ${buttonCount}`);
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`Button ${i + 1}: "${text}" (visible: ${isVisible})`);
      }
    });
    
    await test.step('Capturar screenshot del estado final', async () => {
      await page.screenshot({ path: 'manual-selection-result.png', fullPage: true });
      console.log('📸 Screenshot saved: manual-selection-result.png');
    });
    
    console.log('\n🎉 Manual debug completed - check console output above');
  });
});