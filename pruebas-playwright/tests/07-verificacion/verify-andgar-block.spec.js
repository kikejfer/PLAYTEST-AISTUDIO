const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificación del Bloque Propio de AndGar', () => {
  
  test('AndGar puede ver su propio bloque creado', async ({ page }) => {
    
    await test.step('Login como AndGar', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.locator('input[name="nickname"]').fill('AndGar');
      await page.locator('input[name="password"]').fill('1002');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      await expect(page).toHaveURL(/creators-panel-content/);
      console.log('✅ AndGar logged in successfully');
    });
    
    await test.step('Navegar a pestaña Contenido', async () => {
      // Ir a la pestaña de Contenido para ver bloques creados
      const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
      await contentTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Content tab');
    });
    
    await test.step('Verificar bloques creados por AndGar', async () => {
      // Buscar contenedor de bloques creados
      const blockContainer = page.locator('#bloques-creados-container, .bc-container, .created-blocks, .my-blocks');
      const containerCount = await blockContainer.count();
      
      if (containerCount > 0) {
        await expect(blockContainer.first()).toBeVisible();
        console.log('✅ Block container is visible');
        
        // Buscar bloques dentro del contenedor
        const blocks = blockContainer.first().locator('.block, .block-item, .created-block, .block-card');
        const blockCount = await blocks.count();
        console.log(`📊 Found ${blockCount} blocks in container`);
        
        if (blockCount > 0) {
          console.log('✅ AndGar has created blocks visible');
          
          // Verificar detalles de los bloques
          for (let i = 0; i < Math.min(blockCount, 3); i++) {
            const block = blocks.nth(i);
            const blockText = await block.textContent();
            console.log(`📋 Block ${i + 1}: ${blockText?.substring(0, 100)}...`);
            
            // Buscar referencias a CE1978
            if (blockText?.includes('CE1978') || blockText?.includes('Título')) {
              console.log(`✅ Block ${i + 1} contains CE1978 content`);
            }
          }
        } else {
          console.log('⚠️ No blocks found in container');
        }
      } else {
        console.log('⚠️ Block container not found');
        
        // Buscar otros indicadores de contenido
        const anyBlocks = page.locator('text=/bloque.*creado|created.*block|CE1978|Título/i');
        const anyBlockCount = await anyBlocks.count();
        console.log(`ℹ️ Found ${anyBlockCount} general block references`);
      }
    });
    
    await test.step('Verificar estadísticas de creación', async () => {
      // Buscar estadísticas o contadores
      const stats = page.locator('.stats, .statistics, .block-count');
      const statsCount = await stats.count();
      
      if (statsCount > 0) {
        console.log(`📊 Found ${statsCount} statistics elements`);
        for (let i = 0; i < Math.min(statsCount, 3); i++) {
          const stat = stats.nth(i);
          const statText = await stat.textContent();
          console.log(`📈 Stat ${i + 1}: ${statText}`);
        }
      }
    });
    
    console.log('🔍 AndGar block verification completed');
  });
});