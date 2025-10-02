const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Show Role Selector Visual Debug', () => {

  test('Show where role selector should be and try to find it', async ({ page }) => {
    console.log('🔄 STEP 1: Login as Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    console.log('🔄 STEP 2: Navigate to teachers panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('🔍 STEP 3: Looking for header container...');
    const headerContainer = page.locator('#header-container');
    const headerExists = await headerContainer.count();

    if (headerExists > 0) {
      console.log('✅ Found #header-container');

      // Highlight header container
      await headerContainer.evaluate(element => {
        element.style.border = '5px solid red';
        element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      });

      console.log('🔍 STEP 4: Looking for .user-header...');
      const userHeader = headerContainer.locator('.user-header');
      const userHeaderExists = await userHeader.count();

      if (userHeaderExists > 0) {
        console.log('✅ Found .user-header');

        // Highlight user header
        await userHeader.evaluate(element => {
          element.style.border = '3px solid blue';
          element.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        });

        console.log('🔍 STEP 5: Looking for .display...');
        const display = userHeader.locator('.display');
        const displayExists = await display.count();

        if (displayExists > 0) {
          console.log('✅ Found .display');

          // Highlight display
          await display.evaluate(element => {
            element.style.border = '3px solid green';
            element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
          });

          console.log('🔍 STEP 6: Looking for role selector elements...');

          // Try different possible selectors
          const possibleSelectors = [
            '.role-selector-container',
            '.role-selector-dropdown',
            '.role-options',
            '[class*="role"]',
            '[id*="role"]'
          ];

          for (const selector of possibleSelectors) {
            const element = display.locator(selector);
            const elementExists = await element.count();

            console.log(`🔍 Checking ${selector}: ${elementExists > 0 ? '✅ Found' : '❌ Not found'}`);

            if (elementExists > 0) {
              // Highlight found element
              await element.evaluate((el, sel) => {
                el.style.border = '3px solid orange';
                el.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
                el.title = `Found: ${sel}`;
              }, selector);
            }
          }

        } else {
          console.log('❌ .display not found in .user-header');
        }

      } else {
        console.log('❌ .user-header not found in #header-container');
      }

    } else {
      console.log('❌ #header-container not found');
    }

    console.log('🔍 STEP 7: Looking for ANY role-related elements anywhere on page...');

    const anyRoleElements = await page.locator('[class*="role"], [id*="role"]').all();
    console.log(`📋 Found ${anyRoleElements.length} elements with 'role' in class or id`);

    for (let i = 0; i < anyRoleElements.length; i++) {
      const element = anyRoleElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class') || '';
      const id = await element.getAttribute('id') || '';

      console.log(`  ${i+1}. <${tagName.toLowerCase()}> class="${className}" id="${id}"`);

      // Highlight each role-related element
      await element.evaluate((el, index) => {
        el.style.border = '2px dashed purple';
        el.style.backgroundColor = 'rgba(128, 0, 128, 0.1)';
        el.title = `Role element #${index + 1}`;
      }, i);
    }

    console.log('⏸️ PAUSE: Page is ready for inspection. Look for:');
    console.log('  🔴 Red border: #header-container');
    console.log('  🔵 Blue border: .user-header');
    console.log('  🟢 Green border: .display');
    console.log('  🟠 Orange border: Found role selector elements');
    console.log('  🟣 Purple dashed border: All role-related elements');

    // Wait 60 seconds for inspection
    await page.waitForTimeout(60000);
  });

});