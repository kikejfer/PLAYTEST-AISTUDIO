const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verify Reassignment Persistence', () => {

  test('Check if reassignment persists across sessions', async ({ page }) => {

    await test.step('AdminPrincipal checks current state', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[name="nickname"]', { timeout: 30000 });
      await page.locator('input[name="nickname"]').fill('AdminPrincipal');
      await page.locator('input[name="password"]').fill('kikejfer');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/admin-principal-panel/, { timeout: 60000 });
      await page.waitForTimeout(5000);
      console.log('✅ AdminPrincipal logged in successfully');

      // Scroll to Creadores section
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({ path: 'admin-check-current-state.png', fullPage: true });
      console.log('📸 Screenshot: admin-check-current-state.png');

      // Filter for AndGar
      const filterInput = page.locator('input[placeholder*="Filtrar"], input[placeholder*="filtrar"], input[placeholder*="Creadores"]').first();

      if (await filterInput.count() > 0) {
        await filterInput.fill('AndGar');
        await page.waitForTimeout(2000);
        console.log('✅ Applied AndGar filter');

        await page.screenshot({ path: 'admin-andgar-filtered-check.png', fullPage: true });
        console.log('📸 Screenshot: admin-andgar-filtered-check.png');

        const andgarRow = page.locator('text=AndGar').first();
        if (await andgarRow.count() > 0) {
          console.log('✅ AndGar still visible in AdminPrincipal panel');

          // Check the current admin assignment
          const adminDropdown = page.locator('select[name="admin"], select[name="administrador"], .admin-select, select').first();
          if (await adminDropdown.count() > 0) {
            const currentValue = await adminDropdown.inputValue();
            console.log(`📋 Current admin assignment value: ${currentValue}`);

            // Get the text of selected option
            const selectedOptionText = await adminDropdown.locator('option:checked').textContent();
            console.log(`📋 Current admin assignment text: ${selectedOptionText}`);

            if (currentValue === '10' || selectedOptionText?.includes('kikejfer')) {
              console.log('✅ CONFIRMED: AndGar is assigned to kikejfer (value: 10)');
            } else {
              console.log(`⚠️ AndGar assignment unclear - value: ${currentValue}, text: ${selectedOptionText}`);
            }
          }
        } else {
          console.log('❌ AndGar not found in AdminPrincipal panel - reassignment may have worked');
        }

        await filterInput.clear();
      }

      // Logout AdminPrincipal
      const logoutButton = page.locator('button:has-text("Cerrar Sesión"), a:has-text("Logout"), .logout').first();
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ AdminPrincipal logged out');
      }
    });

    await test.step('Wait and then check kikejfer panel', async () => {
      // Add a longer wait to allow for potential database sync
      console.log('⏳ Waiting 10 seconds for potential database sync...');
      await page.waitForTimeout(10000);

      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[name="nickname"]', { timeout: 30000 });
      await page.locator('input[name="nickname"]').fill('kikejfer');
      await page.locator('input[name="password"]').fill('123');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/admin-secundario-panel/, { timeout: 60000 });
      await page.waitForTimeout(5000);
      console.log('✅ kikejfer logged in successfully');

      // Scroll to Creadores section
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'kikejfer-check-after-wait.png', fullPage: true });
      console.log('📸 Screenshot: kikejfer-check-after-wait.png');

      // Check for AndGar in kikejfer panel
      const allAndGarElements = page.locator('text=AndGar');
      const andgarCount = await allAndGarElements.count();
      console.log(`🔍 AndGar elements in kikejfer panel: ${andgarCount}`);

      if (andgarCount > 0) {
        console.log('✅ SUCCESS: AndGar now appears in kikejfer panel after wait!');

        await page.screenshot({ path: 'kikejfer-andgar-success.png', fullPage: true });
        console.log('📸 Screenshot: kikejfer-andgar-success.png');
      } else {
        console.log('❌ AndGar still not in kikejfer panel even after wait');

        // Check if there's any Creadores content at all
        const pageContent = await page.textContent('body');
        console.log(`📝 Total page content length: ${pageContent.length} characters`);

        if (pageContent.toLowerCase().includes('creador')) {
          console.log('✅ Page contains "creador" related content');
        } else {
          console.log('⚠️ Page may not have Creadores section loaded');
        }
      }
    });

    console.log('🎯 Reassignment persistence check completed');
  });
});