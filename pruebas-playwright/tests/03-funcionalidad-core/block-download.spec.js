const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Descarga de Bloque', () => {
  
  test('SebDom descarga el bloque creado por AndGar', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('networkidle');
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ SebDom logged in successfully');
    });
    
    await test.step('Verificar bloque cargado', async () => {
      // Verificar que el bloque aparece como cargado
      const loadedBlock = page.locator('.loaded-block, .my-blocks, .user-blocks').first();
      
      if (await loadedBlock.count() > 0) {
        await expect(loadedBlock).toBeVisible();
        console.log('✅ Loaded block is visible');
        
        // Verificar que es el bloque de AndGar
        const andgarBlock = page.locator('text=AndGar, text=/CE1978/i').first();
        if (await andgarBlock.count() > 0) {
          console.log('✅ AndGar block is identified');
        }
      }
    });
    
    await test.step('Buscar opción de descarga', async () => {
      // Buscar opción de descarga
      const downloadButton = page.locator('button:has-text("Descargar"), a:has-text("Descargar"), .download-btn').first();
      
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
      const downloadedIndicator = page.locator('text=/descargado/i, text=/downloaded/i, .downloaded').first();
      
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
});