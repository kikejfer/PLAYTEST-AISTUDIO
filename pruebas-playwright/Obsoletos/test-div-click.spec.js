const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');
const { selectRole } = require('./utils/creator-blocks-helper');

test.describe('Test Div Click for Role Change', () => {
  test('Test role change with div click', async ({ page }) => {
    console.log('\n🧪 === TESTING DIV CLICK FOR ROLE CHANGE ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      // Check initial role
      const initialRole = await page.locator('#current-role-name').textContent();
      console.log(`📋 Initial role: "${initialRole}"`);

      // Test role change to Profesor using the updated selectRole function
      console.log('\n🔄 Testing role change to Profesor...');
      await selectRole(page, 'Profesor');

      // Check final role
      await page.waitForTimeout(2000);
      const finalRole = await page.locator('#current-role-name').textContent();
      console.log(`📋 Final role: "${finalRole}"`);

      if (finalRole && finalRole.includes('Profesor')) {
        console.log('✅ SUCCESS: Role change to Profesor worked!');
      } else {
        console.log('❌ FAILED: Role did not change to Profesor');
      }

      // Take screenshot
      await page.screenshot({ path: 'div-click-test.png', fullPage: true });
      console.log('📸 Screenshot saved: div-click-test.png');

    } catch (error) {
      console.log(`❌ Error in div click test: ${error.message}`);
      throw error;
    }
  });
});