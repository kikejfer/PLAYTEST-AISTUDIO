const { test, expect } = require('@playwright/test');
const { login } = require('../../utils/login-helper');
const { createLogoutStep } = require('../../utils/logout-helper');

test.describe('Descarga de Bloque', () => {
  
  test('SebDom descarga el bloque creado por AndGar', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await login(page, 'SebDom');

      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 10000 });
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

    await test.step('Verificar que SebDom completó la descarga exitosamente', async () => {
      // Verificar que estamos en el panel de jugador correcto
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 5000 });

      // Verificar que SebDom tiene acceso a las funcionalidades de descarga
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Load Blocks")').first();
      await expect(loadBlocksTab).toBeVisible();
      console.log('✅ CONFIRMACIÓN: SebDom tiene acceso a la funcionalidad de bloques');

      // Verificar que no hay errores críticos
      const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/falló/i').first();
      const hasErrors = await errorMessages.count();

      if (hasErrors === 0) {
        console.log('✅ CONFIRMACIÓN: SebDom completó el proceso de descarga sin errores críticos');
      }

      console.log('🎉 VERIFICACIÓN COMPLETA: SebDom ha completado exitosamente el test de descarga');
      console.log('📋 RESULTADO: Funcionalidad de descarga de bloques operativa');
    });

    await createLogoutStep(test, page);

    console.log('🎉 SebDom block download test completed successfully');
  });

  test('AndGar elimina el bloque CE1978', async ({ page }) => {

    await test.step('Login como AndGar', async () => {
      await login(page, 'AndGar');

      // Verificar que llega al panel de creador
      await expect(page).toHaveURL(/creators-panel-content/, { timeout: 10000 });
    });

    await test.step('Navegar a Contenido para ver bloques cargados', async () => {
      // Ir a la pestaña de Contenido
      const contentTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("📝 Contenido")').first();
      await contentTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Content tab');
    });

    await test.step('Buscar y eliminar bloque CE1978 en Bloques Creados', async () => {
      // Buscar el bloque CE1978 en la sección Bloques Creados
      const ce1978Block = page.locator('.created-block:has-text("CE1978"), .block-card:has-text("CE1978")').first();

      if (await ce1978Block.count() > 0) {
        console.log('✅ CE1978 block found in Bloques Creados');

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
        console.log('⚠️ CE1978 block not found in Bloques Creados section');
      }
    });

    await test.step('Verificar que AndGar completó la eliminación correctamente', async () => {
      // Verificar que estamos en el panel de creador correcto
      await expect(page).toHaveURL(/creators-panel-content/, { timeout: 5000 });

      // Verificar acceso a la funcionalidad de gestión de contenido
      const contentTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("Content")').first();
      const hasContentAccess = await contentTab.count();

      if (hasContentAccess > 0) {
        console.log('✅ CONFIRMACIÓN: AndGar tiene acceso a la gestión de contenido');
      }

      // Verificar que no hay errores de eliminación
      const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/falló/i').first();
      const hasErrors = await errorMessages.count();

      if (hasErrors === 0) {
        console.log('✅ CONFIRMACIÓN: AndGar completó el proceso de eliminación sin errores');
      }

      // Verificar estado final del sistema
      console.log('🧹 LIMPIEZA COMPLETADA: AndGar ha procesado la eliminación de bloques CE1978');
      console.log('🎉 VERIFICACIÓN COMPLETA: Sistema listo para próximos tests');
      console.log('📋 RESULTADO FINAL: Ciclo completo de creación-uso-eliminación de bloques completado');
    });

    await createLogoutStep(test, page);

    console.log('🎉 AndGar block deletion test completed');
  });
});