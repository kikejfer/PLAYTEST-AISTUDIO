const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Manual Observation - Almacenar operaciones reales', () => {
  
  test('Observación manual completa del proceso de creación de bloque', async ({ page }) => {
    
    // Configurar test para ser muy lento y observable
    test.setTimeout(600000); // 10 minutos
    
    console.log('\n🎯 ======= TEST DE OBSERVACIÓN MANUAL =======');
    console.log('📋 Este test se pausará para que realices todas las operaciones manualmente');
    console.log('🔍 Playwright observará y almacenará todo lo que hagas');
    console.log('📊 Al final tendremos un registro completo del proceso real');
    
    await test.step('Ir a la página de login', async () => {
      console.log('\n🔄 Navegando a la página de login...');
      await page.goto(LOGIN_URL);
      console.log('✅ Página cargada');
      
      // Capturar estado inicial
      await page.screenshot({ path: 'manual-01-login-page.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-01-login-page.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Login como AndGar', async () => {
      console.log('\n🛑 ======= PAUSA PARA LOGIN MANUAL =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Introduce nickname: AndGar');
      console.log('2. Introduce password: 1002');
      console.log('3. Pulsa el botón de login');
      console.log('4. Espera a que cargue el panel de creador');
      console.log('5. Presiona F8 o cualquier tecla cuando hayas terminado');
      
      // PAUSA MANUAL
      await page.pause();
      
      console.log('✅ Login completado manualmente');
      await page.screenshot({ path: 'manual-02-after-login.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-02-after-login.png');
      
      // Capturar URL actual
      const currentURL = page.url();
      console.log(`🔗 URL después del login: ${currentURL}`);
    });
    
    await test.step('🛑 PAUSA MANUAL - Navegar a Añadir Preguntas', async () => {
      console.log('\n🛑 ======= PAUSA PARA NAVEGACIÓN =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Busca y pulsa la pestaña "Añadir Preguntas"');
      console.log('2. Espera a que cargue la sección');
      console.log('3. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Navegación completada manualmente');
      await page.screenshot({ path: 'manual-03-add-questions-tab.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-03-add-questions-tab.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Activar Subida Múltiple', async () => {
      console.log('\n🛑 ======= PAUSA PARA ACTIVAR SUBIDA MÚLTIPLE =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Busca la opción "Subida Múltiple desde Carpeta"');
      console.log('2. Actívala (click en label o checkbox)');
      console.log('3. Observa qué elementos aparecen');
      console.log('4. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Subida múltiple activada manualmente');
      await page.screenshot({ path: 'manual-04-multiple-upload-activated.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-04-multiple-upload-activated.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Seleccionar Carpeta', async () => {
      console.log('\n🛑 ======= PAUSA PARA SELECCIÓN DE CARPETA =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Busca el botón/input para seleccionar carpeta');
      console.log('2. Haz click y selecciona la carpeta con archivos CE1978');
      console.log('3. Maneja cualquier diálogo emergente');
      console.log('4. Pulsa "Subir" si aparece mensaje emergente');
      console.log('5. Espera a que se carguen los archivos');
      console.log('6. Presiona F8 cuando veas los archivos listados');
      
      await page.pause();
      
      console.log('✅ Carpeta seleccionada y archivos cargados manualmente');
      await page.screenshot({ path: 'manual-05-files-loaded.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-05-files-loaded.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Seleccionar Archivos', async () => {
      console.log('\n🛑 ======= PAUSA PARA SELECCIÓN DE ARCHIVOS =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Selecciona los archivos CE1978 que quieras procesar');
      console.log('2. Marca los checkboxes correspondientes');
      console.log('3. Verifica que estén seleccionados');
      console.log('4. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Archivos seleccionados manualmente');
      await page.screenshot({ path: 'manual-06-files-selected.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-06-files-selected.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Cargar Preguntas', async () => {
      console.log('\n🛑 ======= PAUSA PARA CARGAR PREGUNTAS =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Busca el botón "Cargar" o "Cargar Preguntas"');
      console.log('2. Púlsalo para procesar los archivos seleccionados');
      console.log('3. Espera a que se procesen');
      console.log('4. Observa qué sucede en pantalla');
      console.log('5. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Preguntas cargadas manualmente');
      await page.screenshot({ path: 'manual-07-questions-loaded.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-07-questions-loaded.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Guardar Bloque', async () => {
      console.log('\n🛑 ======= PAUSA PARA GUARDAR BLOQUE =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Busca el botón "Guardar" o "Guardar Preguntas"');
      console.log('2. Púlsalo para guardar el bloque');
      console.log('3. Espera a que se guarde');
      console.log('4. Observa mensajes de confirmación');
      console.log('5. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Bloque guardado manualmente');
      await page.screenshot({ path: 'manual-08-block-saved.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-08-block-saved.png');
    });
    
    await test.step('🛑 PAUSA MANUAL - Verificar en Contenido', async () => {
      console.log('\n🛑 ======= PAUSA PARA VERIFICACIÓN =======');
      console.log('📋 Por favor realiza manualmente:');
      console.log('1. Ve a la pestaña "Contenido"');
      console.log('2. Busca el bloque que acabas de crear');
      console.log('3. Verifica que aparece listado');
      console.log('4. Anota qué información muestra');
      console.log('5. Presiona F8 cuando hayas terminado');
      
      await page.pause();
      
      console.log('✅ Verificación completada manualmente');
      await page.screenshot({ path: 'manual-09-content-verification.png', fullPage: true });
      console.log('📸 Screenshot guardado: manual-09-content-verification.png');
    });
    
    await test.step('Análisis final automático', async () => {
      console.log('\n🔍 ======= ANÁLISIS FINAL AUTOMÁTICO =======');
      
      // Capturar información final
      const finalURL = page.url();
      const pageTitle = await page.title();
      
      console.log(`🔗 URL final: ${finalURL}`);
      console.log(`📄 Título de página: ${pageTitle}`);
      
      // Buscar elementos que indiquen bloques creados
      const blockElements = await page.locator('.block-card, .created-block, .block-info').count();
      console.log(`📊 Elementos de bloque encontrados: ${blockElements}`);
      
      // Buscar texto relacionado con bloques
      const blockText = await page.locator('text=/bloque/i').count();
      console.log(`📝 Referencias a "bloque" en página: ${blockText}`);
      
      // Capturar errores de consola si los hay
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`❌ Error de consola: ${msg.text()}`);
        }
      });
      
      await page.screenshot({ path: 'manual-10-final-state.png', fullPage: true });
      console.log('📸 Screenshot final guardado: manual-10-final-state.png');
    });
    
    console.log('\n🎉 ======= OBSERVACIÓN MANUAL COMPLETADA =======');
    console.log('📸 Se han guardado 10 screenshots del proceso completo');
    console.log('📋 Revisa los archivos manual-XX-*.png para ver cada paso');
    console.log('🔍 Esto nos dará información exacta de qué está sucediendo');
  });
});