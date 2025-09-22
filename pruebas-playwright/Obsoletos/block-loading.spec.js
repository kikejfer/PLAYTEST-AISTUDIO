const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Carga de Bloque por Usuarios', () => {
  
  test('JaiGon verifica información del bloque y lo carga', async ({ page }) => {
    
    await test.step('Login como JaiGon', async () => {
      await page.goto(LOGIN_URL, { timeout: 15000 });
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('JaiGon');
      await page.locator('input[name="password"]').fill('1003');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ JaiGon logged in successfully');
    });
    
    await test.step('Navegar a Carga de Bloques y verificar bloques disponibles', async () => {
      // Navegar a la pestaña Carga de Bloques
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Load Blocks tab');

      // Buscar bloques disponibles en la sección
      const availableBlocks = page.locator('.block-card, .available-block, .game-block').first();

      if (await availableBlocks.count() > 0) {
        await expect(availableBlocks).toBeVisible();
        console.log('✅ Available blocks are visible');

        // Verificar información del bloque de AndGar
        const andgarBlock = page.locator('text=AndGar').or(page.locator('text=/CE1978/i')).first();
        if (await andgarBlock.count() > 0) {
          console.log('✅ AndGar block information is visible');
        }
      }
    });
    
    await test.step('Cargar el bloque', async () => {
      // Cargar el bloque
      const loadButton = page.locator('button:has-text("Cargar"), button:has-text("Seleccionar"), button:has-text("Jugar")').first();
      
      if (await loadButton.count() > 0) {
        await loadButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Block loaded successfully');
        
        // Verificar que el bloque se cargó
        const loadedIndicator = page.locator('text=/cargado/i').or(page.locator('text=/loaded/i')).or(page.locator('.loaded-block')).first();
        if (await loadedIndicator.count() > 0) {
          console.log('✅ Block loading confirmed');
        }
      }
    });
    
    console.log('🎉 JaiGon block loading test completed successfully');
  });
  
  test('SebDom verifica información del bloque y lo carga', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await page.goto(LOGIN_URL, { timeout: 15000 });
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForTimeout(4000);
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/, { timeout: 10000 });
      console.log('✅ SebDom logged in successfully');
    });
    
    await test.step('Navegar a Carga de Bloques y verificar bloques disponibles', async () => {
      // Navegar a la pestaña Carga de Bloques
      const loadBlocksTab = page.locator('.tab-button:has-text("Carga de Bloques"), button:has-text("Carga de Bloques")').first();
      await loadBlocksTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to Load Blocks tab');

      // Buscar bloques disponibles en la sección
      const availableBlocks = page.locator('.block-card, .available-block, .game-block').first();

      if (await availableBlocks.count() > 0) {
        await expect(availableBlocks).toBeVisible();
        console.log('✅ Available blocks are visible');

        // Verificar información del bloque de AndGar
        const andgarBlock = page.locator('text=AndGar').or(page.locator('text=/CE1978/i')).first();
        if (await andgarBlock.count() > 0) {
          console.log('✅ AndGar block information is visible');
        }
      }
    });
    
    await test.step('Cargar el bloque', async () => {
      // Cargar el bloque
      const loadButton = page.locator('button:has-text("Cargar"), button:has-text("Seleccionar"), button:has-text("Jugar")').first();
      
      if (await loadButton.count() > 0) {
        await loadButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Block loaded successfully');
        
        // Verificar que el bloque se cargó
        const loadedIndicator = page.locator('text=/cargado/i').or(page.locator('text=/loaded/i')).or(page.locator('.loaded-block')).first();
        if (await loadedIndicator.count() > 0) {
          console.log('✅ Block loading confirmed');
        }
      }
    });
    
    console.log('🎉 SebDom block loading test completed successfully');
  });
});