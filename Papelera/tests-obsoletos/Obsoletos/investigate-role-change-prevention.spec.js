const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Investigate Role Change Prevention', () => {
  test('Study how to prevent automatic role changes', async ({ page }) => {
    console.log('\n🔍 === INVESTIGATING ROLE CHANGE PREVENTION ===');

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

      // 1. Analyze the localStorage and session handling
      console.log('\n1️⃣ === ANALYZING LOCALSTORAGE AND SESSION HANDLING ===');

      const initialState = await page.evaluate(() => {
        return {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          tokenRoles: localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).roles : null,
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('📋 Initial state:');
      console.log(`   activeRole: ${initialState.activeRole}`);
      console.log(`   tokenRoles: ${JSON.stringify(initialState.tokenRoles)}`);

      // 2. Navigate to Profesor panel and monitor localStorage changes
      console.log('\n2️⃣ === MONITORING LOCALSTORAGE CHANGES DURING ROLE CHANGE ===');

      // Set up localStorage monitoring
      await page.evaluate(() => {
        window.localStorageChanges = [];

        // Override localStorage setItem to track changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          window.localStorageChanges.push({
            timestamp: Date.now(),
            action: 'setItem',
            key: key,
            value: value,
            caller: new Error().stack.split('\n')[2]?.trim()
          });
          console.log(`📦 localStorage.setItem: ${key} = ${value}`);
          return originalSetItem.call(this, key, value);
        };

        // Override localStorage getItem to track reads
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = function(key) {
          const value = originalGetItem.call(this, key);
          if (key === 'activeRole' || key === 'token') {
            window.localStorageChanges.push({
              timestamp: Date.now(),
              action: 'getItem',
              key: key,
              value: value,
              caller: new Error().stack.split('\n')[2]?.trim()
            });
            console.log(`📦 localStorage.getItem: ${key} = ${value}`);
          }
          return value;
        };

        console.log('🔍 localStorage monitoring setup complete');
      });

      // Execute role change
      console.log('\n📋 Executing changeRole to Profesor...');
      await page.evaluate(() => {
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
      console.log('✅ Navigated to Profesor panel');

      // Wait for page to fully load and capture changes
      await page.waitForTimeout(8000);

      // Get localStorage changes
      const localStorageChanges = await page.evaluate(() => {
        return window.localStorageChanges || [];
      });

      console.log(`📋 Total localStorage changes: ${localStorageChanges.length}`);
      localStorageChanges.forEach((change, i) => {
        console.log(`   ${i + 1}. ${change.action} ${change.key}: ${change.value}`);
        if (change.caller) {
          console.log(`      Called from: ${change.caller}`);
        }
      });

      // 3. Analyze the automatic role detection logic
      console.log('\n3️⃣ === ANALYZING AUTOMATIC ROLE DETECTION LOGIC ===');

      const roleDetectionInfo = await page.evaluate(() => {
        // Get current state
        const token = localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');
        const tokenData = token ? JSON.parse(token) : null;

        return {
          tokenRoles: tokenData?.roles || [],
          storedActiveRole: activeRole,
          detectedProblems: []
        };
      });

      console.log('📋 Role detection analysis:');
      console.log(`   Token roles: ${JSON.stringify(roleDetectionInfo.tokenRoles)}`);
      console.log(`   Stored active role: ${roleDetectionInfo.storedActiveRole}`);

      // Check if the automatic role change is triggered by specific events
      console.log('\n4️⃣ === TESTING ROLE LOCKING STRATEGIES ===');

      // Strategy 1: Lock localStorage during extraction
      console.log('\n📋 Strategy 1: Testing localStorage locking...');

      const strategy1Result = await page.evaluate(() => {
        // Save current state
        const currentActiveRole = localStorage.getItem('activeRole');

        // Override setItem to prevent activeRole changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          if (key === 'activeRole' && value !== 'PPF') {
            console.log(`🚫 Blocked activeRole change: ${key} = ${value}`);
            return; // Block the change
          }
          return originalSetItem.call(this, key, value);
        };

        return {
          currentActiveRole,
          locked: true
        };
      });

      console.log(`   Current active role: ${strategy1Result.currentActiveRole}`);
      console.log(`   localStorage locked: ${strategy1Result.locked}`);

      // Test extraction with locked localStorage
      await page.waitForTimeout(2000);

      const extractionTestResult = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        if (!container) return { error: 'Container not found' };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          blocksFound: cards.length,
          blocks: Array.from(cards).map(card => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();
            return title;
          }),
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('📋 Extraction test result:');
      console.log(`   Blocks found: ${extractionTestResult.blocksFound}`);
      console.log(`   Active role: ${extractionTestResult.activeRole}`);
      extractionTestResult.blocks?.forEach((title, i) => {
        console.log(`      ${i + 1}. "${title}"`);
      });

      // Strategy 2: Monitor and restore activeRole immediately
      console.log('\n📋 Strategy 2: Testing immediate role restoration...');

      await page.evaluate(() => {
        // Set up a watcher for activeRole changes
        let targetRole = 'PPF';

        const restoreRole = () => {
          const currentRole = localStorage.getItem('activeRole');
          if (currentRole !== targetRole) {
            console.log(`🔄 Restoring role from ${currentRole} to ${targetRole}`);
            localStorage.setItem('activeRole', targetRole);
          }
        };

        // Check every 100ms
        window.roleWatcher = setInterval(restoreRole, 100);
        console.log('🔍 Role watcher started');

        // Also restore immediately
        restoreRole();
      });

      await page.waitForTimeout(3000);

      // Check final state
      const finalState = await page.evaluate(() => {
        // Stop the watcher
        if (window.roleWatcher) {
          clearInterval(window.roleWatcher);
        }

        return {
          activeRole: localStorage.getItem('activeRole'),
          blocksFound: document.querySelector('#recursos-bloques-creados-container')?.querySelectorAll('.bc-block-card').length || 0
        };
      });

      console.log(`📋 Final state: activeRole=${finalState.activeRole}, blocks=${finalState.blocksFound}`);

      // 5. Test timing of the extraction
      console.log('\n5️⃣ === TESTING OPTIMAL EXTRACTION TIMING ===');

      // Test immediate extraction vs delayed extraction
      const timingTests = [500, 1000, 2000, 3000, 5000];

      for (const delay of timingTests) {
        // Refresh to reset state
        await page.reload();
        await page.waitForTimeout(delay);

        const timingResult = await page.evaluate(() => {
          const container = document.querySelector('#recursos-bloques-creados-container');
          return {
            activeRole: localStorage.getItem('activeRole'),
            blocksCount: container?.querySelectorAll('.bc-block-card').length || 0,
            containerExists: !!container
          };
        });

        console.log(`📋 After ${delay}ms: role=${timingResult.activeRole}, blocks=${timingResult.blocksCount}, container=${timingResult.containerExists}`);
      }

      // Take final screenshot
      await page.screenshot({ path: 'role-change-prevention-analysis.png', fullPage: true });
      console.log('📸 Screenshot saved: role-change-prevention-analysis.png');

    } catch (error) {
      console.log(`❌ Error in investigation: ${error.message}`);
      throw error;
    }
  });
});