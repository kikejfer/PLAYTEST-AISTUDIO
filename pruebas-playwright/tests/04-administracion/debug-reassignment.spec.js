const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Debug Reassignment Process', () => {

  test('Complete reassignment process with detailed debugging', async ({ page }) => {

    await test.step('STEP 1: AdminPrincipal reassigns AndGar to kikejfer', async () => {
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

      // Take screenshot before reassignment
      await page.screenshot({ path: 'before-reassignment.png', fullPage: true });
      console.log('📸 Screenshot: before-reassignment.png');

      // Find filter and filter for AndGar
      const filterInput = page.locator('input[placeholder*="Filtrar"], input[placeholder*="filtrar"], input[placeholder*="Creadores"], input[name*="filter"], input[name*="search"]').first();

      if (await filterInput.count() > 0) {
        await filterInput.fill('AndGar');
        await page.waitForTimeout(2000);
        console.log('✅ Filtered for AndGar');

        // Take screenshot after filtering
        await page.screenshot({ path: 'after-filter-andgar.png', fullPage: true });
        console.log('📸 Screenshot: after-filter-andgar.png');

        const andgarRow = page.locator('text=AndGar').first();
        if (await andgarRow.count() > 0) {
          console.log('✅ Found AndGar after filtering');

          // Find dropdown and change to kikejfer
          const adminDropdown = page.locator('select[name="admin"], select[name="administrador"], .admin-select, select').first();

          if (await adminDropdown.count() > 0) {
            // Check current value
            const currentValue = await adminDropdown.inputValue();
            console.log(`📋 Current admin value: ${currentValue}`);

            // Change to kikejfer using JavaScript
            await adminDropdown.evaluate((select) => {
              const options = Array.from(select.options);
              const kikejferOption = options.find(option =>
                option.text.includes('kikejfer') || option.value.includes('kikejfer')
              );

              if (kikejferOption) {
                select.value = kikejferOption.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
              return false;
            });

            await page.waitForTimeout(2000);
            console.log('✅ Changed admin to kikejfer');

            // Take screenshot after reassignment
            await page.screenshot({ path: 'after-reassignment.png', fullPage: true });
            console.log('📸 Screenshot: after-reassignment.png');

            // Check if value changed
            const newValue = await adminDropdown.inputValue();
            console.log(`📋 New admin value: ${newValue}`);
          }
        }

        await filterInput.clear();
        await page.waitForTimeout(1000);
      }

      // Logout AdminPrincipal
      const logoutButton = page.locator('button:has-text("Cerrar Sesión"), a:has-text("Logout"), .logout').first();
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ AdminPrincipal logged out');
      }
    });

    await test.step('STEP 2: kikejfer verifies AndGar assignment', async () => {
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

      // Take screenshot of kikejfer panel
      await page.screenshot({ path: 'kikejfer-panel-initial.png', fullPage: true });
      console.log('📸 Screenshot: kikejfer-panel-initial.png');

      // Scroll to Creadores section
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);

      // Take screenshot after scroll
      await page.screenshot({ path: 'kikejfer-panel-after-scroll.png', fullPage: true });
      console.log('📸 Screenshot: kikejfer-panel-after-scroll.png');

      // Try to find AndGar in kikejfer's panel
      const filterInput = page.locator('input[placeholder*="Filtrar"], input[placeholder*="filtrar"], input[placeholder*="Creadores"], input[name*="filter"], input[name*="search"]').first();

      if (await filterInput.count() > 0) {
        await filterInput.fill('AndGar');
        await page.waitForTimeout(2000);
        console.log('✅ Applied AndGar filter in kikejfer panel');

        // Take screenshot after filtering
        await page.screenshot({ path: 'kikejfer-filtered-andgar.png', fullPage: true });
        console.log('📸 Screenshot: kikejfer-filtered-andgar.png');

        const andgarInKikejfer = page.locator('text=AndGar').first();
        const andgarCount = await andgarInKikejfer.count();
        console.log(`🔍 AndGar elements found in kikejfer panel: ${andgarCount}`);

        if (andgarCount > 0) {
          console.log('✅ SUCCESS: AndGar found in kikejfer panel');
          await expect(andgarInKikejfer).toBeVisible();
        } else {
          console.log('❌ ISSUE: AndGar not found in kikejfer panel');

          // Additional debugging - check all text content
          const pageContent = await page.textContent('body');
          const hasAndGar = pageContent.includes('AndGar');
          console.log(`🔍 Page contains "AndGar" text: ${hasAndGar}`);
        }

        await filterInput.clear();
      } else {
        console.log('⚠️ No filter input found in kikejfer panel');

        // Just search for AndGar anywhere
        const andgarElements = page.locator('text=AndGar');
        const count = await andgarElements.count();
        console.log(`🔍 Total AndGar elements in kikejfer panel: ${count}`);
      }
    });

    console.log('🎯 Complete reassignment debug completed');
  });
});