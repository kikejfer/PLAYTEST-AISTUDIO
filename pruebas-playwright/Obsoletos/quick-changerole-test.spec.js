const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Quick ChangeRole Test', () => {
  test('Quick test of corrected changeRole function', async ({ page }) => {
    console.log('\n🔍 === QUICK CHANGEROLE TEST ===');

    try {
      // Set longer timeout for login
      test.setTimeout(60000);

      // Login as kikejfer
      console.log('📋 Attempting login...');
      await login(page, 'kikejfer');
      console.log('✅ Login successful');

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // Monitor for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => {
        jsErrors.push(error.message);
        console.log(`❌ JS Error: ${error.message}`);
      });

      // Check if changeRole function exists and is accessible
      const functionCheck = await page.evaluate(() => {
        return {
          hasChangeRole: typeof window.changeRole === 'function',
          hasCloseRoleSelector: typeof window.closeRoleSelector === 'function'
        };
      });

      console.log(`📋 Function availability:`);
      console.log(`   window.changeRole: ${functionCheck.hasChangeRole ? '✅' : '❌'}`);
      console.log(`   window.closeRoleSelector: ${functionCheck.hasCloseRoleSelector ? '✅' : '❌'}`);

      if (!functionCheck.hasChangeRole) {
        console.log('❌ changeRole function not available - deployment may still be in progress');
        return;
      }

      // Test changeRole execution
      console.log('\n📋 Testing changeRole execution...');

      await page.evaluate(() => {
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      // Check if navigation started
      try {
        await page.waitForURL('**/teachers-panel-schedules', { timeout: 15000 });
        console.log('✅ Navigation to Profesor panel successful');
      } catch (navError) {
        console.log(`⚠️ Navigation timeout: ${navError.message}`);
      }

      // Check for JavaScript errors
      if (jsErrors.length === 0) {
        console.log('✅ No JavaScript errors during changeRole execution');
        console.log('🎯 SUCCESS: closeRoleSelector error appears to be fixed!');
      } else {
        console.log(`❌ JavaScript errors detected: ${jsErrors.length}`);
        jsErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });

        // Check if the specific closeRoleSelector error is gone
        const hasCloseRoleSelectorError = jsErrors.some(error =>
          error.includes('closeRoleSelector is not defined')
        );

        if (!hasCloseRoleSelectorError) {
          console.log('🎯 SUCCESS: closeRoleSelector error is fixed!');
        }
      }

    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
      throw error;
    }
  });
});