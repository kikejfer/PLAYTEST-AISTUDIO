const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');
const { selectRole } = require('./utils/creator-blocks-helper');

test.describe('Test Real Popup Confirmation', () => {
  test('Test role change with real popup and detailed block analysis', async ({ page }) => {
    console.log('\n🧪 === TESTING REAL POPUP CONFIRMATION ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Test 1: Profesor role with real popup
      console.log('\n1️⃣ === TESTING PROFESOR ROLE WITH REAL POPUP ===');

      await selectRole(page, 'Profesor');
      console.log('✅ Completed Profesor role change');

      // Wait for panel to fully load
      await page.waitForTimeout(5000);

      // Check what's loaded immediately after role change
      console.log('\n📋 Checking immediate state after Profesor role change...');

      // Look for containers
      const recursosContainer = await page.locator('#recursos-bloques-creados-container').count();
      const contenidoContainer = await page.locator('#bloques-creados-container').count();

      console.log(`📋 recursos-bloques-creados-container found: ${recursosContainer > 0 ? 'YES' : 'NO'}`);
      console.log(`📋 bloques-creados-container found: ${contenidoContainer > 0 ? 'YES' : 'NO'}`);

      // Check current URL and title
      const currentUrl = page.url();
      const currentTitle = await page.title();
      console.log(`📋 Current URL: ${currentUrl}`);
      console.log(`📋 Current title: ${currentTitle}`);

      // Check if we're in the right tab
      const activeTab = await page.locator('.tab-button.active, .active').textContent().catch(() => 'no active tab found');
      console.log(`📋 Active tab: ${activeTab}`);

      // Try to click Recursos tab explicitly
      console.log('\n📋 Clicking Recursos tab explicitly...');
      try {
        const recursosTab = page.locator('button:has-text("📚 Recursos"), button:has-text("Recursos")').first();
        const tabExists = await recursosTab.count();

        if (tabExists > 0) {
          await recursosTab.click();
          await page.waitForTimeout(3000);
          console.log('✅ Clicked Recursos tab');
        } else {
          console.log('❌ Recursos tab not found');
        }
      } catch (tabError) {
        console.log(`❌ Error clicking Recursos tab: ${tabError.message}`);
      }

      // Now check blocks in Profesor panel
      console.log('\n📋 Analyzing blocks in Profesor panel...');
      try {
        await page.waitForSelector('#recursos-bloques-creados-container', { timeout: 10000 });
        const container = page.locator('#recursos-bloques-creados-container');
        const blockCards = container.locator('.bc-block-card');
        const cardCount = await blockCards.count();

        console.log(`🔍 Found ${cardCount} block cards in Profesor/Recursos`);

        // Take screenshot immediately
        await page.screenshot({ path: 'profesor-blocks-state.png', fullPage: true });
        console.log('📸 Screenshot saved: profesor-blocks-state.png');

        // Wait a few seconds and check again
        console.log('\n📋 Waiting 5 seconds and checking again...');
        await page.waitForTimeout(5000);

        const cardCountAfter = await blockCards.count();
        console.log(`🔍 Found ${cardCountAfter} block cards after waiting`);

        // Extract details of each block
        for (let i = 0; i < cardCountAfter; i++) {
          const card = blockCards.nth(i);
          const titleElement = card.locator('.bc-block-title');
          const titleExists = await titleElement.count();

          if (titleExists > 0) {
            const blockTitle = await titleElement.textContent();
            console.log(`   ${i + 1}. "${blockTitle?.trim()}"`);

            // Get block stats
            try {
              const preguntas = await card.locator('span:has(strong:has-text("Preguntas:"))').textContent();
              const temas = await card.locator('span:has(strong:has-text("Temas:"))').textContent();
              const usuarios = await card.locator('span:has(strong:has-text("Usuarios:"))').textContent();

              console.log(`      ${preguntas?.trim()}`);
              console.log(`      ${temas?.trim()}`);
              console.log(`      ${usuarios?.trim()}`);
            } catch (statsError) {
              console.log(`      Stats not readable`);
            }
          }
        }

        // Take another screenshot after waiting
        await page.screenshot({ path: 'profesor-blocks-after-wait.png', fullPage: true });
        console.log('📸 Screenshot saved: profesor-blocks-after-wait.png');

      } catch (containerError) {
        console.log(`❌ Error checking Profesor blocks: ${containerError.message}`);
      }

      // Test 2: Monitor for any automatic changes
      console.log('\n2️⃣ === MONITORING FOR AUTOMATIC CHANGES ===');

      // Set up network monitoring
      const networkRequests = [];
      page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method()
        });
        console.log(`🌐 Request: ${request.method()} ${request.url()}`);
      });

      // Monitor for any DOM changes
      await page.evaluate(() => {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              console.log('DOM changed - nodes added:', mutation.addedNodes.length);
            }
          });
        });

        const container = document.querySelector('#recursos-bloques-creados-container');
        if (container) {
          observer.observe(container, { childList: true, subtree: true });
          console.log('Started monitoring DOM changes in recursos container');
        }
      });

      // Wait and see if anything changes
      console.log('📋 Monitoring for 10 seconds...');
      await page.waitForTimeout(10000);

      console.log(`📋 Network requests during monitoring: ${networkRequests.length}`);
      networkRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.method} ${req.url}`);
      });

    } catch (error) {
      console.log(`❌ Error in real popup test: ${error.message}`);
      throw error;
    }
  });
});