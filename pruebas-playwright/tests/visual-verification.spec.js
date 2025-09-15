const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificación Visual del Sistema', () => {
  
  test('Verificar qué ve cada usuario en su panel', async ({ page }) => {
    
    // Configurar capturas de pantalla
    test.setTimeout(180000); // 3 minutos
    
    await test.step('1. Verificar panel de AndGar (creador)', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      console.log('✅ AndGar logged in');
      
      // Captura inicial del panel
      await page.screenshot({ path: 'andgar-panel-inicial.png', fullPage: true });
      console.log('📸 Captura: andgar-panel-inicial.png');
      
      // Ir a pestaña Contenido
      const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
      if (await contentTab.count() > 0) {
        await contentTab.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'andgar-contenido-tab.png', fullPage: true });
        console.log('📸 Captura: andgar-contenido-tab.png');
      }
      
      // Ir a pestaña Añadir Preguntas
      const addTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
      if (await addTab.count() > 0) {
        await addTab.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'andgar-add-questions-tab.png', fullPage: true });
        console.log('📸 Captura: andgar-add-questions-tab.png');
      }
    });
    
    await test.step('2. Verificar panel de JaiGon (jugador)', async () => {
      // Logout y login como JaiGon
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      
      await page.locator('input[name="nickname"]').fill('JaiGon');
      await page.locator('input[name="password"]').fill('1003');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      console.log('✅ JaiGon logged in');
      
      // Captura del panel de jugador
      await page.screenshot({ path: 'jaigon-panel-gaming.png', fullPage: true });
      console.log('📸 Captura: jaigon-panel-gaming.png');
      
      // Buscar cualquier elemento relacionado con bloques
      const pageContent = await page.content();
      console.log('📄 JaiGon page title:', await page.title());
      console.log('🔗 JaiGon URL:', page.url());
      
      // Buscar texto relacionado con bloques
      const blockTexts = await page.locator('text=/bloque|block|AndGar|CE1978|quiz|juego/i').allTextContents();
      console.log('🔍 Textos relacionados con bloques encontrados:', blockTexts.slice(0, 5));
    });
    
    await test.step('3. Verificar panel de SebDom (jugador)', async () => {
      // Logout y login como SebDom
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      console.log('✅ SebDom logged in');
      
      // Captura del panel de jugador
      await page.screenshot({ path: 'sebdom-panel-gaming.png', fullPage: true });
      console.log('📸 Captura: sebdom-panel-gaming.png');
      
      console.log('📄 SebDom page title:', await page.title());
      console.log('🔗 SebDom URL:', page.url());
    });
    
    await test.step('4. Verificar panel de AdminPrincipal', async () => {
      // Logout y login como AdminPrincipal
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      
      await page.locator('input[name="nickname"]').fill('AdminPrincipal');
      await page.locator('input[name="password"]').fill('kikejfer');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      console.log('✅ AdminPrincipal logged in');
      
      // Captura del panel de admin
      await page.screenshot({ path: 'adminprincipal-panel.png', fullPage: true });
      console.log('📸 Captura: adminprincipal-panel.png');
      
      console.log('📄 AdminPrincipal page title:', await page.title());
      console.log('🔗 AdminPrincipal URL:', page.url());
      
      // Buscar información de AndGar
      const andgarTexts = await page.locator('text=AndGar').allTextContents();
      console.log('👤 Referencias a AndGar encontradas:', andgarTexts);
    });
    
    console.log('🎉 Verificación visual completada');
    console.log('📸 Capturas guardadas en el directorio del proyecto');
  });
});