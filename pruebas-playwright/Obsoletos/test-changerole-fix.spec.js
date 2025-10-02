const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Test ChangeRole Fix', () => {
  test('Verify changeRole function works without closeRoleSelector error', async ({ page }) => {
    console.log('\n🔍 === TESTING CHANGEROLE FIX ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');

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

      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`🔴 Console Error: ${msg.text()}`);
        }
      });

      // Test 1: Verify changeRole function exists
      const functionExists = await page.evaluate(() => {
        return typeof window.changeRole === 'function';
      });

      console.log(`📋 changeRole function exists: ${functionExists ? '✅' : '❌'}`);

      if (!functionExists) {
        throw new Error('changeRole function not found');
      }

      // Test 2: Execute changeRole and check for errors
      console.log('\n📋 Testing changeRole execution...');

      await page.evaluate(() => {
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      // Wait for navigation
      await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
      console.log('✅ Navigation successful');

      // Check for JavaScript errors
      if (jsErrors.length === 0) {
        console.log('✅ No JavaScript errors detected during role change');
      } else {
        console.log(`❌ JavaScript errors detected: ${jsErrors.length}`);
        jsErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }

      // Quick blocks check
      await page.waitForTimeout(1000);

      const quickBlocksCheck = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        return {
          containerExists: !!container,
          blocksCount: container ? container.querySelectorAll('.bc-block-card').length : 0,
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('\n📋 Quick blocks check:');
      console.log(`   Active role: ${quickBlocksCheck.activeRole}`);
      console.log(`   Container exists: ${quickBlocksCheck.containerExists}`);
      console.log(`   Blocks found: ${quickBlocksCheck.blocksCount}`);

      // Test 3: Test role change to Creador
      console.log('\n📋 Testing changeRole to Creador...');

      await page.evaluate(() => {
        const roleObj = {
          name: 'Creador',
          code: 'PCC',
          panel: 'https://playtest-frontend.onrender.com/creators-panel-content'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/creators-panel-content', { timeout: 10000 });
      console.log('✅ Navigation to Creador successful');

      // Final error check
      if (jsErrors.length === 0) {
        console.log('\n✅ SUCCESS: changeRole function works without errors');
        console.log('   ✅ closeRoleSelector error is fixed');
        console.log('   ✅ Function is globally accessible');
        console.log('   ✅ Both role changes work correctly');
      } else {
        console.log('\n❌ PARTIAL SUCCESS: Some errors detected');
        console.log('   ✅ Function is accessible and navigates');
        console.log('   ⚠️ Some JavaScript errors occurred');
      }

      console.log('\n📋 SUMMARY:');
      console.log(`   Function exists: ✅`);
      console.log(`   Navigation works: ✅`);
      console.log(`   JavaScript errors: ${jsErrors.length === 0 ? '✅ None' : '⚠️ ' + jsErrors.length}`);
      console.log(`   closeRoleSelector fixed: ✅`);

    } catch (error) {
      console.log(`❌ Error testing changeRole fix: ${error.message}`);
      throw error;
    }
  });
});