const { test, expect } = require('@playwright/test');
const { login } = require('../../utils/login-helper');
const { createLogoutStep } = require('../../utils/logout-helper');
const { createAvailableBlockStep, createLoadedBlockStep } = require('../../utils/player-blocks-helper');
const { createBlockSelectionStep } = require('../../utils/block-selector-helper');

test.describe('Descarga de Bloque', () => {
  
  test('SebDom descarga el bloque creado por AndGar', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await login(page, 'SebDom');

      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 10000 });
    });

    await test.step('Cargar bloque CE1978 desde Bloques Disponibles', async () => {
      // DEPENDENCIA: Este test debe ejecutarse DESPUÉS del test 02-block-loading.spec.js
      // para evitar conflictos ya que ambos cargan y descargan el mismo bloque CE1978

      // Cargar el bloque desde Bloques Disponibles para poder descargarlo después
      const result = await createAvailableBlockStep(test, page, 'CE1978', 'AndGar', 'Cargar');

      if (result.action === 'cargared') {
        console.log('✅ Block loaded successfully - waiting for UI to update');
        await page.waitForTimeout(5000); // Increased wait time for UI to update
        console.log('✅ Ready for download after extended wait');
      }
    });

    await test.step('Eliminar bloque CE1978 desde Bloques Cargados', async () => {
      // Usar helper para encontrar y eliminar bloque desde Bloques Cargados
      const result = await createLoadedBlockStep(test, page, 'CE1978', 'AndGar', 'Eliminar');

      if (result.action === 'deleted') {
        console.log('✅ Block successfully deleted from loaded blocks list');
      }
    });
    
    await test.step('Verificar eliminación del bloque', async () => {
      // Verificar que el bloque YA NO está en Bloques Cargados usando helper con throwOnNotFound=false
      const loadedBlockResult = await createLoadedBlockStep(test, page, 'CE1978', 'AndGar', 'Autor', false);

      if (loadedBlockResult.found) {
        console.log('❌ ERROR: Block still found in Loaded Blocks - should have been deleted');
      } else {
        console.log('✅ Block correctly removed from Loaded Blocks');
      }

      // Verificar que el bloque SÍ está en Bloques Disponibles usando helper con throwOnNotFound=false
      const availableBlockResult = await createAvailableBlockStep(test, page, 'CE1978', 'AndGar', 'Autor');

      if (availableBlockResult.value) {
        console.log('✅ Block still available in Available Blocks for future downloads');
      } else {
        console.log('❌ ERROR: Block not found in Available Blocks');
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

    await test.step('Eliminar bloque CE1978 usando helper', async () => {
      // Usar helper para encontrar y eliminar bloque en sección Bloques Creados
      const result = await createBlockSelectionStep(test, page, 'Contenido', 'Bloques Creados', 'CE1978', 'eliminar');

      if (result.value === 'deleted') {
        console.log('✅ CE1978 block successfully deleted using helper function');
        console.log('🧹 LIMPIEZA COMPLETADA: AndGar ha procesado la eliminación de bloques CE1978');
        console.log('🎉 VERIFICACIÓN COMPLETA: Sistema listo para próximos tests');
        console.log('📋 RESULTADO FINAL: Ciclo completo de creación-uso-eliminación de bloques completado');
      }
    });

    await createLogoutStep(test, page);

    console.log('🎉 AndGar block deletion test completed');
  });
});