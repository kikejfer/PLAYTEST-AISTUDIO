const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Investigate Profesor Data Mismatch', () => {
  test('Analyze why Profesor panel shows wrong data', async ({ page }) => {
    console.log('\n🔍 === INVESTIGATING PROFESOR DATA MISMATCH ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Set up dialog handler for role changes
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // 1. Navigate to Profesor panel and analyze immediately
      console.log('\n1️⃣ === IMMEDIATE ANALYSIS AFTER PROFESOR ROLE CHANGE ===');

      // Call changeRole directly and monitor
      console.log('📋 Executing changeRole for Profesor...');
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
      console.log('✅ Navigated to Profesor panel');

      // Immediate state check
      await page.waitForTimeout(2000);
      console.log('\n📋 IMMEDIATE STATE (2 seconds after navigation):');

      const immediateUrl = page.url();
      const immediateTitle = await page.title();
      console.log(`   URL: ${immediateUrl}`);
      console.log(`   Title: ${immediateTitle}`);

      // Check what containers exist immediately
      const containers = await page.evaluate(() => {
        return {
          recursosContainer: document.querySelector('#recursos-bloques-creados-container') ? 'EXISTS' : 'NOT FOUND',
          contenidoContainer: document.querySelector('#bloques-creados-container') ? 'EXISTS' : 'NOT FOUND',
          activeTab: document.querySelector('.tab-button.active, .active')?.textContent?.trim() || 'no active tab'
        };
      });

      console.log(`   recursos-bloques-creados-container: ${containers.recursosContainer}`);
      console.log(`   bloques-creados-container: ${containers.contenidoContainer}`);
      console.log(`   Active tab: ${containers.activeTab}`);

      // Check blocks immediately
      if (containers.recursosContainer === 'EXISTS') {
        const immediateBlocks = await page.evaluate(() => {
          const container = document.querySelector('#recursos-bloques-creados-container');
          const cards = container?.querySelectorAll('.bc-block-card') || [];
          return Array.from(cards).map(card => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();
            return title;
          });
        });

        console.log(`   Immediate blocks in recursos container: ${immediateBlocks.length}`);
        immediateBlocks.forEach((title, i) => {
          console.log(`      ${i + 1}. "${title}"`);
        });
      }

      // 2. Monitor changes over time
      console.log('\n2️⃣ === MONITORING CHANGES OVER TIME ===');

      // Check every 2 seconds for 10 seconds
      for (let check = 1; check <= 5; check++) {
        await page.waitForTimeout(2000);
        console.log(`\n📋 CHECK ${check} (after ${check * 2} seconds):`);

        const stateCheck = await page.evaluate(() => {
          const recursosContainer = document.querySelector('#recursos-bloques-creados-container');
          const contenidoContainer = document.querySelector('#bloques-creados-container');

          return {
            recursosBlocks: recursosContainer ? Array.from(recursosContainer.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : [],
            contenidoBlocks: contenidoContainer ? Array.from(contenidoContainer.querySelectorAll('.bc-block-card')).map(card =>
              card.querySelector('.bc-block-title')?.textContent?.trim()
            ) : [],
            activeTab: document.querySelector('.tab-button.active, .active')?.textContent?.trim() || 'no active tab',
            url: window.location.href
          };
        });

        console.log(`   URL: ${stateCheck.url}`);
        console.log(`   Active tab: ${stateCheck.activeTab}`);
        console.log(`   Recursos blocks: ${stateCheck.recursosBlocks.length} blocks`);
        stateCheck.recursosBlocks.forEach((title, i) => {
          console.log(`      ${i + 1}. "${title}"`);
        });

        if (stateCheck.contenidoBlocks.length > 0) {
          console.log(`   ⚠️ Contenido blocks also present: ${stateCheck.contenidoBlocks.length} blocks`);
          stateCheck.contenidoBlocks.forEach((title, i) => {
            console.log(`      ${i + 1}. "${title}"`);
          });
        }
      }

      // 3. Check network requests for data loading
      console.log('\n3️⃣ === CHECKING NETWORK ACTIVITY ===');

      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('bloque') || request.url().includes('block') || request.url().includes('api')) {
          networkRequests.push({
            url: request.url(),
            method: request.method()
          });
          console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
        }
      });

      // Refresh the page to see what requests are made
      console.log('📋 Refreshing page to monitor network requests...');
      await page.reload();
      await page.waitForTimeout(5000);

      console.log(`📋 Total API requests captured: ${networkRequests.length}`);

      // 4. Check JavaScript console for errors or logs
      console.log('\n4️⃣ === CHECKING CONSOLE LOGS ===');

      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('bloque') || msg.text().includes('block')) {
          consoleLogs.push(`${msg.type()}: ${msg.text()}`);
          console.log(`🔔 Console ${msg.type()}: ${msg.text()}`);
        }
      });

      // Trigger some activity to see console logs
      await page.evaluate(() => {
        console.log('Testing console logging from investigate script');
      });

      await page.waitForTimeout(2000);

      console.log(`📋 Relevant console logs captured: ${consoleLogs.length}`);

      // 5. Compare with Creador panel for reference
      console.log('\n5️⃣ === COMPARING WITH CREADOR PANEL ===');

      // Navigate to Creador panel
      console.log('📋 Switching to Creador panel for comparison...');
      await page.evaluate(() => {
        const roleObj = {
          name: 'Creador',
          code: 'PCC',
          panel: 'https://playtest-frontend.onrender.com/creators-panel-content'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/creators-panel-content', { timeout: 10000 });
      await page.waitForTimeout(3000);

      const creadorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#bloques-creados-container');
        const cards = container?.querySelectorAll('.bc-block-card') || [];
        return Array.from(cards).map(card => {
          const title = card.querySelector('.bc-block-title')?.textContent?.trim();
          return title;
        });
      });

      console.log(`📋 Creador panel blocks: ${creadorBlocks.length}`);
      creadorBlocks.forEach((title, i) => {
        console.log(`   ${i + 1}. "${title}"`);
      });

      // Take final screenshot
      await page.screenshot({ path: 'profesor-data-mismatch-analysis.png', fullPage: true });
      console.log('📸 Screenshot saved: profesor-data-mismatch-analysis.png');

    } catch (error) {
      console.log(`❌ Error in investigation: ${error.message}`);
      throw error;
    }
  });
});