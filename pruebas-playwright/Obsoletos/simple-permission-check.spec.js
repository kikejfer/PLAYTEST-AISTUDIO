const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Simple Permission Check', () => {
  test('Check what permissions kikejfer needs', async ({ page }) => {
    console.log('\n🔍 === SIMPLE PERMISSION CHECK ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');

      // Check token and localStorage
      const tokenInfo = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');

        let parsedToken = null;
        try {
          parsedToken = token ? JSON.parse(token) : null;
        } catch (e) {
          // Token might not be JSON
        }

        // Get all localStorage keys
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          allKeys.push({
            key: key,
            value: localStorage.getItem(key)
          });
        }

        return {
          hasToken: !!token,
          tokenRaw: token,
          tokenParsed: parsedToken,
          activeRole: activeRole,
          allLocalStorage: allKeys
        };
      });

      console.log('📋 TOKEN INFORMATION:');
      console.log(`   Has token: ${tokenInfo.hasToken}`);
      console.log(`   Active role: ${tokenInfo.activeRole}`);

      if (tokenInfo.tokenParsed) {
        console.log(`   Token data: ${JSON.stringify(tokenInfo.tokenParsed, null, 2)}`);
      } else {
        console.log(`   Raw token: ${tokenInfo.tokenRaw}`);
      }

      console.log('📋 ALL LOCALSTORAGE:');
      tokenInfo.allLocalStorage.forEach(item => {
        console.log(`   ${item.key}: ${item.value}`);
      });

      // Test role change to see what happens
      console.log('\n📋 TESTING ROLE CHANGE:');

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // Monitor localStorage changes
      await page.evaluate(() => {
        window.localStorageChanges = [];
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          window.localStorageChanges.push({
            timestamp: Date.now(),
            key: key,
            oldValue: localStorage.getItem(key),
            newValue: value
          });
          console.log(`📦 localStorage.setItem: ${key} = ${value}`);
          return originalSetItem.call(this, key, value);
        };
      });

      // Execute changeRole
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
      try {
        await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
        console.log('✅ Successfully navigated to Profesor panel');
      } catch (e) {
        console.log(`❌ Navigation failed: ${e.message}`);
      }

      // Check what changed in localStorage
      const afterChanges = await page.evaluate(() => {
        return window.localStorageChanges || [];
      });

      console.log(`📋 localStorage changes during role change: ${afterChanges.length}`);
      afterChanges.forEach((change, i) => {
        const timeOffset = change.timestamp - beforeChange;
        console.log(`   ${i + 1}. [+${timeOffset}ms] ${change.key}: "${change.oldValue}" → "${change.newValue}"`);
      });

      // Monitor for automatic changes for 3 seconds
      console.log('\n📋 MONITORING FOR AUTOMATIC CHANGES (3 seconds)...');

      await page.evaluate(() => {
        window.automaticChanges = [];
        const monitorStart = Date.now();

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          window.automaticChanges.push({
            timestamp: Date.now() - monitorStart,
            key: key,
            value: value,
            caller: new Error().stack.split('\n')[2]?.trim()
          });
          console.log(`🔄 [+${Date.now() - monitorStart}ms] Automatic change: ${key} = ${value}`);
          return originalSetItem.call(this, key, value);
        };
      });

      await page.waitForTimeout(3000);

      const automaticChanges = await page.evaluate(() => {
        return window.automaticChanges || [];
      });

      console.log(`📋 Automatic changes detected: ${automaticChanges.length}`);
      automaticChanges.forEach((change, i) => {
        console.log(`   ${i + 1}. [+${change.timestamp}ms] ${change.key} = ${change.value}`);
        if (change.caller) {
          console.log(`      Called from: ${change.caller}`);
        }
      });

      // Check blocks in current state
      const blocksInfo = await page.evaluate(() => {
        const recursosContainer = document.querySelector('#recursos-bloques-creados-container');
        const contenidoContainer = document.querySelector('#bloques-creados-container');

        return {
          url: window.location.href,
          activeRole: localStorage.getItem('activeRole'),
          recursosBlocks: recursosContainer ?
            Array.from(recursosContainer.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : [],
          contenidoBlocks: contenidoContainer ?
            Array.from(contenidoContainer.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : []
        };
      });

      console.log('\n📋 CURRENT STATE:');
      console.log(`   URL: ${blocksInfo.url}`);
      console.log(`   Active role: ${blocksInfo.activeRole}`);
      console.log(`   Recursos blocks: ${blocksInfo.recursosBlocks.length}`);
      blocksInfo.recursosBlocks.forEach((title, i) => {
        console.log(`      ${i + 1}. "${title}"`);
      });

      if (blocksInfo.contenidoBlocks.length > 0) {
        console.log(`   Contenido blocks: ${blocksInfo.contenidoBlocks.length}`);
        blocksInfo.contenidoBlocks.forEach((title, i) => {
          console.log(`      ${i + 1}. "${title}"`);
        });
      }

      // Final analysis
      console.log('\n📋 ANALYSIS:');

      const hasAutomaticRoleChange = automaticChanges.some(change =>
        change.key === 'activeRole' && change.value !== 'PPF'
      );

      if (hasAutomaticRoleChange) {
        console.log('   ❌ Automatic role change detected - this causes incorrect blocks');
        const roleChange = automaticChanges.find(change =>
          change.key === 'activeRole' && change.value !== 'PPF'
        );
        console.log(`   ⚠️ Role automatically changed to: ${roleChange.value} at +${roleChange.timestamp}ms`);
      } else {
        console.log('   ✅ No automatic role changes detected');
      }

      const expectedProfessorBlock = "Constitución Española 1978";
      const hasCorrectBlock = blocksInfo.recursosBlocks.includes(expectedProfessorBlock);

      if (hasCorrectBlock && blocksInfo.recursosBlocks.length === 1) {
        console.log('   ✅ Showing correct Profesor block only');
      } else if (hasCorrectBlock && blocksInfo.recursosBlocks.length > 1) {
        console.log('   ⚠️ Has correct Profesor block but also shows extra blocks');
      } else {
        console.log('   ❌ Not showing correct Profesor block');
      }

      console.log('\n📋 RECOMMENDATION:');
      if (hasAutomaticRoleChange) {
        console.log('   🎯 Need to prevent automatic role switching');
        console.log('   💡 This likely requires admin privileges or role management permissions');
        console.log('   💡 Solution: Extract blocks within first 500ms before automatic change');
      } else {
        console.log('   🤔 No automatic role change - issue may be elsewhere');
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      throw error;
    }
  });
});