const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');
const { selectRole } = require('./utils/creator-blocks-helper');

test.describe('Debug Tabs Navigation', () => {
  test('Debug navigation to Contenido and Recursos tabs', async ({ page }) => {
    console.log('\n🔍 === DEBUGGING TABS NAVIGATION ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Test 1: Navigate to Profesor panel and Recursos tab
      console.log('\n1️⃣ === TESTING PROFESOR PANEL - RECURSOS TAB ===');

      await selectRole(page, 'Profesor');
      console.log('✅ Navigated to Profesor panel');

      // Wait for page to stabilize
      await page.waitForTimeout(3000);

      // Look for Recursos tab
      console.log('📋 Looking for Recursos tab...');

      // Check all available tabs/buttons
      const allButtons = await page.locator('button').all();
      console.log(`📋 Total buttons found: ${allButtons.length}`);

      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i];
        const buttonText = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`   ${i + 1}. "${buttonText?.trim()}" (visible: ${isVisible})`);
      }

      // Try to find and click Recursos tab
      try {
        const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first();
        const tabExists = await recursosTab.count();
        console.log(`📋 Recursos tab found: ${tabExists > 0 ? 'YES' : 'NO'}`);

        if (tabExists > 0) {
          await recursosTab.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Recursos tab');
        } else {
          console.log('❌ Recursos tab not found');
        }
      } catch (tabError) {
        console.log(`❌ Error clicking Recursos tab: ${tabError.message}`);
      }

      // Check blocks in Profesor panel
      console.log('\n📋 Checking blocks in Profesor panel...');
      try {
        await page.waitForSelector('#recursos-bloques-creados-container', { timeout: 5000 });
        const container = page.locator('#recursos-bloques-creados-container');
        const blockCards = container.locator('.bc-block-card');
        const cardCount = await blockCards.count();

        console.log(`🔍 Found ${cardCount} block cards in Profesor/Recursos`);

        for (let i = 0; i < cardCount; i++) {
          const card = blockCards.nth(i);
          const titleElement = card.locator('.bc-block-title');
          const titleExists = await titleElement.count();

          if (titleExists > 0) {
            const blockTitle = await titleElement.textContent();
            console.log(`   ${i + 1}. "${blockTitle?.trim()}"`);
          }
        }
      } catch (containerError) {
        console.log(`❌ Error checking Profesor blocks: ${containerError.message}`);
      }

      // Test 2: Navigate to Creador panel and Contenido tab
      console.log('\n2️⃣ === TESTING CREADOR PANEL - CONTENIDO TAB ===');

      await selectRole(page, 'Creador');
      console.log('✅ Navigated to Creador panel');

      // Wait for page to stabilize
      await page.waitForTimeout(3000);

      // Look for Contenido tab
      console.log('📋 Looking for Contenido tab...');

      // Check all available tabs/buttons again
      const allButtonsCreador = await page.locator('button').all();
      console.log(`📋 Total buttons found: ${allButtonsCreador.length}`);

      for (let i = 0; i < Math.min(allButtonsCreador.length, 10); i++) {
        const button = allButtonsCreador[i];
        const buttonText = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`   ${i + 1}. "${buttonText?.trim()}" (visible: ${isVisible})`);
      }

      // Try to find and click Contenido tab
      try {
        const contenidoTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("Contenido")').first();
        const tabExists = await contenidoTab.count();
        console.log(`📋 Contenido tab found: ${tabExists > 0 ? 'YES' : 'NO'}`);

        if (tabExists > 0) {
          await contenidoTab.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Contenido tab');
        } else {
          console.log('❌ Contenido tab not found');
        }
      } catch (tabError) {
        console.log(`❌ Error clicking Contenido tab: ${tabError.message}`);
      }

      // Check blocks in Creador panel
      console.log('\n📋 Checking blocks in Creador panel...');
      try {
        await page.waitForSelector('#bloques-creados-container', { timeout: 5000 });
        const container = page.locator('#bloques-creados-container');
        const blockCards = container.locator('.bc-block-card');
        const cardCount = await blockCards.count();

        console.log(`🔍 Found ${cardCount} block cards in Creador/Contenido`);

        for (let i = 0; i < cardCount; i++) {
          const card = blockCards.nth(i);
          const titleElement = card.locator('.bc-block-title');
          const titleExists = await titleElement.count();

          if (titleExists > 0) {
            const blockTitle = await titleElement.textContent();
            console.log(`   ${i + 1}. "${blockTitle?.trim()}"`);
          }
        }
      } catch (containerError) {
        console.log(`❌ Error checking Creador blocks: ${containerError.message}`);
      }

      // Take screenshots
      await page.screenshot({ path: 'tabs-navigation-debug.png', fullPage: true });
      console.log('📸 Screenshot saved: tabs-navigation-debug.png');

    } catch (error) {
      console.log(`❌ Error in tabs navigation debug: ${error.message}`);
      throw error;
    }
  });
});