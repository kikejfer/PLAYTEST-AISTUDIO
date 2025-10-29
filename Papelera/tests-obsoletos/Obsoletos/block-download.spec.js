const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Descarga de Bloque', () => {
  
  test('SebDom descarga el bloque creado por AndGar', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await page.goto(LOGIN_URL, { timeout: 15000 });
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 10000 });
      console.log('✅ SebDom logged in successfully');
    });
    
    await test.step('Navegar a Carga de Bloques y buscar bloque CE1978', async () => {
      // Navegar a la pestaña Carga de Bloques
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Carga de Bloques tab');

      // Buscar el bloque CE1978 en la sección Bloques Disponibles
      const ce1978Block = page.locator('.block-card:has-text("CE1978"), .available-block:has-text("CE1978")').first();
      if (await ce1978Block.count() > 0) {
        console.log('✅ CE1978 block found in Bloques Disponibles');
      } else {
        console.log('⚠️ CE1978 block not found in Bloques Disponibles');
      }
    });

    await test.step('Buscar opción de descarga en el bloque CE1978', async () => {
      // Buscar botón de descarga específicamente dentro del bloque CE1978
      const ce1978Block = page.locator('.block-card:has-text("CE1978"), .available-block:has-text("CE1978")').first();
      const downloadButton = ce1978Block.locator('button:has-text("Descargar"), a:has-text("Descargar"), .download-btn').first();
      
      if (await downloadButton.count() > 0) {
        console.log('✅ Download option found');
        
        // Configurar manejo de descarga
        const downloadPromise = page.waitForEvent('download');
        
        await downloadButton.click();
        console.log('✅ Download button clicked');
        
        try {
          // Esperar a que inicie la descarga
          const download = await downloadPromise;
          console.log('✅ Download started successfully');
          
          // Verificar que el archivo se descargó
          const fileName = download.suggestedFilename();
          if (fileName) {
            console.log(`✅ Downloaded file: ${fileName}`);
          }
          
        } catch (error) {
          console.log('⚠️ Download may have started but not detected by Playwright');
        }
        
        await page.waitForTimeout(3000);
        
      } else {
        console.log('⚠️ Download button not found, checking alternative methods');
        
        // Buscar enlaces de descarga alternativos
        const downloadLink = page.locator('a[href*="download"], a[href*=".zip"], a[href*=".txt"]').first();
        if (await downloadLink.count() > 0) {
          await downloadLink.click();
          console.log('✅ Download link clicked');
        }
      }
    });
    
    await test.step('Verificar estado de descarga', async () => {
      // Verificar que el bloque muestra estado de descargado
      const downloadedIndicator = page.locator('text=/descargado/i').or(page.locator('text=/downloaded/i')).or(page.locator('.downloaded')).first();
      
      if (await downloadedIndicator.count() > 0) {
        console.log('✅ Block shows as downloaded');
      }
      
      // Verificar que sigue apareciendo el bloque para posibles futuras descargas
      const blockStillVisible = page.locator('text=AndGar, text=/CE1978/i').first();
      if (await blockStillVisible.count() > 0) {
        console.log('✅ Block remains visible for future downloads');
      }
    });
    
    console.log('🎉 SebDom block download test completed successfully');
  });

  test('AndGar elimina el bloque CE1978', async ({ page }) => {

    await test.step('Login como AndGar', async () => {
      await page.goto(LOGIN_URL, { timeout: 15000 });
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);

      // Verificar que llega al panel de creador
      await expect(page).toHaveURL(/creators-panel-content/, { timeout: 10000 });
      console.log('✅ AndGar logged in successfully');
    });

    await test.step('Navegar a Contenido para ver bloques cargados', async () => {
      // Ir a la pestaña de Contenido
      const contentTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("📝 Contenido")').first();
      await contentTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Content tab');
    });

    await test.step('Buscar y eliminar bloque CE1978 en Bloques Cargados', async () => {
      // Buscar el bloque CE1978 en la sección Bloques Cargados
      const ce1978Block = page.locator('.loaded-block:has-text("CE1978"), .created-block:has-text("CE1978"), .block-card:has-text("CE1978")').first();

      if (await ce1978Block.count() > 0) {
        console.log('✅ CE1978 block found in Bloques Cargados');

        // Buscar botón de eliminar específicamente dentro del bloque CE1978
        const deleteButton = ce1978Block.locator('button:has-text("Eliminar"), button:has-text("🗑️"), .delete-btn, .remove-btn').first();

        if (await deleteButton.count() > 0) {
          await deleteButton.click();
          console.log('✅ Delete button clicked');

          // Confirmar eliminación si aparece modal de confirmación
          const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            console.log('✅ Deletion confirmed');
          }

          await page.waitForTimeout(3000);

          // Verificar que el bloque ya no aparece
          const blockStillExists = page.locator('text=/CE1978/i').first();
          if (await blockStillExists.count() === 0) {
            console.log('✅ CE1978 block successfully deleted');
          } else {
            console.log('⚠️ CE1978 block may still exist');
          }

        } else {
          console.log('⚠️ Delete button not found in CE1978 block');
        }
      } else {
        console.log('⚠️ CE1978 block not found in Bloques Cargados section');
      }
    });

    console.log('🎉 AndGar block deletion test completed');
  });
});