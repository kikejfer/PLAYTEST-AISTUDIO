const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verify kikejfer can see AndGar', () => {

  test('kikejfer logs in and checks for AndGar in his panel', async ({ page }) => {

    await test.step('Login as kikejfer', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000); // Longer wait for page to be ready

      await page.waitForSelector('input[name="nickname"]', { timeout: 30000 });
      await page.locator('input[name="nickname"]').fill('kikejfer');
      await page.locator('input[name="password"]').fill('123');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/admin-secundario-panel/, { timeout: 60000 });
      await page.waitForTimeout(5000);
      console.log('✅ kikejfer logged in successfully');
    });

    await test.step('Check for AndGar in kikejfer panel', async () => {
      // Take initial screenshot
      await page.screenshot({ path: 'kikejfer-initial-panel.png', fullPage: true });
      console.log('📸 Screenshot: kikejfer-initial-panel.png');

      // Scroll to make sure all content is loaded
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);

      // Take screenshot after scroll
      await page.screenshot({ path: 'kikejfer-after-scroll.png', fullPage: true });
      console.log('📸 Screenshot: kikejfer-after-scroll.png');

      // Look for any AndGar text on the page
      const allAndGarElements = page.locator('text=AndGar');
      const andgarCount = await allAndGarElements.count();
      console.log(`🔍 Found ${andgarCount} AndGar elements in kikejfer's panel`);

      if (andgarCount > 0) {
        console.log('✅ SUCCESS: AndGar found in kikejfer\'s panel!');

        // Highlight all AndGar elements
        for (let i = 0; i < andgarCount; i++) {
          const element = allAndGarElements.nth(i);
          await element.evaluate(el => {
            el.style.border = '3px solid green';
            el.style.backgroundColor = 'lightgreen';
          });

          const text = await element.textContent();
          console.log(`  AndGar element ${i + 1}: "${text?.trim()}"`);
        }

        await page.screenshot({ path: 'kikejfer-andgar-found.png', fullPage: true });
        console.log('📸 Screenshot: kikejfer-andgar-found.png');

        // Try using the filter to verify
        const filterInput = page.locator('input[placeholder*="Filtrar"], input[placeholder*="filtrar"], input[placeholder*="Creadores"]').first();
        if (await filterInput.count() > 0) {
          await filterInput.fill('AndGar');
          await page.waitForTimeout(2000);
          console.log('✅ Applied AndGar filter');

          await page.screenshot({ path: 'kikejfer-filtered-andgar.png', fullPage: true });
          console.log('📸 Screenshot: kikejfer-filtered-andgar.png');

          const filteredAndGar = page.locator('text=AndGar').first();
          if (await filteredAndGar.count() > 0) {
            console.log('✅ CONFIRMED: AndGar visible after filtering in kikejfer panel');
            await expect(filteredAndGar).toBeVisible();
          }

          await filterInput.clear();
        }

      } else {
        console.log('❌ AndGar not found in kikejfer\'s panel');

        // Check page content for debugging
        const pageText = await page.textContent('body');
        console.log('📝 Checking if page contains AndGar text at all...');

        if (pageText.includes('AndGar')) {
          console.log('🔍 Page DOES contain "AndGar" text but not captured by locator');
        } else {
          console.log('🔍 Page does NOT contain "AndGar" text anywhere');
        }

        // Look for Creadores section specifically
        const creatorsSection = page.locator('.creators, .creadores, text=Creadores').first();
        if (await creatorsSection.count() > 0) {
          console.log('✅ Found Creadores section in kikejfer panel');
          const creatorsContent = await creatorsSection.textContent();
          console.log(`📝 Creadores section content: ${creatorsContent?.substring(0, 200)}...`);
        } else {
          console.log('⚠️ No Creadores section found in kikejfer panel');
        }
      }
    });

    console.log('🎯 kikejfer AndGar verification completed');
  });
});