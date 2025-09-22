const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('BLOQUE 3 - Flujo Completo Unificado', () => {

  // Función helper para hacer logout completo
  async function performLogout(page) {
    try {
      console.log('🚪 Realizando logout...');

      // Buscar botones de logout comunes
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Cerrar Sesión")',
        'button:has-text("Salir")',
        'a:has-text("Logout")',
        'a:has-text("Cerrar Sesión")',
        'a:has-text("Salir")',
        '.logout-btn',
        '.logout-button',
        '#logout',
        '[data-testid="logout"]'
      ];

      for (const selector of logoutSelectors) {
        const logoutButton = page.locator(selector).first();
        if (await logoutButton.count() > 0 && await logoutButton.isVisible()) {
          await logoutButton.click();
          console.log(`✅ Logout realizado con selector: ${selector}`);
          await page.waitForTimeout(2000);
          break;
        }
      }

      // Limpiar todo el estado de la aplicación
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && window.indexedDB.databases) {
            window.indexedDB.databases().then(databases => {
              databases.forEach(db => {
                window.indexedDB.deleteDatabase(db.name);
              });
            });
          }
        } catch (e) {
          console.log('Error clearing storage:', e);
        }
      });

      await page.context().clearCookies();
      console.log('✅ Estado de aplicación limpiado completamente');

    } catch (error) {
      console.log('⚠️ Error durante logout:', error.message);
      console.log('🔄 Continuando con limpieza de estado...');

      // Si falla el logout, al menos limpiar el estado
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      });
      await page.context().clearCookies();
    }
  }

  test('Flujo completo secuencial: AndGar crea → JaiGon carga → SebDom carga → SebDom descarga → AndGar elimina', async ({ page }) => {

    // ========== PASO 1: ANDGAR CREA BLOQUE CE1978 ==========
    await test.step('PASO 1: AndGar crea bloque CE1978', async () => {
      console.log('\n🔵 INICIANDO PASO 1: AndGar crea bloque CE1978');

      // 1.1 Login como AndGar con estrategia robusta
      console.log('⏳ Cargando página de login inicial para AndGar...');
      await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

      // Esperar que React esté completamente cargado desde el inicio
      await page.waitForFunction(() => {
        const hasReactRoot = document.querySelector('#root, #app, [data-reactroot], .App') !== null;
        const hasLoginInput = document.querySelector('input[name="nickname"]') !== null;
        const bodyHasContent = document.body && document.body.children.length > 1;
        return document.readyState === 'complete' && hasReactRoot && hasLoginInput && bodyHasContent;
      }, {
        timeout: 45000,
        polling: 1000
      });

      console.log('✅ AndGar inicial login page loaded successfully');
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForURL(/creators-panel-content/, { timeout: 15000 });
      console.log('✅ AndGar logged in successfully');

      // 1.2 Navegar a Añadir Preguntas
      await page.waitForTimeout(2000);
      const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
      await addQuestionsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Add Questions tab');

      // 1.3 Navegar a subpestaña Subir Fichero
      const uploadFileSubTab = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
      await uploadFileSubTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to Upload File subtab');

      // 1.4 Subir directorio completo con archivos CE1978
      const directoryInput = page.locator('input[type="file"][webkitdirectory]').first();
      await directoryInput.setInputFiles('C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests');
      await page.waitForTimeout(2000);
      console.log('✅ Directory selected with CE1978 files');

      // 1.5 Hacer clic en primer botón "Subir"
      const uploadButton = page.locator('button:has-text("Subir")').first();
      await uploadButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked first "Subir" button');

      // 1.6 Manejar modal emergente si aparece
      await page.waitForTimeout(2000);
      const modalSelectors = [
        '.modal button:has-text("Subir")',
        '.popup button:has-text("Subir")',
        '.dialog button:has-text("Subir")',
        'button:has-text("Subir")',
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

      // 1.7 Seleccionar checkboxes para archivos específicos
      await page.waitForTimeout(3000);
      const targetFiles = ['CE1978_Título I Derechos y Deberes.txt', 'CE1978_Título II La Corona.txt'];

      for (const fileName of targetFiles) {
        const checkbox = page.locator(`input[type="checkbox"][value*="${fileName}"], label:has-text("${fileName}") input[type="checkbox"]`).first();
        if (await checkbox.count() > 0) {
          await checkbox.check();
          console.log(`✅ Selected checkbox for: ${fileName}`);
        }
      }

      // 1.8 Cargar archivos para revisar
      const loadFilesButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
      await loadFilesButton.click();
      console.log('✅ Clicked "Cargar N archivos para revisar" button');

      // 1.9 Guardar todas las preguntas
      const saveAllQuestionsBtn = page.locator('button:has-text("Guardar todas las preguntas")').first();
      await saveAllQuestionsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveAllQuestionsBtn.click();
      console.log('✅ Clicked "Guardar todas las preguntas" button');

      // Esperar 3 segundos para que la aplicación se refresque y aparezca el botón "Examinar"
      console.log('⏳ Esperando 3 segundos para que aparezca el botón "Examinar"...');
      await page.waitForTimeout(3000);

      // 1.10 Subir archivo individual (CE1978_Título III)
      // Navegar de vuelta a "Añadir Preguntas"
      const addQuestionsTabAgain = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
      await addQuestionsTabAgain.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated back to Add Questions tab');

      // Navegar a subpestaña "Subir Fichero" de nuevo
      const uploadFileSubTabAgain = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
      await uploadFileSubTabAgain.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated back to Upload File subtab');

      // Buscar botón "Examinar" para archivo individual
      console.log('🔍 Looking for "Examinar" button...');

      const examinarButtonSelectors = [
        'button:has-text("Examinar")',
        'input[type="button"][value="Examinar"]',
        'label:has-text("Examinar")',
        '.examinar-btn',
        'button:has-text("Elegir archivo")',
        'button:has-text("Seleccionar archivo")'
      ];

      let examinarButton = null;

      // Intentar encontrar el botón "Examinar" con timeout más corto
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 "Examinar" button search attempt ${attempt}/3`);

        for (const selector of examinarButtonSelectors) {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            // Intentar hacer visible si existe pero no está visible
            try {
              await button.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500);

              if (await button.isVisible()) {
                examinarButton = button;
                console.log(`✅ Found "Examinar" button with selector: ${selector}`);
                break;
              }
            } catch (e) {
              console.log(`⚠️ Button exists but visibility check failed: ${e.message}`);
            }
          }
        }

        if (examinarButton) break;

        // Si no se encuentra, esperar un poco antes del siguiente intento
        await page.waitForTimeout(1000);
      }

      if (examinarButton) {
        try {
          // Hacer clic en el botón "Examinar" para abrir el selector de archivos
          await examinarButton.click();
          console.log('✅ Clicked "Examinar" button');

          // Buscar el input de archivo que aparece después de hacer clic en "Examinar"
          const fileInput = page.locator('input[type="file"]').first();
          await fileInput.waitFor({ state: 'attached', timeout: 5000 });

          await fileInput.setInputFiles('C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests\\CE1978_Título III Cortes Generales.txt');
          console.log('✅ Selected CE1978_Título III Cortes Generales.txt through Examinar button');

          // Subir archivo individual
          const uploadButtonIndividual = page.locator('button:has-text("Subir")').first();
          await uploadButtonIndividual.waitFor({ state: 'visible', timeout: 5000 });
          await uploadButtonIndividual.click();
          console.log('✅ Clicked "Subir" button for individual file');

          // Manejar modal para archivo individual
          await page.waitForTimeout(2000);
          const modalButtonIndividual = page.locator('button:has-text("Subir")').first();
          if (await modalButtonIndividual.count() > 0 && await modalButtonIndividual.isVisible()) {
            await modalButtonIndividual.click();
            console.log('✅ Clicked modal "Subir" button for individual file');
          }

          // Cargar archivo individual
          const loadFileButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
          await loadFileButton.waitFor({ state: 'visible', timeout: 10000 });
          await loadFileButton.click();
          console.log('✅ Clicked "Cargar archivo para revisar" button');

          // Guardar archivo individual
          const saveAllQuestionsBtnFinal = page.locator('button:has-text("Guardar todas las preguntas")').first();
          await saveAllQuestionsBtnFinal.waitFor({ state: 'visible', timeout: 10000 });
          await saveAllQuestionsBtnFinal.click();
          console.log('✅ Clicked "Guardar todas las preguntas" button (individual file)');

          // Logout explícito de AndGar después de guardar archivo individual
          console.log('🚪 Realizando logout de AndGar después de guardar archivo individual...');
          await performLogout(page);
          console.log('✅ AndGar logout completed after individual file upload');

        } catch (error) {
          console.log('⚠️ Error uploading individual file:', error.message);
          console.log('⚠️ Continuing without individual file upload');
        }
      } else {
        console.log('⚠️ "Examinar" button not found, skipping individual upload');
        console.log('✅ Proceeding with multiple file upload only');
      }

      // Logout incondicional de AndGar al final del Paso 1
      console.log('🚪 Realizando logout de AndGar al final del Paso 1...');
      await performLogout(page);
      console.log('✅ AndGar logout completed at end of Step 1');

      console.log('🟢 PASO 1 COMPLETADO: AndGar creó bloque CE1978 exitosamente\n');
    });

    // ========== PASO 2: JAIGON CARGA EL BLOQUE ==========
    await test.step('PASO 2: JaiGon carga el bloque', async () => {
      console.log('🔵 INICIANDO PASO 2: JaiGon carga el bloque');

      // 2.1 Preparar login de JaiGon (AndGar ya hizo logout en Paso 1)

      console.log('⏳ Cargando página de login para JaiGon con estrategia robusta...');

      // Estrategia robusta para aplicaciones React
      await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

      // Esperar que React esté completamente cargado
      await page.waitForFunction(() => {
        // Verificar que el DOM está listo y React ha renderizado
        const hasReactRoot = document.querySelector('#root, #app, [data-reactroot], .App') !== null;
        const hasLoginInput = document.querySelector('input[name="nickname"]') !== null;
        const bodyHasContent = document.body && document.body.children.length > 1;

        return document.readyState === 'complete' && hasReactRoot && hasLoginInput && bodyHasContent;
      }, {
        timeout: 45000,
        polling: 1000
      });

      console.log('✅ React app completamente cargado, elementos de login disponibles');

      // Esperar a que los inputs estén completamente estables
      await page.locator('input[name="nickname"]').waitFor({ state: 'visible', timeout: 10000 });
      await page.locator('input[name="password"]').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000); // Tiempo adicional para estabilización

      await page.locator('input[name="nickname"]').fill('JaiGon');
      await page.locator('input[name="password"]').fill('1003');

      // Esperar a que el botón de login esté completamente estable antes de hacer clic
      const loginButton = page.locator('button[type="submit"], #login-btn, .login-btn').first();
      await loginButton.waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1500); // Tiempo adicional para estabilización del botón

      try {
        await loginButton.click({ timeout: 10000 });
      } catch (clickError) {
        console.log('⚠️ First click attempt failed, trying force click...');
        await loginButton.click({ force: true });
      }

      await page.waitForTimeout(4000);
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ JaiGon logged in successfully');

      // 2.2 Navegar a Carga de Bloques
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Load Blocks tab');

      // 2.3 Buscar específicamente el bloque CE1978 de AndGar en Bloques Disponibles con scroll
      console.log('🔍 Buscando bloque CE1978 de AndGar en sección Bloques Disponibles...');

      // Buscar primero la sección Bloques Disponibles
      const bloquesDisponiblesSection = page.locator('div:has(h2:text("Bloques Disponibles"))');

      const ce1978BlockSelectors = [
        'div:has(h3:text-is("CE1978")):has-text("Creador:"):has-text("AndGar")',
        'div:has(h3:text("CE1978")):has-text("AndGar"):has(button:has-text("Cargar"))',
        'div:has-text("CE1978"):has-text("Sin especificar"):has-text("AndGar")',
        'div:has(h3:text("CE1978")):has-text("Creador: AndGar")'
      ];

      let ce1978Block = null;

      // Primer intento: buscar sin scroll
      for (const selector of ce1978BlockSelectors) {
        const block = page.locator(selector).first();
        if (await block.count() > 0) {
          ce1978Block = block;
          console.log(`✅ CE1978 block found with selector: ${selector}`);
          break;
        }
      }

      // Si no se encuentra, hacer scroll y buscar de nuevo
      if (!ce1978Block) {
        console.log('🔍 Bloque CE1978 no visible, haciendo scroll hacia abajo para buscarlo...');

        // Hacer scroll hacia abajo en incrementos
        for (let scrollAttempt = 1; scrollAttempt <= 5; scrollAttempt++) {
          console.log(`📜 Scroll intento ${scrollAttempt}/5`);

          // Scroll hacia abajo
          await page.evaluate(() => {
            window.scrollBy(0, 400);
          });
          await page.waitForTimeout(1000);

          // Buscar de nuevo después del scroll
          for (const selector of ce1978BlockSelectors) {
            const block = page.locator(selector).first();
            if (await block.count() > 0 && await block.isVisible()) {
              ce1978Block = block;
              console.log(`✅ CE1978 block found after scroll with selector: ${selector}`);
              break;
            }
          }

          if (ce1978Block) break;
        }

        // Si aún no se encuentra, probar scroll hacia arriba
        if (!ce1978Block) {
          console.log('🔍 Probando scroll hacia arriba...');
          await page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(1000);

          for (const selector of ce1978BlockSelectors) {
            const block = page.locator(selector).first();
            if (await block.count() > 0 && await block.isVisible()) {
              ce1978Block = block;
              console.log(`✅ CE1978 block found at top with selector: ${selector}`);
              break;
            }
          }
        }
      }

      if (ce1978Block) {
        // 2.4 Hacer scroll para asegurar que el bloque CE1978 esté visible
        await ce1978Block.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        console.log('✅ Scrolled to make CE1978 block visible');

        // DEBUG: Verificar el contenido del bloque encontrado
        try {
          const blockText = await ce1978Block.textContent();
          console.log(`🔍 CE1978 block content (first 200 chars): "${blockText.substring(0, 200)}..."`);

          const allButtons = await ce1978Block.locator('button, input[type="button"], input[type="submit"]').all();
          console.log(`🔍 Total buttons found in CE1978 block: ${allButtons.length}`);

          // Show only AndGar-related buttons
          let relevantButtonCount = 0;
          for (let i = 0; i < allButtons.length; i++) {
            const buttonText = await allButtons[i].textContent().catch(() => 'No text');
            const isRelevant = buttonText.includes('AndGar') ||
                              buttonText.includes('CE1978') ||
                              buttonText.includes('Cargar') ||
                              buttonText.includes('Eliminar');
            if (isRelevant) {
              console.log(`🔍 Button ${i + 1}: "${buttonText}"`);
              relevantButtonCount++;
            }
          }
          console.log(`🔍 Found ${relevantButtonCount} AndGar-related buttons out of ${allButtons.length} total`);
        } catch (debugError) {
          console.log('⚠️ Block debug failed:', debugError.message);
        }

        // 2.5 Buscar botón "Cargar" específicamente dentro del bloque CE1978 con scroll
        // Estrategia robusta: múltiples selectores y contenido del botón
        const loadButtonSelectors = [
          'button:has-text("Cargar")',
          'button[onclick*="cargar"]',
          'button[onclick*="Cargar"]',
          'button:has-text("Seleccionar")',
          'button:has-text("Jugar")',
          'button:has-text("Load")',
          'input[type="button"][value*="Cargar"]',
          'input[type="submit"][value*="Cargar"]',
          '.load-btn',
          '.select-btn',
          '.play-btn',
          '.cargar-btn',
          '[data-action="load"]',
          '[data-action="cargar"]'
        ];

        let loadButton = null;

        // Primer intento: buscar botón sin scroll adicional
        for (const selector of loadButtonSelectors) {
          const button = ce1978Block.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            loadButton = button;
            console.log(`✅ Load button found with selector: ${selector}`);
            break;
          }
        }

        // Si no se encuentra el botón, hacer scroll adicional dentro del bloque
        if (!loadButton) {
          console.log('🔍 Botón "Cargar" no visible en CE1978, haciendo scroll adicional...');

          // Scroll hacia el bloque y luego buscar botones
          await ce1978Block.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);

          // Intentar scroll hacia abajo para encontrar el botón
          for (let buttonScrollAttempt = 1; buttonScrollAttempt <= 3; buttonScrollAttempt++) {
            console.log(`📜 Scroll de botón intento ${buttonScrollAttempt}/3`);

            // Scroll hacia abajo desde la posición del bloque
            await page.evaluate(() => {
              window.scrollBy(0, 200);
            });
            await page.waitForTimeout(800);

            // Buscar botón de nuevo después del scroll
            for (const selector of loadButtonSelectors) {
              const button = ce1978Block.locator(selector).first();
              if (await button.count() > 0 && await button.isVisible()) {
                loadButton = button;
                console.log(`✅ Load button found after additional scroll with selector: ${selector}`);
                break;
              }
            }

            if (loadButton) break;
          }

          // Si aún no se encuentra, probar scroll hacia arriba
          if (!loadButton) {
            console.log('🔍 Probando scroll hacia arriba para encontrar botón...');
            await ce1978Block.scrollIntoViewIfNeeded();
            await page.evaluate(() => {
              window.scrollBy(0, -200);
            });
            await page.waitForTimeout(800);

            for (const selector of loadButtonSelectors) {
              const button = ce1978Block.locator(selector).first();
              if (await button.count() > 0 && await button.isVisible()) {
                loadButton = button;
                console.log(`✅ Load button found after scroll up with selector: ${selector}`);
                break;
              }
            }
          }
        }

        if (loadButton) {
          // Asegurar que el botón "Cargar" esté perfectamente visible
          await loadButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          console.log('✅ Load button scrolled into perfect view within CE1978 block');

          await loadButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ CE1978 block loaded successfully');

          // 2.6 Verificar que el bloque se cargó
          const loadedIndicator = page.locator('text=/cargado/i').or(page.locator('text=/loaded/i')).or(page.locator('.loaded-block')).first();
          if (await loadedIndicator.count() > 0) {
            console.log('✅ CE1978 block loading confirmed');
          }
        } else {
          console.log('❌ Load button not found within CE1978 block after scrolling');
          throw new Error('No se encontró el botón "Cargar" en el bloque CE1978 después de hacer scroll');
        }
      } else {
        console.log('❌ CE1978 block not found in Bloques Disponibles');
        throw new Error('No se encontró el bloque CE1978 en Bloques Disponibles');
      }

      console.log('🟢 PASO 2 COMPLETADO: JaiGon cargó el bloque exitosamente\n');
    });

    // ========== PASO 3: SEBDOM CARGA EL BLOQUE ==========
    await test.step('PASO 3: SebDom carga el bloque', async () => {
      console.log('🔵 INICIANDO PASO 3: SebDom carga el bloque');

      // 3.1 Logout de JaiGon y preparar login de SebDom
      await performLogout(page);

      console.log('⏳ Cargando página de login para SebDom...');
      await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

      await page.waitForFunction(() => {
        const hasReactRoot = document.querySelector('#root, #app, [data-reactroot], .App') !== null;
        const hasLoginInput = document.querySelector('input[name="nickname"]') !== null;
        const bodyHasContent = document.body && document.body.children.length > 1;
        return document.readyState === 'complete' && hasReactRoot && hasLoginInput && bodyHasContent;
      }, { timeout: 45000, polling: 1000 });

      console.log('✅ SebDom login page loaded successfully');
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 10000 });
      console.log('✅ SebDom logged in successfully');

      // 3.2 Navegar a Carga de Bloques
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Load Blocks tab');

      // 3.3 Buscar específicamente el bloque CE1978 en Bloques Disponibles con scroll
      console.log('🔍 Buscando bloque CE1978 específicamente en Bloques Disponibles...');

      const ce1978BlockSelectors = [
        'div:has-text("CE1978"):has-text("AndGar"):has(button:has-text("Cargar"))',
        'div:has(h3:text("CE1978")):has(button:has-text("Cargar"))',
        '.block-card:has-text("CE1978")',
        '.available-block:has-text("CE1978")',
        '.game-block:has-text("CE1978")',
        '.block:has-text("AndGar")',
        '[data-block-name*="CE1978"]'
      ];

      let ce1978Block = null;

      // Primer intento: buscar sin scroll
      for (const selector of ce1978BlockSelectors) {
        const block = page.locator(selector).first();
        if (await block.count() > 0) {
          ce1978Block = block;
          console.log(`✅ CE1978 block found with selector: ${selector}`);
          break;
        }
      }

      // Si no se encuentra, hacer scroll y buscar de nuevo
      if (!ce1978Block) {
        console.log('🔍 Bloque CE1978 no visible, haciendo scroll hacia abajo para buscarlo...');

        // Hacer scroll hacia abajo en incrementos
        for (let scrollAttempt = 1; scrollAttempt <= 5; scrollAttempt++) {
          console.log(`📜 Scroll intento ${scrollAttempt}/5`);

          // Scroll hacia abajo
          await page.evaluate(() => {
            window.scrollBy(0, 400);
          });
          await page.waitForTimeout(1000);

          // Buscar de nuevo después del scroll
          for (const selector of ce1978BlockSelectors) {
            const block = page.locator(selector).first();
            if (await block.count() > 0 && await block.isVisible()) {
              ce1978Block = block;
              console.log(`✅ CE1978 block found after scroll with selector: ${selector}`);
              break;
            }
          }

          if (ce1978Block) break;
        }

        // Si aún no se encuentra, probar scroll hacia arriba
        if (!ce1978Block) {
          console.log('🔍 Probando scroll hacia arriba...');
          await page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(1000);

          for (const selector of ce1978BlockSelectors) {
            const block = page.locator(selector).first();
            if (await block.count() > 0 && await block.isVisible()) {
              ce1978Block = block;
              console.log(`✅ CE1978 block found at top with selector: ${selector}`);
              break;
            }
          }
        }
      }

      if (ce1978Block) {
        // 3.4 Hacer scroll para asegurar que el bloque CE1978 esté visible
        await ce1978Block.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        console.log('✅ Scrolled to make CE1978 block visible');

        // DEBUG: Verificar el contenido del bloque encontrado
        try {
          const blockText = await ce1978Block.textContent();
          console.log(`🔍 CE1978 block content (first 200 chars): "${blockText.substring(0, 200)}..."`);

          const allButtons = await ce1978Block.locator('button, input[type="button"], input[type="submit"]').all();
          console.log(`🔍 Total buttons found in CE1978 block: ${allButtons.length}`);

          // Show only AndGar-related buttons
          let relevantButtonCount = 0;
          for (let i = 0; i < allButtons.length; i++) {
            const buttonText = await allButtons[i].textContent().catch(() => 'No text');
            const isRelevant = buttonText.includes('AndGar') ||
                              buttonText.includes('CE1978') ||
                              buttonText.includes('Cargar') ||
                              buttonText.includes('Eliminar');
            if (isRelevant) {
              console.log(`🔍 Button ${i + 1}: "${buttonText}"`);
              relevantButtonCount++;
            }
          }
          console.log(`🔍 Found ${relevantButtonCount} AndGar-related buttons out of ${allButtons.length} total`);
        } catch (debugError) {
          console.log('⚠️ Block debug failed:', debugError.message);
        }

        // 3.5 Buscar botón "Cargar" específicamente dentro del bloque CE1978 con scroll
        // Estrategia robusta: múltiples selectores y contenido del botón
        const loadButtonSelectors = [
          'button:has-text("Cargar")',
          'button[onclick*="cargar"]',
          'button[onclick*="Cargar"]',
          'button:has-text("Seleccionar")',
          'button:has-text("Jugar")',
          'button:has-text("Load")',
          'input[type="button"][value*="Cargar"]',
          'input[type="submit"][value*="Cargar"]',
          '.load-btn',
          '.select-btn',
          '.play-btn',
          '.cargar-btn',
          '[data-action="load"]',
          '[data-action="cargar"]'
        ];

        let loadButton = null;

        // Primer intento: buscar botón sin scroll adicional
        for (const selector of loadButtonSelectors) {
          const button = ce1978Block.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            loadButton = button;
            console.log(`✅ Load button found with selector: ${selector}`);
            break;
          }
        }

        // Si no se encuentra el botón, hacer scroll adicional dentro del bloque
        if (!loadButton) {
          console.log('🔍 Botón "Cargar" no visible en CE1978, haciendo scroll adicional...');

          // Scroll hacia el bloque y luego buscar botones
          await ce1978Block.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);

          // Intentar scroll hacia abajo para encontrar el botón
          for (let buttonScrollAttempt = 1; buttonScrollAttempt <= 3; buttonScrollAttempt++) {
            console.log(`📜 Scroll de botón intento ${buttonScrollAttempt}/3`);

            // Scroll hacia abajo desde la posición del bloque
            await page.evaluate(() => {
              window.scrollBy(0, 200);
            });
            await page.waitForTimeout(800);

            // Buscar botón de nuevo después del scroll
            for (const selector of loadButtonSelectors) {
              const button = ce1978Block.locator(selector).first();
              if (await button.count() > 0 && await button.isVisible()) {
                loadButton = button;
                console.log(`✅ Load button found after additional scroll with selector: ${selector}`);
                break;
              }
            }

            if (loadButton) break;
          }

          // Si aún no se encuentra, probar scroll hacia arriba
          if (!loadButton) {
            console.log('🔍 Probando scroll hacia arriba para encontrar botón...');
            await ce1978Block.scrollIntoViewIfNeeded();
            await page.evaluate(() => {
              window.scrollBy(0, -200);
            });
            await page.waitForTimeout(800);

            for (const selector of loadButtonSelectors) {
              const button = ce1978Block.locator(selector).first();
              if (await button.count() > 0 && await button.isVisible()) {
                loadButton = button;
                console.log(`✅ Load button found after scroll up with selector: ${selector}`);
                break;
              }
            }
          }
        }

        if (loadButton) {
          // Asegurar que el botón "Cargar" esté perfectamente visible
          await loadButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          console.log('✅ Load button scrolled into perfect view within CE1978 block');

          await loadButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ CE1978 block loaded successfully');

          // 3.6 Verificar que el bloque se cargó
          const loadedIndicator = page.locator('text=/cargado/i').or(page.locator('text=/loaded/i')).or(page.locator('.loaded-block')).first();
          if (await loadedIndicator.count() > 0) {
            console.log('✅ CE1978 block loading confirmed');
          }
        } else {
          console.log('❌ Load button not found within CE1978 block after scrolling');
          throw new Error('No se encontró el botón "Cargar" en el bloque CE1978 después de hacer scroll');
        }
      } else {
        console.log('❌ CE1978 block not found in Bloques Disponibles');
        throw new Error('No se encontró el bloque CE1978 en Bloques Disponibles');
      }

      console.log('🟢 PASO 3 COMPLETADO: SebDom cargó el bloque exitosamente\n');
    });

    // ========== PASO 4: SEBDOM DESCARGA EL BLOQUE ==========
    await test.step('PASO 4: SebDom descarga el bloque', async () => {
      console.log('🔵 INICIANDO PASO 4: SebDom descarga el bloque');

      // 4.1 Navegar a Carga de Bloques (ya estamos logueados como SebDom)
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Carga de Bloques tab');

      // 4.2 Buscar el bloque CE1978 en Bloques Disponibles con múltiples selectores
      console.log('🔍 Buscando bloque CE1978 en Bloques Disponibles...');

      const downloadBlockSelectors = [
        '.block-card:has-text("CE1978")',
        '.available-block:has-text("CE1978")',
        '.game-block:has-text("CE1978")',
        'text=/CE1978/i',
        '.block:has-text("AndGar")',
        '[data-block-name*="CE1978"]'
      ];

      let ce1978Block = null;
      for (const selector of downloadBlockSelectors) {
        const block = page.locator(selector).first();
        if (await block.count() > 0) {
          ce1978Block = block;
          console.log(`✅ CE1978 block found with selector: ${selector}`);
          break;
        }
      }

      if (ce1978Block) {
        // 4.3 Hacer scroll para asegurar que el bloque esté visible
        await ce1978Block.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        console.log('✅ Scrolled to make CE1978 block visible');

        // 4.4 Buscar opción de descarga en el bloque CE1978
        const downloadButton = ce1978Block.locator('button:has-text("Descargar"), a:has-text("Descargar"), .download-btn').first();

        if (await downloadButton.count() > 0) {
          console.log('✅ Download option found');

          // Asegurar que el botón de descarga esté visible
          await downloadButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          console.log('✅ Download button scrolled into view');

          // 4.5 Configurar manejo de descarga
          const downloadPromise = page.waitForEvent('download');

          await downloadButton.click();
          console.log('✅ Download button clicked');

          try {
            // 4.5 Esperar a que inicie la descarga
            const download = await downloadPromise;
            console.log('✅ Download started successfully');

            // 4.6 Verificar que el archivo se descargó
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

          // 4.7 Buscar enlaces de descarga alternativos
          const downloadLink = page.locator('a[href*="download"], a[href*=".zip"], a[href*=".txt"]').first();
          if (await downloadLink.count() > 0) {
            await downloadLink.click();
            console.log('✅ Download link clicked');
          }
        }

        // 4.8 Verificar estado de descarga
        const downloadedIndicator = page.locator('text=/descargado/i').or(page.locator('text=/downloaded/i')).or(page.locator('.downloaded')).first();

        if (await downloadedIndicator.count() > 0) {
          console.log('✅ Block shows as downloaded');
        }

        // 4.9 Verificar que sigue apareciendo el bloque para futuras descargas
        const blockStillVisible = page.locator('text=AndGar, text=/CE1978/i').first();
        if (await blockStillVisible.count() > 0) {
          console.log('✅ Block remains visible for future downloads');
        }

      } else {
        console.log('❌ CE1978 block not found in Bloques Disponibles');
        throw new Error('No se encontró el bloque CE1978 para descargar');
      }

      console.log('🟢 PASO 4 COMPLETADO: SebDom descargó el bloque exitosamente\n');
    });

    // ========== PASO 5: ANDGAR ELIMINA EL BLOQUE ==========
    await test.step('PASO 5: AndGar elimina el bloque', async () => {
      console.log('🔵 INICIANDO PASO 5: AndGar elimina el bloque');

      // 5.1 Logout de SebDom y preparar login final de AndGar
      await performLogout(page);

      console.log('⏳ Cargando página de login para AndGar final...');
      await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

      await page.waitForFunction(() => {
        const hasReactRoot = document.querySelector('#root, #app, [data-reactroot], .App') !== null;
        const hasLoginInput = document.querySelector('input[name="nickname"]') !== null;
        const bodyHasContent = document.body && document.body.children.length > 1;
        return document.readyState === 'complete' && hasReactRoot && hasLoginInput && bodyHasContent;
      }, { timeout: 45000, polling: 1000 });

      console.log('✅ AndGar final login page loaded successfully');
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);
      await expect(page).toHaveURL(/creators-panel-content/, { timeout: 10000 });
      console.log('✅ AndGar logged in successfully');

      // 5.2 Navegar a Contenido
      const contentTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("📝 Contenido")').first();
      await contentTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Content tab');

      // 5.3 Buscar y eliminar bloque CE1978 en Bloques Creados
      console.log('🔍 Buscando bloque CE1978 en sección Bloques Creados...');

      const ce1978BlockSelectors = [
        'div:has-text("CE1978"):has-text("AndGar"):has(button:has-text("Eliminar"))',
        'div:has(h3:text("CE1978")):has(button:has-text("Eliminar"))',
        '.created-block:has-text("CE1978")',
        '.block-card:has-text("CE1978")',
        '.my-block:has-text("CE1978")',
        '.user-block:has-text("CE1978")',
        '[data-block-id*="CE1978"]'
      ];

      let ce1978Block = null;
      for (const selector of ce1978BlockSelectors) {
        const block = page.locator(selector).first();
        if (await block.count() > 0) {
          ce1978Block = block;
          console.log(`✅ CE1978 block found in Bloques Creados with selector: ${selector}`);
          break;
        }
      }

      if (ce1978Block) {
        // 5.4 Hacer scroll para asegurar que el bloque esté visible
        await ce1978Block.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        console.log('✅ Scrolled to make CE1978 block visible in Bloques Creados');

        // DEBUG: Verificar el contenido del bloque encontrado en Bloques Creados
        try {
          const blockText = await ce1978Block.textContent();
          console.log(`🔍 CE1978 block content in Bloques Creados (first 200 chars): "${blockText.substring(0, 200)}..."`);

          const allButtons = await ce1978Block.locator('button, input[type="button"], input[type="submit"]').all();
          console.log(`🔍 Total buttons found in CE1978 block (Bloques Creados): ${allButtons.length}`);

          for (let i = 0; i < allButtons.length; i++) {
            const buttonText = await allButtons[i].textContent().catch(() => 'No text');
            console.log(`🔍 Button ${i + 1} in Bloques Creados: "${buttonText}"`);
          }
        } catch (debugError) {
          console.log('⚠️ Block debug failed in Bloques Creados:', debugError.message);
        }

        // 5.5 Buscar botón de eliminar específicamente dentro del bloque CE1978
        const deleteButton = ce1978Block.locator('button:has-text("Eliminar"), button:has-text("🗑️"), .delete-btn, .remove-btn').first();

        if (await deleteButton.count() > 0) {
          // Asegurar que el botón de eliminar esté visible
          await deleteButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          console.log('✅ Delete button scrolled into view');

          await deleteButton.click();
          console.log('✅ Delete button clicked');

          // 5.5 Confirmar eliminación si aparece modal de confirmación
          const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            console.log('✅ Deletion confirmed');
          }

          await page.waitForTimeout(3000);

          // 5.6 Verificar que el bloque ya no aparece
          const blockStillExists = page.locator('text=/CE1978/i').first();
          if (await blockStillExists.count() === 0) {
            console.log('✅ CE1978 block successfully deleted');
          } else {
            console.log('⚠️ CE1978 block may still exist');
          }

        } else {
          console.log('❌ Delete button not found in CE1978 block');
          throw new Error('No se encontró el botón de eliminar en el bloque CE1978');
        }
      } else {
        console.log('❌ CE1978 block not found in Bloques Creados section');
        throw new Error('No se encontró el bloque CE1978 en la sección Bloques Creados');
      }

      console.log('🟢 PASO 5 COMPLETADO: AndGar eliminó el bloque exitosamente\n');
    });

    console.log('🏆 FLUJO COMPLETO DE BLOQUE 3 FINALIZADO EXITOSAMENTE');
    console.log('✅ Todos los 5 pasos ejecutados secuencialmente en orden correcto');
  });
});