const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Debug: Mostrar archivos que busca', () => {
  
  test('Debug - Mostrar todos los elementos después de subir archivos', async ({ page }) => {
    
    await test.step('Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      await expect(page).toHaveURL(/creators-panel-content/);
      console.log('✅ AndGar logged in successfully');
    });
    
    await test.step('Ir a Añadir Preguntas y subir archivos', async () => {
      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Add Questions tab');
      
      // Subir archivos
      const multiFileUpload = page.locator('input[type="file"]:not([webkitdirectory])').first();
      await multiFileUpload.setInputFiles([
        'tests/CE1978_Título I Derechos y Deberes.txt',
        'tests/CE1978_Título II La Corona.txt', 
        'tests/CE1978_Título III Cortes Generales.txt'
      ]);
      console.log('✅ Files uploaded successfully');
      
      await page.waitForTimeout(3000); // Esperar a que aparezcan los archivos
    });
    
    await test.step('Debug - Mostrar TODOS los checkboxes en la página', async () => {
      console.log('\n=== 🔍 DEBUG: TODOS LOS CHECKBOXES EN LA PÁGINA ===');
      
      const allCheckboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await allCheckboxes.count();
      console.log(`📊 Total checkboxes found: ${checkboxCount}`);
      
      for (let i = 0; i < Math.min(checkboxCount, 10); i++) {
        const checkbox = allCheckboxes.nth(i);
        const isVisible = await checkbox.isVisible();
        const value = await checkbox.getAttribute('value') || 'no-value';
        const id = await checkbox.getAttribute('id') || 'no-id';
        const name = await checkbox.getAttribute('name') || 'no-name';
        const dataAttrs = await checkbox.evaluate((el) => {
          const attrs = {};
          for (let attr of el.attributes) {
            if (attr.name.startsWith('data-')) {
              attrs[attr.name] = attr.value;
            }
          }
          return attrs;
        });
        
        console.log(`Checkbox ${i + 1}:`);
        console.log(`  - Visible: ${isVisible}`);
        console.log(`  - Value: "${value}"`);
        console.log(`  - ID: "${id}"`);
        console.log(`  - Name: "${name}"`);
        console.log(`  - Data attributes:`, dataAttrs);
        
        // Intentar obtener el texto del elemento padre o hermano
        try {
          const parentText = await checkbox.evaluate((el) => {
            const parent = el.parentElement;
            return parent ? parent.textContent.substring(0, 100) : 'no-parent';
          });
          console.log(`  - Parent text: "${parentText}"`);
        } catch (e) {
          console.log(`  - Parent text: error`);
        }
        console.log('---');
      }
    });
    
    await test.step('Debug - Buscar referencias a archivos CE1978', async () => {
      console.log('\n=== 🔍 DEBUG: REFERENCIAS A ARCHIVOS CE1978 ===');
      
      const ce1978Keywords = ['CE1978', 'Título I', 'Título II', 'Título III', 'Derechos', 'Corona', 'Cortes'];
      
      for (const keyword of ce1978Keywords) {
        const elements = page.locator(`text=${keyword}`);
        const count = await elements.count();
        console.log(`Keyword "${keyword}": ${count} occurrences`);
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const element = elements.nth(i);
            const text = await element.textContent();
            console.log(`  - "${text?.substring(0, 80)}..."`);
          }
        }
      }
    });
    
    await test.step('Debug - Mostrar estructura HTML de la sección de archivos', async () => {
      console.log('\n=== 🔍 DEBUG: ESTRUCTURA HTML DESPUÉS DE SUBIR ARCHIVOS ===');
      
      // Buscar contenedores posibles
      const possibleContainers = [
        '.file-upload-area',
        '.multifile-section', 
        '.files-container',
        '.upload-container',
        '.file-list',
        '.uploaded-files',
        '#file-upload',
        '[data-files]'
      ];
      
      for (const selector of possibleContainers) {
        const container = page.locator(selector);
        const count = await container.count();
        if (count > 0) {
          console.log(`\nContainer "${selector}" found (${count} elements):`);
          try {
            const html = await container.first().innerHTML();
            console.log(html.substring(0, 500) + '...');
          } catch (e) {
            console.log('Error getting HTML');
          }
        }
      }
    });
    
    await test.step('Debug - Capturar screenshot para análisis visual', async () => {
      await page.screenshot({ path: 'debug-after-file-upload.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-after-file-upload.png');
    });
    
    console.log('\n🏁 Debug completed - review the output above');
  });
});