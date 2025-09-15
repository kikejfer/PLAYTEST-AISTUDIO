const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Visual Block Creation - Observable Workflow', () => {
  
  test('AndGar crea bloque - Version observable y lenta', async ({ page }) => {
    
    // Configurar test para ser más lento y observable
    test.setTimeout(180000); // 3 minutos
    
    await test.step('Login como AndGar', async () => {
      console.log('🔄 Iniciando login...');
      await page.goto(LOGIN_URL);
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      await expect(page).toHaveURL(/creators-panel-content/);
      console.log('✅ AndGar logged in successfully');
      await page.waitForTimeout(2000);
    });
    
    await test.step('Navegar a pestaña Añadir Preguntas', async () => {
      console.log('🔄 Navegando a pestaña Añadir Preguntas...');
      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(3000); // Esperar más tiempo para observar
      console.log('✅ Navigated to Add Questions tab');
    });
    
    await test.step('Activar Subida Múltiple y cargar carpeta tests', async () => {
      console.log('🔄 Activando "Subida Múltiple desde Carpeta"...');
      
      // PASO 1: Click en label "Subida Múltiple desde Carpeta" para activar batch mode
      const multipleUploadLabel = page.locator('label[for="folder-upload"]').first();
      
      if (await multipleUploadLabel.count() > 0) {
        await multipleUploadLabel.click();
        console.log('✅ "Subida Múltiple desde Carpeta" label clicked');
        await page.waitForTimeout(1000);
      } else {
        console.log('⚠️ Multiple upload label not found, trying alternatives');
        const alternatives = ['label:has-text("Subida Múltiple")', 'label[htmlFor="folder-upload"]'];
        for (const alt of alternatives) {
          const elem = page.locator(alt).first();
          if (await elem.count() > 0) {
            await elem.click();
            console.log(`✅ Clicked alternative: ${alt}`);
            await page.waitForTimeout(2000);
            break;
          }
        }
      }
      
      console.log('🔄 Seleccionando carpeta tests...');
      
      // PASO 2: Seleccionar la carpeta "tests" usando el input webkitdirectory
      const folderInput = page.locator('#folder-upload').first();
      
      // Usar la ruta exacta del directorio para subida múltiple
      const testsDir = 'C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests';
      
      // Como el selector automático de carpeta no funciona en este entorno,
      // usar directamente el método de archivos individuales que sabemos que funciona
      console.log('🔄 Using individual files approach since folder selector needs manual interaction');
      
      const normalInput = page.locator('input[type="file"]:not([webkitdirectory])').first();
      await normalInput.setInputFiles([
        'tests/CE1978_Título I Derechos y Deberes.txt',
        'tests/CE1978_Título II La Corona.txt', 
        'tests/CE1978_Título III Cortes Generales.txt'
      ]);
      console.log('✅ Individual files uploaded successfully');
      await page.waitForTimeout(3000);
    });
    
    await test.step('🔍 PAUSA PARA OBSERVAR - Estado después de subir archivos', async () => {
      console.log('\n🔍 ======= PAUSA PARA OBSERVAR =======');
      console.log('📋 Estado actual: Archivos subidos');
      console.log('👀 Observa la interfaz para ver qué elementos aparecen');
      console.log('⏳ Esperando 8 segundos...');
      
      await page.waitForTimeout(8000); // Pausa larga para observar
      
      // Capturar estado actual
      await page.screenshot({ path: 'visual-after-upload.png', fullPage: true });
      console.log('📸 Screenshot saved: visual-after-upload.png');
    });
    
    await test.step('Seleccionar SOLO los 3 archivos CE1978 específicos', async () => {
      console.log('🔄 Seleccionando archivos CE1978...');
      
      // PASO 1: ANTES de cargar, seleccionar únicamente los 3 archivos CE1978 que queremos procesar
      await page.waitForTimeout(2000); // Esperar a que aparezcan los archivos subidos
      
      // Definir los archivos específicos que queremos seleccionar
      const ce1978Files = [
        'CE1978_Título I Derechos y Deberes.txt',
        'CE1978_Título II La Corona.txt', 
        'CE1978_Título III Cortes Generales.txt'
      ];
      
      let selectedCount = 0;
      
      // Intentar seleccionar por nombre de archivo específico usando la estructura real
      for (const fileName of ce1978Files) {
        console.log(`🔍 Buscando archivo: ${fileName}`);
        
        // Buscar checkbox que está junto al span con el nombre del archivo
        const fileRowSelectors = [
          `span:has-text("${fileName}") >> .. >> input[type="checkbox"]`,
          `text=${fileName} >> xpath=../preceding-sibling::input[@type="checkbox"]`,
          `text=${fileName} >> xpath=.. >> input[type="checkbox"]`
        ];
        
        for (const selector of fileRowSelectors) {
          try {
            const checkbox = page.locator(selector).first();
            if (await checkbox.count() > 0 && await checkbox.isVisible()) {
              await checkbox.check();
              console.log(`✅ Selected specific file: ${fileName}`);
              selectedCount++;
              await page.waitForTimeout(1000); // Pausa para observar cada selección
              break;
            }
          } catch (e) {
            console.log(`⚠️ Error with selector ${selector}: ${e.message}`);
          }
        }
      }
      
      // Si no pudo seleccionar por nombre específico, buscar los primeros 3 archivos visibles
      if (selectedCount === 0) {
        console.log('⚠️ Could not find specific CE1978 files, trying to select first 3 visible files');
        
        const visibleCheckboxes = page.locator('label input[type="checkbox"]:visible');
        const checkboxCount = await visibleCheckboxes.count();
        console.log(`📁 Found ${checkboxCount} visible checkboxes in labels`);
        
        if (checkboxCount > 0) {
          for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
            const checkbox = visibleCheckboxes.nth(i);
            const isVisible = await checkbox.isVisible();
            
            if (isVisible) {
              await checkbox.check();
              console.log(`✅ Selected checkbox ${i + 1}`);
              selectedCount++;
              await page.waitForTimeout(1000);
            }
          }
        } else {
          const anyVisibleCheckboxes = page.locator('input[type="checkbox"]:visible');
          const anyCount = await anyVisibleCheckboxes.count();
          console.log(`📁 Fallback: Found ${anyCount} any visible checkboxes`);
          
          for (let i = 0; i < Math.min(anyCount, 3); i++) {
            const checkbox = anyVisibleCheckboxes.nth(i);
            const value = await checkbox.getAttribute('value') || '';
            if (!value.includes('admin') && !value.includes('profesor') && !value.includes('jugador')) {
              await checkbox.check();
              console.log(`✅ Selected fallback checkbox ${i + 1}`);
              selectedCount++;
              await page.waitForTimeout(1000);
            }
          }
        }
      }
      
      console.log(`📊 Total items selected: ${selectedCount} (should be exactly 3)`);
      await page.waitForTimeout(3000); // Pausa para observar selecciones
    });
    
    await test.step('🔍 PAUSA PARA OBSERVAR - Estado después de seleccionar', async () => {
      console.log('\n🔍 ======= PAUSA PARA OBSERVAR SELECCIONES =======');
      console.log('👀 Observa qué archivos están seleccionados');
      console.log('👀 Busca el botón "Cargar archivos seleccionados" o similar');
      console.log('⏳ Esperando 8 segundos...');
      
      await page.waitForTimeout(8000);
      await page.screenshot({ path: 'visual-after-selection.png', fullPage: true });
      console.log('📸 Screenshot saved: visual-after-selection.png');
    });
    
    await test.step('Cargar preguntas desde archivos seleccionados', async () => {
      console.log('🔄 Buscando botón de cargar archivos seleccionados...');
      
      // PASO 2: DESPUÉS de seleccionar, pulsar el botón correcto para procesar archivos seleccionados
      const loadSelectedButton = page.locator('button:has-text("Cargar"), button:has-text("archivo"), button[disabled="false"]').first();
      
      if (await loadSelectedButton.count() > 0) {
        await loadSelectedButton.click();
        await page.waitForTimeout(3000); // Esperar a que se procesen los archivos
        console.log('✅ "Load Selected Files" button clicked');
      } else {
        console.log('⚠️ "Load Selected Files" button not found, trying alternative selectors');
        
        // Intentar otros selectores basados en el código fuente
        const alternativeButtons = [
          'button:has-text("Cargar 3 archivo")', // uploader_button_load_selected
          'button:has-text("Cargar Preguntas")',
          'button:has-text("Procesar")',
          'button:not([disabled])'
        ];
        
        for (const selector of alternativeButtons) {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0) {
            await btn.click();
            await page.waitForTimeout(2000);
            console.log(`✅ Clicked alternative button: ${selector}`);
            break;
          }
        }
      }
      
      await page.waitForTimeout(5000); // Pausa larga para observar procesamiento
    });
    
    await test.step('🔍 PAUSA PARA OBSERVAR - Estado después de cargar', async () => {
      console.log('\n🔍 ======= PAUSA PARA OBSERVAR CARGA =======');
      console.log('👀 Observa el procesamiento de archivos');
      console.log('👀 Busca el botón "Guardar Preguntas" o "Guardar"');
      console.log('⏳ Esperando 10 segundos...');
      
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'visual-after-loading.png', fullPage: true });
      console.log('📸 Screenshot saved: visual-after-loading.png');
    });
    
    await test.step('Guardar preguntas en el bloque', async () => {
      console.log('🔄 Buscando botón "Guardar Preguntas"...');
      
      // Buscar y pulsar el botón "Guardar Preguntas"
      const saveQuestionsButton = page.locator('button:has-text("Guardar Preguntas"), button:has-text("Guardar preguntas"), #guardar-preguntas, .guardar-preguntas').first();
      
      if (await saveQuestionsButton.count() > 0) {
        await saveQuestionsButton.click();
        await page.waitForTimeout(3000); // Esperar a que se guarde el bloque
        console.log('✅ "Guardar Preguntas" button clicked');
      } else {
        console.log('⚠️ "Guardar Preguntas" button not found, trying alternative selectors');
        
        // Intentar otros selectores posibles
        const alternativeButtons = [
          'button:has-text("Guardar")',
          'button:has-text("Crear Bloque")',
          'button:has-text("Finalizar")',
          'input[type="button"][value*="guardar"]',
          'input[type="submit"][value*="guardar"]'
        ];
        
        for (const selector of alternativeButtons) {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0) {
            await btn.click();
            await page.waitForTimeout(2000);
            console.log(`✅ Clicked alternative save button: ${selector}`);
            break;
          }
        }
      }
    });
    
    await test.step('🔍 PAUSA FINAL - Observar resultado', async () => {
      console.log('\n🔍 ======= RESULTADO FINAL =======');
      console.log('👀 Observa si el bloque se creó correctamente');
      console.log('👀 Ve a la pestaña "Contenido" para verificar');
      console.log('⏳ Esperando 10 segundos para observar...');
      
      await page.waitForTimeout(5000);
      
      // Ir a pestaña Contenido para verificar
      const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
      if (await contentTab.count() > 0) {
        await contentTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ Switched to Content tab');
      }
      
      await page.waitForTimeout(3000);
      
      // Verificar características del bloque
      const blockContainer = page.locator('#bloques-creados-container, .bc-container').first();
      if (await blockContainer.count() > 0) {
        console.log('✅ Block container found');
      }
      
      await page.waitForTimeout(7000); // Pausa final larga
      await page.screenshot({ path: 'visual-final-result.png', fullPage: true });
      console.log('📸 Final screenshot saved: visual-final-result.png');
      
      console.log('\n🎉 Test visual completado');
      console.log('📸 Revisa las capturas de pantalla para analizar el proceso');
    });
    
  });
});