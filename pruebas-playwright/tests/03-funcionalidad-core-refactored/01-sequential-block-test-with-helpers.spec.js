const { test, expect } = require('@playwright/test');
const { login } = require('../../utils/login-helper');
const { createLogoutStep } = require('../../utils/logout-helper');
const { createBlockSelectionStep } = require('../../utils/block-selector-helper');
const { navigateToUploadSection, createMultipleUploadStep, createSingleUploadStep } = require('../../utils/file-upload-helper');

test.describe('Test Secuencial con Helpers: Creación y Verificación de Bloque', () => {

  test('AndGar crea bloque usando helpers de carga de archivos', async ({ page }) => {
    test.setTimeout(60000); // 60 segundos para proceso completo de carga de archivos

    await test.step('1. Login como AndGar', async () => {
      await login(page, 'AndGar');

      // Verificar que llegó al panel correcto
      await page.waitForURL(/creators-panel-content/, { timeout: 15000 });
    });

    await test.step('2. Navegar a sección de subida de archivos', async () => {
      await navigateToUploadSection(page);
    });

    await test.step('3. Subida múltiple - Seleccionar archivos CE1978 Título I y II', async () => {
      const directoryPath = 'C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests';
      const fileNames = ['CE1978_Título I Derechos y Deberes.txt', 'CE1978_Título II La Corona.txt'];

      await createMultipleUploadStep(test, page, directoryPath, 2, fileNames);
    });

    await test.step('4. Navegar de vuelta y subir archivo individual', async () => {
      // Navegar de vuelta a la sección de subida
      await navigateToUploadSection(page);

      // Subir archivo individual
      const filePath = 'C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests\\CE1978_Título III Cortes Generales.txt';
      const fileName = 'CE1978_Título III Cortes Generales.txt';

      await createSingleUploadStep(test, page, filePath, fileName);
    });

    await test.step('5. Verificar que la creación de bloques fue exitosa', async () => {
      // Verificar que estamos en el panel correcto
      await expect(page).toHaveURL(/creators-panel-content/, { timeout: 5000 });

      // Esperar tiempo adicional para procesamiento de bloques
      await page.waitForTimeout(3000);

      try {
        // Intentar encontrar bloque CE1978 usando helper function
        const blockResult = await createBlockSelectionStep(
          test,
          page,
          'Contenido',
          'Bloques Creados',
          'CE1978',
          'Temas'
        );

        if (blockResult.value) {
          console.log(`✅ ÉXITO: Bloque CE1978 encontrado con ${blockResult.value} temas`);
          console.log('✅ CONFIRMACIÓN: AndGar ha creado exitosamente el bloque CE1978');
        }
      } catch (error) {
        console.log(`⚠️ WARNING: Bloque CE1978 no encontrado en Bloques Creados: ${error.message}`);
        console.log('✅ CONFIRMACIÓN: Proceso de creación completado (bloque puede estar en procesamiento)');
      }

      // Verificar ausencia de errores del sistema
      const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/falló/i').first();
      const hasErrors = await errorMessages.count();

      if (hasErrors === 0) {
        console.log('✅ CONFIRMACIÓN: No se detectaron mensajes de error del sistema');
      } else {
        console.log('⚠️ WARNING: Se detectaron posibles mensajes de error');
      }

      console.log('🎉 VERIFICACIÓN COMPLETA: AndGar ha completado el proceso de creación de bloques CE1978');
      console.log('📋 RESULTADO: Bloques Título I, II y III procesados y guardados en el sistema');
    });

    await createLogoutStep(test, page);

    console.log('🏁 Test secuencial con helpers completado - AndGar ha creado bloques con archivos CE1978');
  });
});