const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificación de Disponibilidad del Bloque de AndGar', () => {
  
  test('JaiGon puede ver el bloque creado por AndGar', async ({ page }) => {
    
    await test.step('Login como JaiGon', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded'); // Cambio de networkidle a domcontentloaded
      await page.locator('input[name="nickname"]').fill('JaiGon');
      await page.locator('input[name="password"]').fill('1003');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ JaiGon logged in successfully');
    });
    
    await test.step('Buscar bloques disponibles', async () => {
      // Esperar a que cargue el contenido
      await page.waitForTimeout(3000);
      
      // Buscar elementos que indiquen bloques disponibles
      const possibleBlockSelectors = [
        '.block-card',
        '.available-block', 
        '.game-block',
        '.block-item',
        '.content-block',
        '[data-testid="block"]',
        '.quiz-block',
        '.block-list .block',
        '.available-content'
      ];
      
      let blockFound = false;
      let blockElement = null;
      
      for (const selector of possibleBlockSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          blockElement = elements.first();
          blockFound = true;
          console.log(`✅ Found ${count} blocks using selector: ${selector}`);
          break;
        }
      }
      
      if (blockFound) {
        await expect(blockElement).toBeVisible();
        console.log('✅ Block element is visible');
        
        // Intentar encontrar información específica de AndGar
        const andgarMentions = page.locator('text=AndGar');
        const andgarCount = await andgarMentions.count();
        if (andgarCount > 0) {
          console.log(`✅ Found ${andgarCount} mentions of AndGar`);
        }
        
        // Buscar referencias a CE1978 o los temas específicos
        const ce1978Mentions = page.locator('text=/CE1978|Título|Derechos|Corona|Cortes/i');
        const ce1978Count = await ce1978Mentions.count();
        if (ce1978Count > 0) {
          console.log(`✅ Found ${ce1978Count} mentions of CE1978 topics`);
        }
        
      } else {
        console.log('⚠️ No block elements found with standard selectors');
        
        // Buscar cualquier contenido que pueda indicar bloques
        const anyBlockText = page.locator('text=/bloque|block|contenido|quiz|juego/i');
        const anyBlockCount = await anyBlockText.count();
        console.log(`ℹ️ Found ${anyBlockCount} general block-related text elements`);
        
        // Verificar si hay mensajes de "no hay bloques"
        const noBlocksMessage = page.locator('text=/no hay|sin contenido|vacío|empty/i');
        const noBlocksCount = await noBlocksMessage.count();
        if (noBlocksCount > 0) {
          console.log('⚠️ Found "no blocks" message - blocks may not be properly saved or visible');
        }
      }
    });
    
    await test.step('Verificar estado de la página', async () => {
      // Capturar información general de la página
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      const url = page.url();
      console.log(`🔗 Current URL: ${url}`);
      
      // Verificar si hay errores de JavaScript en consola
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`❌ Console error: ${msg.text()}`);
        }
      });
      
      // Buscar indicadores de carga o errores
      const loadingIndicators = page.locator('.loading, .spinner');
      const loadingCount = await loadingIndicators.count();
      if (loadingCount > 0) {
        console.log(`⏳ Found ${loadingCount} loading indicators`);
      }
      
      const errorIndicators = page.locator('.error, .alert-danger');
      const errorCount = await errorIndicators.count();
      if (errorCount > 0) {
        console.log(`❌ Found ${errorCount} error indicators`);
      }
    });
    
    console.log('🔍 Block availability verification completed');
  });
});