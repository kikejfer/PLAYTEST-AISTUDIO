const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Debug Kikejfer Access', () => {

  test('Check kikejfer teachers panel access', async ({ page }) => {
    console.log('🔍 CHECKING KIKEJFER ACCESS TO TEACHERS PANEL');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    console.log('🔄 Going to teachers panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check if page loaded correctly
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);

    // Check if role selector exists
    const roleSelector = await page.locator('#role-selector-btn').count();
    console.log(`🎯 Role selector button found: ${roleSelector > 0 ? 'YES' : 'NO'}`);

    if (roleSelector === 0) {
      // Check what's actually on the page
      console.log('🔍 Looking for any role-related elements...');

      const roleElements = await page.locator('[id*="role"], [class*="role"]').count();
      console.log(`📊 Elements with 'role' in id/class: ${roleElements}`);

      // Check for any buttons or selectors
      const buttons = await page.locator('button').count();
      console.log(`🔘 Total buttons found: ${buttons}`);

      // Check page content
      const pageContent = await page.content();
      console.log(`📝 Page contains "rol": ${pageContent.includes('rol') || pageContent.includes('role') ? 'YES' : 'NO'}`);

      // Check if user is properly logged in
      const userInfo = await page.locator('#user-name, .user-name, [id*="user"], [class*="user"]').first().textContent().catch(() => 'Not found');
      console.log(`👤 User info: "${userInfo}"`);
    } else {
      console.log('✅ Role selector found, checking current role...');
      const currentRole = await page.locator('#current-role-name').textContent().catch(() => 'Not found');
      console.log(`📋 Current role: "${currentRole}"`);
    }

    console.log('✅ DEBUG COMPLETED');
  });

});