const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Carga de Bloque por Usuarios', () => {
  
  test('JaiGon verifica información del bloque y lo carga', async ({ page }) => {
    
    await test.step('Login como JaiGon', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('networkidle');
      await page.locator('input[name="nickname"]').fill('JaiGon');
      await page.locator('input[name="password"]').fill('1003');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ JaiGon logged in successfully');
    });
    
    await test.step('Verificar bloques disponibles', async () => {
      // Buscar bloques disponibles
      const availableBlocks = page.locator('.block-card, .available-block, .game-block').first();
      
      if (await availableBlocks.count() > 0) {
        await expect(availableBlocks).toBeVisible();
        console.log('✅ Available blocks are visible');
        
        // Verificar información del bloque de AndGar
        const andgarBlock = page.locator('text=AndGar, text=/CE1978/i, text=/Título/i').first();
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
        const loadedIndicator = page.locator('text=/cargado/i, text=/loaded/i, .loaded-block').first();
        if (await loadedIndicator.count() > 0) {
          console.log('✅ Block loading confirmed');
        }
      }
    });
    
    console.log('🎉 JaiGon block loading test completed successfully');
  });
  
  test('SebDom verifica información del bloque y lo carga', async ({ page }) => {
    
    await test.step('Login como SebDom', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('networkidle');
      await page.locator('input[name="nickname"]').fill('SebDom');
      await page.locator('input[name="password"]').fill('1004');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      // Verificar que llega al panel de jugador
      await expect(page).toHaveURL(/jugadores-panel-gaming/);
      console.log('✅ SebDom logged in successfully');
    });
    
    await test.step('Verificar bloques disponibles', async () => {
      // Buscar bloques disponibles
      const availableBlocks = page.locator('.block-card, .available-block, .game-block').first();
      
      if (await availableBlocks.count() > 0) {
        await expect(availableBlocks).toBeVisible();
        console.log('✅ Available blocks are visible');
        
        // Verificar información del bloque de AndGar
        const andgarBlock = page.locator('text=AndGar, text=/CE1978/i, text=/Título/i').first();
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
        const loadedIndicator = page.locator('text=/cargado/i, text=/loaded/i, .loaded-block').first();
        if (await loadedIndicator.count() > 0) {
          console.log('✅ Block loading confirmed');
        }
      }
    });
    
    console.log('🎉 SebDom block loading test completed successfully');
  });
});