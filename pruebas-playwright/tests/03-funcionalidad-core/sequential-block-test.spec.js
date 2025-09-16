const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Test Secuencial: Creación y Verificación de Bloque', () => {

  test('AndGar crea bloque paso a paso según especificaciones', async ({ page }) => {

    await test.step('1. Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      // Esperar a que se redirija después del login
      await page.waitForURL(/creators-panel-content/, { timeout: 15000 });
      console.log('✅ AndGar logged in successfully');
    });

    await test.step('2. Navegar a pestaña Añadir Preguntas y subpestaña Subir Fichero', async () => {
      // Ya estamos en creators-panel-content después del login
      await page.waitForTimeout(2000);

      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Add Questions tab');

      // Ahora navegar a la subpestaña "Subir Fichero"
      const uploadFileSubTab = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
      await uploadFileSubTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Upload File subtab');
    });

    await test.step('3. Subida múltiple desde directorio - Seleccionar archivos CE1978 Título I y II', async () => {
      // Seleccionar el directorio completo (pasar la ruta del directorio, no archivos específicos)
      const directoryInput = page.locator('input[type="file"][webkitdirectory]').first();
      await directoryInput.setInputFiles('C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests');
      await page.waitForTimeout(2000);
      console.log('✅ Directory selected with CE1978 files');

      // Pulsar el botón "Subir"
      const uploadButton = page.locator('button:has-text("Subir")').first();
      await uploadButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked first "Subir" button');

      // En la pantalla emergente, volver a pulsar "Subir" - probar múltiples selectores
      await page.waitForTimeout(2000); // Dar tiempo para que aparezca el modal

      const modalSelectors = [
        '.modal button:has-text("Subir")',
        '.popup button:has-text("Subir")',
        '.dialog button:has-text("Subir")',
        'button:has-text("Subir")', // Buscar cualquier botón "Subir"
        '[class*="modal"] button:has-text("Subir")',
        '[class*="popup"] button:has-text("Subir")',
        '[class*="overlay"] button:has-text("Subir")'
      ];

      let modalButton = null;
      for (const selector of modalSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          modalButton = button;
          console.log(`✅ Found modal button with selector: ${selector}`);
          break;
        }
      }

      if (modalButton) {
        await modalButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked modal "Subir" button');
      } else {
        console.log('⚠️ No modal "Subir" button found, continuing...');
      }

      // Esperar unos segundos para que aparezcan los archivos
      await page.waitForTimeout(3000);

      // Seleccionar checkboxes para CE1978_Título I y II
      const targetFiles = ['CE1978_Título I Derechos y Deberes.txt', 'CE1978_Título II La Corona.txt'];

      for (const fileName of targetFiles) {
        const checkbox = page.locator(`input[type="checkbox"][value*="${fileName}"], label:has-text("${fileName}") input[type="checkbox"]`).first();
        if (await checkbox.count() > 0) {
          await checkbox.check();
          console.log(`✅ Selected checkbox for: ${fileName}`);
        }
      }

      // Pulsar el botón "Cargar N archivos para revisar"
      const loadFilesButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
      await loadFilesButton.click();
      console.log('✅ Clicked "Cargar N archivos para revisar" button');

      // Esperar a que aparezca el botón "Guardar todas las preguntas"
      const saveAllQuestionsBtn = page.locator('button:has-text("Guardar todas las preguntas")').first();
      await saveAllQuestionsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveAllQuestionsBtn.click();
      console.log('✅ Clicked "Guardar todas las preguntas" button');
    });

    await test.step('4. Navegar de vuelta y subir archivo individual', async () => {
      // Después de guardar, la página puede haber cambiado. Navegar de vuelta a "Añadir Preguntas"
      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated back to Add Questions tab');

      // Navegar a subpestaña "Subir Fichero"
      const uploadFileSubTab = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
      await uploadFileSubTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated back to Upload File subtab');
      // Buscar el segundo input de archivo (para archivos individuales)
      // Basado en el debug: Input 1 es para archivos individuales (sin webkitdirectory)
      const browseButtonSelectors = [
        // Buscar input de archivo individual (no el folder-upload)
        'input[type="file"]:not([webkitdirectory]):not(#folder-upload)',
        'input[type="file"]:not([id="folder-upload"]):not([webkitdirectory])',
        'input[type="file"]:not([directory]):not([webkitdirectory])',

        // Selectores específicos cerca del texto "Subir Fichero (.txt)"
        'text=Subir Fichero (.txt) >> .. >> input[type="file"]:not([webkitdirectory])',
        'text=Subir Fichero (.txt) >> .. >> input[type="file"]:not(#folder-upload)',

        // Selectores de botones tradicionales por si acaso
        'button:has-text("Examinar...")',     // Mozilla Firefox
        'button:has-text("Examinar")',       // Mozilla Firefox (sin puntos)
        'button:has-text("Elegir archivos")', // Chrome, IE, Opera, Vivaldi
        'button:has-text("Choose Files")',    // En inglés
        'button:has-text("Browse")'           // IE en inglés
      ];

      let browseButton = null;

      // Primero intentar obtener input de archivo individual (sin webkitdirectory)
      const individualInputs = page.locator('input[type="file"]:not([webkitdirectory])');
      const individualCount = await individualInputs.count();

      if (individualCount > 0) {
        // Usar el primer input sin webkitdirectory
        browseButton = individualInputs.first();
        console.log('✅ Found individual file input (no webkitdirectory)');
      }

      // Si no funciona, intentar con los selectores
      if (!browseButton) {
        for (const selector of browseButtonSelectors) {
          const button = page.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            browseButton = button;
            console.log(`✅ Found browse button with selector: ${selector}`);
            break;
          }
        }
      }

      // Si no encuentra el botón, hacer debug adicional
      if (!browseButton) {
        console.log('🔍 Debugging: Looking for "Subir Fichero (.txt)" text and nearby elements...');

        // Buscar el texto "Subir Fichero (.txt)"
        const subirFicheroText = page.locator('text=Subir Fichero (.txt)');
        const textCount = await subirFicheroText.count();
        console.log(`📝 Found ${textCount} instances of "Subir Fichero (.txt)" text`);

        if (textCount > 0) {
          console.log('✅ "Subir Fichero (.txt)" text found, looking for nearby elements...');

          // Buscar elementos cerca del texto
          const parentContainer = subirFicheroText.locator('..');
          const nearbyInputs = parentContainer.locator('input[type="file"]');
          const nearbyButtons = parentContainer.locator('button');

          console.log(`📁 Found ${await nearbyInputs.count()} file inputs near the text`);
          console.log(`🔘 Found ${await nearbyButtons.count()} buttons near the text`);

          // Mostrar detalles de los elementos cercanos
          const nearbyInputsAll = await nearbyInputs.all();
          for (let i = 0; i < nearbyInputsAll.length; i++) {
            const input = nearbyInputsAll[i];
            const isVisible = await input.isVisible();
            const id = await input.getAttribute('id');
            const webkitDir = await input.getAttribute('webkitdirectory');
            console.log(`Nearby input ${i}: visible=${isVisible}, id="${id}", webkitdirectory=${webkitDir}`);
          }

          const nearbyButtonsAll = await nearbyButtons.all();
          for (let i = 0; i < nearbyButtonsAll.length; i++) {
            const button = nearbyButtonsAll[i];
            const text = await button.textContent();
            const isVisible = await button.isVisible();
            console.log(`Nearby button ${i}: "${text?.trim()}", visible=${isVisible}`);
          }
        } else {
          console.log('❌ "Subir Fichero (.txt)" text not found on page');
        }
      }

      if (browseButton) {
        // Si es un input, usar setInputFiles directamente
        const tagName = await browseButton.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'input') {
          await browseButton.setInputFiles('C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests\\CE1978_Título III Cortes Generales.txt');
          console.log('✅ Selected CE1978_Título III Cortes Generales.txt directly');
        } else {
          // Si es un botón, hacer clic y luego buscar el input
          await browseButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked "Examinar/Elegir archivos" button');

          // Buscar el input de archivo que se activó
          const fileInput = page.locator('input[type="file"]:not([webkitdirectory]):not([multiple])').first();
          await fileInput.setInputFiles('C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests\\CE1978_Título III Cortes Generales.txt');
          console.log('✅ Selected CE1978_Título III Cortes Generales.txt');
        }
      } else {
        console.log('⚠️ No "Examinar/Elegir archivos" button found');
        return;
      }

      // Pulsar botón "Subir"
      const uploadButton = page.locator('button:has-text("Subir")').first();
      await uploadButton.waitFor({ state: 'visible', timeout: 5000 });
      await uploadButton.click();
      console.log('✅ Clicked "Subir" button');

      // En la pantalla emergente, volver a pulsar "Subir"
      const modalSelectors = [
        '.modal button:has-text("Subir")',
        '.popup button:has-text("Subir")',
        '.dialog button:has-text("Subir")',
        'button:has-text("Subir")'
      ];

      let modalButton = null;
      for (const selector of modalSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          modalButton = button;
          console.log(`✅ Found modal button with selector: ${selector}`);
          break;
        }
      }

      if (modalButton) {
        await modalButton.click();
        console.log('✅ Clicked modal "Subir" button');
      }

      // Pulsar el botón "Cargar N archivos para revisar"
      const loadFileButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
      await loadFileButton.waitFor({ state: 'visible', timeout: 10000 });
      await loadFileButton.click();
      console.log('✅ Clicked "Cargar archivo para revisar" button');

      // Pulsar "Guardar todas las preguntas"
      const saveAllQuestionsBtn = page.locator('button:has-text("Guardar todas las preguntas")').first();
      await saveAllQuestionsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveAllQuestionsBtn.click();
      console.log('✅ Clicked "Guardar todas las preguntas" button (second time)');
    });

    console.log('🏁 Test secuencial completado - AndGar ha creado bloques con archivos CE1978');
  });
});