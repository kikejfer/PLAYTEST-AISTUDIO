const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Debug Role Change Process', () => {
  test('Investigate why role change is not confirmed', async ({ page }) => {
    console.log('\n🔍 === DEBUGGING ROLE CHANGE CONFIRMATION ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      // Step 1: Check initial state
      console.log('\n📋 Step 1: Initial state analysis');
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // Check current role display
      try {
        const currentRoleName = page.locator('#current-role-name');
        const currentRoleExists = await currentRoleName.count();
        console.log(`   #current-role-name exists: ${currentRoleExists > 0 ? 'YES' : 'NO'}`);

        if (currentRoleExists > 0) {
          const currentRoleText = await currentRoleName.textContent();
          console.log(`   Initial role text: "${currentRoleText}"`);
        }
      } catch (error) {
        console.log(`   Error reading current role: ${error.message}`);
      }

      // Step 2: Open role selector and click Profesor
      console.log('\n📋 Step 2: Opening role selector and clicking Profesor');

      await page.waitForSelector('#role-selector-btn', { timeout: 10000 });
      const roleSelectorBtn = page.locator('#role-selector-btn');
      await roleSelectorBtn.click();
      await page.waitForTimeout(1500);
      console.log('✅ Clicked #role-selector-btn');

      await page.waitForSelector('#role-options', { state: 'visible', timeout: 8000 });
      console.log('✅ #role-options is visible');

      // Click on Profesor
      const profesorSpan = page.locator('span:text("Profesor")').first();
      const spanExists = await profesorSpan.count();
      console.log(`   Profesor span exists: ${spanExists > 0 ? 'YES' : 'NO'}`);

      if (spanExists > 0) {
        await profesorSpan.click();
        console.log('✅ Clicked on Profesor span');

        // Step 3: Immediate aftermath analysis
        console.log('\n📋 Step 3: Immediate aftermath (wait 1 second)');
        await page.waitForTimeout(1000);

        // Check if popup appeared
        console.log('🔍 Looking for popup/modal/alert...');

        // Check for various popup types
        const possiblePopups = [
          { name: 'SweetAlert2', selector: '.swal2-container' },
          { name: 'Bootstrap Modal', selector: '.modal.show' },
          { name: 'Dialog', selector: 'dialog[open]' },
          { name: 'Generic Modal', selector: '[role="dialog"]' },
          { name: 'Overlay', selector: '.overlay, .modal-overlay' },
          { name: 'Confirm Dialog', selector: '.confirm-dialog' }
        ];

        let popupFound = false;
        for (const popup of possiblePopups) {
          const exists = await page.locator(popup.selector).count();
          if (exists > 0) {
            console.log(`   ✅ Found ${popup.name}: ${popup.selector}`);
            const popupText = await page.locator(popup.selector).textContent();
            console.log(`   Popup text: "${popupText?.trim()}"`);
            popupFound = true;
          }
        }

        if (!popupFound) {
          console.log('   ❌ No popup/modal found');
        }

        // Check role-options visibility
        const optionsVisible = await page.locator('#role-options').isVisible();
        console.log(`   #role-options still visible: ${optionsVisible}`);

        // Check current role immediately
        try {
          const currentRoleName = page.locator('#current-role-name');
          const currentRoleText = await currentRoleName.textContent();
          console.log(`   Role text after click: "${currentRoleText}"`);
        } catch (error) {
          console.log(`   Error reading role after click: ${error.message}`);
        }

        // Step 4: Extended wait and analysis
        console.log('\n📋 Step 4: Extended analysis (every 2 seconds for 10 seconds)');

        for (let i = 1; i <= 5; i++) {
          await page.waitForTimeout(2000);
          console.log(`\n   --- Check ${i} (after ${i * 2} seconds) ---`);

          // Check current role
          try {
            const currentRoleName = page.locator('#current-role-name');
            const currentRoleText = await currentRoleName.textContent();
            console.log(`   Role text: "${currentRoleText}"`);

            if (currentRoleText && currentRoleText.includes('Profesor')) {
              console.log(`   ✅ ROLE CHANGE CONFIRMED after ${i * 2} seconds!`);
              break;
            }
          } catch (error) {
            console.log(`   Error reading role: ${error.message}`);
          }

          // Check URL changes
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            console.log(`   URL changed to: ${newUrl}`);
          }

          // Check if any tabs appeared
          const tabs = await page.locator('.tab-button, button:has-text("Recursos"), button:has-text("Contenido")').count();
          console.log(`   Tabs found: ${tabs}`);

          // Check page title
          const title = await page.title();
          console.log(`   Page title: "${title}"`);
        }

        // Step 5: Final state analysis
        console.log('\n📋 Step 5: Final state analysis');

        // Take screenshot
        await page.screenshot({ path: 'role-change-debug.png', fullPage: true });
        console.log('📸 Screenshot saved: role-change-debug.png');

        // Check all available tabs/buttons
        console.log('\n🔍 All available buttons containing text:');
        const allButtons = await page.locator('button').all();
        for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
          const button = allButtons[i];
          const buttonText = await button.textContent();
          const visible = await button.isVisible();
          console.log(`   ${i + 1}. "${buttonText?.trim()}" (visible: ${visible})`);
        }

      } else {
        console.log('❌ Profesor span not found');
      }

    } catch (error) {
      console.log(`❌ Error in debug test: ${error.message}`);
      throw error;
    }
  });
});