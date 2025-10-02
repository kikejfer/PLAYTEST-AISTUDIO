const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Find Role Selector', () => {

  test('Search for role selector in different pages', async ({ page }) => {
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    const pagesToCheck = [
      '',  // Root / dashboard
      '/index.html',
      '/creators-panel-content.html',
      '/teachers-panel-schedules.html'
    ];

    for (const pagePath of pagesToCheck) {
      console.log(`\n🔍 Checking page: ${BASE_URL}${pagePath}`);

      try {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for role selector container
        const roleSelectorExists = await page.locator('#rol-selector-container').count();
        const roleOptionsExists = await page.locator('#role-options').count();

        console.log(`  📦 #rol-selector-container: ${roleSelectorExists > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`  📋 #role-options: ${roleOptionsExists > 0 ? '✅ Found' : '❌ Not found'}`);

        if (roleSelectorExists > 0) {
          console.log(`  🎯 ROLE SELECTOR FOUND IN: ${BASE_URL}${pagePath}`);

          // Take screenshot
          await page.screenshot({
            path: `role-selector-found-${pagePath.replace('/', '_') || 'root'}.png`,
            fullPage: true
          });
          break;
        }

      } catch (error) {
        console.log(`  ❌ Error checking ${pagePath}: ${error.message}`);
      }
    }
  });

});