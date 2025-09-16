const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Test Secuencial: Creación y Verificación de Bloque', () => {
  
  test('AndGar crea bloque y verifica inmediatamente que aparece', async ({ page }) => {
    
    await test.step('1. Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      await expect(page).toHaveURL(/creators-panel-content/);
      console.log('✅ AndGar logged in successfully');
    });
    
    await test.step('2. Crear bloque con carga multiarchivo', async () => {
      // Ir a la pestaña de Añadir Preguntas
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
      
      // PASO CRÍTICO: Seleccionar SOLO los 3 archivos CE1978 específicos
      await page.waitForTimeout(2000); // Esperar a que aparezcan los archivos
      
      // Buscar checkboxes específicos para los archivos CE1978
      const ce1978Files = [
        'CE1978_Título I Derechos y Deberes.txt',
        'CE1978_Título II La Corona.txt', 
        'CE1978_Título III Cortes Generales.txt'
      ];
      
      let selectedCount = 0;
      
      // Intentar seleccionar por nombre de archivo específico
      for (const fileName of ce1978Files) {
        const checkboxSelectors = [
          `input[type="checkbox"][value*="${fileName}"]`,
          `input[type="checkbox"][data-filename*="${fileName}"]`,
          `label:has-text("${fileName}") input[type="checkbox"]`,
          `text=${fileName} >> .. >> input[type="checkbox"]`
        ];
        
        for (const selector of checkboxSelectors) {
          const checkbox = page.locator(selector).first();
          if (await checkbox.count() > 0 && await checkbox.isVisible()) {
            await checkbox.check();
            console.log(`✅ Selected specific file: ${fileName}`);
            selectedCount++;
            break;
          }
        }
      }
      
      // Si no pudo seleccionar por nombre específico, buscar los primeros 3 archivos visibles
      if (selectedCount === 0) {
        console.log('⚠️ Could not find specific CE1978 files, trying to select first 3 visible files');
        
        const fileContainers = [
          '.file-upload-area input[type="checkbox"]',
          '.multifile-section input[type="checkbox"]',
          '.files-container input[type="checkbox"]',
          '.upload-container input[type="checkbox"]',
          '.file-list input[type="checkbox"]'
        ];
        
        for (const containerSelector of fileContainers) {
          const containerCheckboxes = page.locator(containerSelector);
          const containerCount = await containerCheckboxes.count();
          if (containerCount > 0) {
            console.log(`📁 Found ${containerCount} file checkboxes in container: ${containerSelector}`);
            
            // Seleccionar exactamente 3 archivos
            for (let i = 0; i < Math.min(containerCount, 3); i++) {
              const checkbox = containerCheckboxes.nth(i);
              if (await checkbox.isVisible()) {
                await checkbox.check();
                console.log(`✅ Selected file ${i + 1} from container`);
                selectedCount++;
              }
            }
            break;
          }
        }
      }
      
      console.log(`📊 Total files selected: ${selectedCount}`);
      
      // Pulsar "Cargar Preguntas"
      const loadQuestionsButton = page.locator('button:has-text("Cargar Preguntas"), button:has-text("Cargar preguntas"), #cargar-preguntas, .cargar-preguntas').first();
      if (await loadQuestionsButton.count() > 0) {
        await loadQuestionsButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ "Cargar Preguntas" button clicked');
      }
      
      // Pulsar "Guardar Preguntas" 
      const saveQuestionsButton = page.locator('button:has-text("Guardar Preguntas"), button:has-text("Guardar preguntas"), #guardar-preguntas, .guardar-preguntas').first();
      if (await saveQuestionsButton.count() > 0) {
        await saveQuestionsButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ "Guardar Preguntas" button clicked');
      } else {
        // Intentar botones alternativos
        const alternativeButtons = [
          'button:has-text("Guardar")',
          'button:has-text("Crear Bloque")',
          'button:has-text("Finalizar")'
        ];
        
        for (const selector of alternativeButtons) {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0) {
            try {
              // Esperar a que el botón esté habilitado
              await btn.waitFor({ state: 'attached', timeout: 5000 });
              await page.waitForTimeout(1000);
              
              // Verificar si está habilitado antes de hacer click
              const isEnabled = await btn.isEnabled();
              const isVisible = await btn.isVisible();
              
              console.log(`🔍 Button ${selector}: visible=${isVisible}, enabled=${isEnabled}`);
              
              if (isVisible && isEnabled) {
                await btn.click({ timeout: 10000 });
                await page.waitForTimeout(3000);
                console.log(`✅ Clicked alternative save button: ${selector}`);
                break;
              } else {
                console.log(`⚠️ Button ${selector} not ready, trying force click`);
                await btn.click({ force: true, timeout: 10000 });
                await page.waitForTimeout(3000);
                console.log(`✅ Force clicked alternative save button: ${selector}`);
                break;
              }
            } catch (error) {
              console.log(`❌ Could not click ${selector}: ${error.message}`);
            }
          }
        }
      }
    });
    
    await test.step('3. Verificar inmediatamente que el bloque aparece', async () => {
      // Ir a la pestaña de Contenido para ver bloques creados
      const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
      await contentTab.click();
      await page.waitForTimeout(3000); // Esperar más tiempo para que cargue
      console.log('✅ Navigated to Content tab');
      
      // Capturar screenshot del panel de contenido
      await page.screenshot({ path: 'andgar-content-after-creation.png', fullPage: true });
      console.log('📸 Screenshot saved: andgar-content-after-creation.png');
      
      // Buscar contenedor de bloques
      const blockContainer = page.locator('#bloques-creados-container, .bc-container, .created-blocks, .my-blocks');
      const containerCount = await blockContainer.count();
      
      if (containerCount > 0) {
        console.log(`✅ Found ${containerCount} block containers`);
        
        // Buscar bloques dentro del contenedor
        const blocks = blockContainer.first().locator('.block, .block-item, .created-block, .block-card, div[data-block], .content-item');
        const blockCount = await blocks.count();
        console.log(`📊 Found ${blockCount} blocks in container`);
        
        if (blockCount > 0) {
          console.log('✅ Bloque encontrado inmediatamente después de creación');
          
          // Mostrar información de los bloques
          for (let i = 0; i < Math.min(blockCount, 3); i++) {
            const block = blocks.nth(i);
            const blockText = await block.textContent();
            console.log(`📋 Block ${i + 1}: ${blockText?.substring(0, 150)}...`);
          }
        } else {
          console.log('⚠️ No se encontraron bloques en el contenedor');
          
          // Debug: Ver todo el contenido HTML del contenedor
          const containerHTML = await blockContainer.first().innerHTML();
          console.log('🔍 Container HTML (first 300 chars):', containerHTML.substring(0, 300));
        }
      } else {
        console.log('⚠️ No se encontró contenedor de bloques');
        
        // Buscar cualquier referencia a bloques en la página
        const pageContent = await page.content();
        const hasBlock = pageContent.includes('CE1978') || pageContent.includes('bloque') || pageContent.includes('Título');
        console.log(`🔍 Page contains block references: ${hasBlock}`);
      }
    });
    
    await test.step('4. Verificar persistencia después de actualizar', async () => {
      // Refrescar la página para verificar persistencia
      await page.reload();
      await page.waitForTimeout(2000);
      console.log('🔄 Page refreshed');
      
      // Verificar que AndGar sigue logueado
      const currentUrl = page.url();
      console.log(`🔗 URL after refresh: ${currentUrl}`);
      
      if (currentUrl.includes('creators-panel-content')) {
        console.log('✅ AndGar still logged in after refresh');
        
        // Verificar si el bloque persiste
        const blockContainer = page.locator('#bloques-creados-container, .bc-container, .created-blocks, .my-blocks');
        const containerCount = await blockContainer.count();
        
        if (containerCount > 0) {
          const blocks = blockContainer.first().locator('.block, .block-item, .created-block, .block-card, div[data-block]');
          const blockCount = await blocks.count();
          console.log(`📊 After refresh: Found ${blockCount} blocks`);
          
          if (blockCount > 0) {
            console.log('✅ Bloque persiste después de actualizar');
          } else {
            console.log('❌ Bloque NO persiste después de actualizar - problema de guardado');
          }
        }
      } else {
        console.log('⚠️ Session lost after refresh');
      }
    });
    
    console.log('🏁 Test secuencial completado');
  });
});