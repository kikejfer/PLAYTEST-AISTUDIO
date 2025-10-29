const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Quick Role Selector Test', () => {

  test('Test role selector in header container', async ({ page }) => {
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Go to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check header container
    console.log('🔍 Checking header container...');
    const headerExists = await page.locator('#header-container').count();
    console.log(`📦 #header-container: ${headerExists > 0 ? '✅ Found' : '❌ Not found'}`);

    // Check role selector inside header
    const roleSelectorExists = await page.locator('#header-container #rol-selector-container').count();
    console.log(`📋 #rol-selector-container inside header: ${roleSelectorExists > 0 ? '✅ Found' : '❌ Not found'}`);

    if (roleSelectorExists > 0) {
      console.log('🔄 Trying to click role selector...');

      // Make sure it's visible
      await page.locator('#header-container #rol-selector-container').waitFor({ state: 'visible', timeout: 5000 });

      // Click to open dropdown
      await page.locator('#header-container #rol-selector-container').click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked role selector');

      // Check for role options
      const roleOptionsExists = await page.locator('#role-options').count();
      console.log(`📋 #role-options after click: ${roleOptionsExists > 0 ? '✅ Found' : '❌ Not found'}`);

      if (roleOptionsExists > 0) {
        // Look for Profesor option
        const profesorOptions = await page.locator('#role-options').textContent();
        console.log(`📝 Available options: "${profesorOptions}"`);
      }
    }

    // Take screenshot
    await page.screenshot({
      path: `header-role-selector-debug.png`,
      fullPage: true
    });
  });

});