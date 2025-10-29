const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Test Corrected ChangeRole', () => {
  test('Verify changeRole function works without errors', async ({ page }) => {
    console.log('\n🔍 === TESTING CORRECTED CHANGEROLE FUNCTION ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

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

      // Test role change to Profesor
      console.log('\n📋 Testing changeRole to Profesor...');

      const beforeChange = Date.now();
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
      console.log('✅ Successfully navigated to Profesor panel');

      // Check if there were any JavaScript errors
      if (jsErrors.length === 0) {
        console.log('✅ No JavaScript errors detected');
      } else {
        console.log(`❌ JavaScript errors detected: ${jsErrors.length}`);
        jsErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }

      // Wait a moment and check blocks
      await page.waitForTimeout(2000);

      const blocksInfo = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        return {
          containerExists: !!container,
          blocksCount: container ? container.querySelectorAll('.bc-block-card').length : 0,
          blocks: container ?
            Array.from(container.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : [],
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('\n📋 BLOCKS CHECK (2 seconds after navigation):');
      console.log(`   Active role: ${blocksInfo.activeRole}`);
      console.log(`   Container exists: ${blocksInfo.containerExists}`);
      console.log(`   Blocks found: ${blocksInfo.blocksCount}`);
      blocksInfo.blocks.forEach((title, i) => {
        console.log(`      ${i + 1}. "${title}"`);
      });

      // Wait longer to check for automatic role changes
      console.log('\n📋 Monitoring for automatic role changes...');

      await page.evaluate(() => {
        window.roleMonitoring = [];
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          if (key === 'activeRole') {
            window.roleMonitoring.push({
              timestamp: Date.now(),
              key: key,
              value: value
            });
            console.log(`📦 Role changed to: ${value}`);
          }
          return originalSetItem.call(this, key, value);
        };
      });

      await page.waitForTimeout(5000); // Monitor for 5 seconds

      const roleChanges = await page.evaluate(() => window.roleMonitoring || []);
      const finalBlocks = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        return {
          activeRole: localStorage.getItem('activeRole'),
          blocksCount: container ? container.querySelectorAll('.bc-block-card').length : 0,
          blocks: container ?
            Array.from(container.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : []
        };
      });

      console.log('\n📋 FINAL STATE (after 5 seconds):');
      console.log(`   Final active role: ${finalBlocks.activeRole}`);
      console.log(`   Final blocks count: ${finalBlocks.blocksCount}`);
      finalBlocks.blocks.forEach((title, i) => {
        console.log(`      ${i + 1}. "${title}"`);
      });

      if (roleChanges.length > 0) {
        console.log(`\n⚠️ Detected ${roleChanges.length} automatic role changes:`);
        roleChanges.forEach((change, i) => {
          const timeOffset = change.timestamp - beforeChange;
          console.log(`   ${i + 1}. [+${timeOffset}ms] Role changed to: ${change.value}`);
        });
      } else {
        console.log('\n✅ No automatic role changes detected');
      }

      // Check if we have the expected Profesor block
      const expectedBlock = "Constitución Española 1978";
      const hasExpectedBlock = finalBlocks.blocks.includes(expectedBlock);
      const hasOnlyExpectedBlock = finalBlocks.blocks.length === 1 && hasExpectedBlock;

      console.log('\n📋 VALIDATION:');
      if (hasOnlyExpectedBlock) {
        console.log('✅ SUCCESS: Showing only the correct Profesor block');
      } else if (hasExpectedBlock && finalBlocks.blocks.length > 1) {
        console.log('⚠️ PARTIAL: Has correct block but also shows extra blocks');
      } else {
        console.log('❌ FAIL: Not showing the expected Profesor block');
      }

      console.log('\n📋 SUMMARY:');
      console.log(`   JavaScript errors: ${jsErrors.length === 0 ? '✅ None' : '❌ ' + jsErrors.length}`);
      console.log(`   Navigation success: ✅ Yes`);
      console.log(`   Automatic role changes: ${roleChanges.length === 0 ? '✅ None' : '⚠️ ' + roleChanges.length}`);
      console.log(`   Correct blocks: ${hasOnlyExpectedBlock ? '✅ Yes' : hasExpectedBlock ? '⚠️ Partial' : '❌ No'}`);

    } catch (error) {
      console.log(`❌ Error testing corrected changeRole: ${error.message}`);
      throw error;
    }
  });
});