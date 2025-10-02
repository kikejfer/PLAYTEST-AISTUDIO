const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Analyze Post Role Change Actions', () => {
  test('Monitor all actions after Profesor role change', async ({ page }) => {
    console.log('\n🔍 === ANALYZING POST ROLE CHANGE ACTIONS ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Set up comprehensive monitoring
      const events = [];

      // Monitor network requests
      page.on('request', request => {
        events.push({
          timestamp: Date.now(),
          type: 'network-request',
          method: request.method(),
          url: request.url(),
          resourceType: request.resourceType()
        });
        console.log(`🌐 ${request.method()} ${request.url()}`);
      });

      // Monitor responses
      page.on('response', response => {
        events.push({
          timestamp: Date.now(),
          type: 'network-response',
          status: response.status(),
          url: response.url()
        });
        console.log(`📡 ${response.status()} ${response.url()}`);
      });

      // Monitor console logs
      page.on('console', msg => {
        events.push({
          timestamp: Date.now(),
          type: 'console',
          level: msg.type(),
          text: msg.text()
        });
        console.log(`🔔 Console ${msg.type()}: ${msg.text()}`);
      });

      // Monitor page errors
      page.on('pageerror', error => {
        events.push({
          timestamp: Date.now(),
          type: 'page-error',
          message: error.message
        });
        console.log(`❌ Page Error: ${error.message}`);
      });

      // Monitor dialogs
      page.on('dialog', async dialog => {
        events.push({
          timestamp: Date.now(),
          type: 'dialog',
          dialogType: dialog.type(),
          message: dialog.message()
        });
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // Set up DOM mutation observer
      await page.evaluate(() => {
        window.domMutations = [];

        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              const info = {
                timestamp: Date.now(),
                type: 'dom-mutation',
                targetTag: mutation.target.tagName,
                targetId: mutation.target.id,
                targetClass: mutation.target.className,
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length
              };

              window.domMutations.push(info);

              // Log significant changes
              if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                console.log(`DOM Change: ${info.targetTag}#${info.targetId}.${info.targetClass} +${info.addedNodes} -${info.removedNodes}`);
              }
            }
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        console.log('🔍 DOM mutation observer started');
      });

      // Monitor initial state
      console.log('\n📋 INITIAL STATE BEFORE ROLE CHANGE:');
      const initialBlocks = await page.evaluate(() => {
        const containers = {
          recursos: document.querySelector('#recursos-bloques-creados-container'),
          contenido: document.querySelector('#bloques-creados-container')
        };

        return {
          recursosExists: !!containers.recursos,
          contenidoExists: !!containers.contenido,
          recursosBlocks: containers.recursos ? containers.recursos.querySelectorAll('.bc-block-card').length : 0,
          contenidoBlocks: containers.contenido ? containers.contenido.querySelectorAll('.bc-block-card').length : 0
        };
      });

      console.log(`   recursos container: ${initialBlocks.recursosExists ? 'EXISTS' : 'NOT FOUND'}`);
      console.log(`   contenido container: ${initialBlocks.contenidoExists ? 'EXISTS' : 'NOT FOUND'}`);
      console.log(`   recursos blocks: ${initialBlocks.recursosBlocks}`);
      console.log(`   contenido blocks: ${initialBlocks.contenidoBlocks}`);

      // EXECUTE ROLE CHANGE
      console.log('\n🔄 === EXECUTING ROLE CHANGE TO PROFESOR ===');
      const roleChangeStart = Date.now();

      await page.evaluate(() => {
        console.log('About to call changeRole for Profesor...');
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      // Wait for navigation
      await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
      console.log('✅ Navigation completed to Profesor panel');

      // Monitor changes at specific intervals
      const monitoringIntervals = [1, 2, 3, 5, 8, 10, 15, 20];

      for (const seconds of monitoringIntervals) {
        await page.waitForTimeout(1000);

        console.log(`\n📊 === STATE CHECK AT ${seconds} SECONDS ===`);

        const state = await page.evaluate(() => {
          const containers = {
            recursos: document.querySelector('#recursos-bloques-creados-container'),
            contenido: document.querySelector('#bloques-creados-container')
          };

          const recursosBlocks = containers.recursos ?
            Array.from(containers.recursos.querySelectorAll('.bc-block-card')).map(card => {
              const title = card.querySelector('.bc-block-title')?.textContent?.trim();
              return title;
            }) : [];

          const contenidoBlocks = containers.contenido ?
            Array.from(containers.contenido.querySelectorAll('.bc-block-card')).map(card => {
              const title = card.querySelector('.bc-block-title')?.textContent?.trim();
              return title;
            }) : [];

          return {
            url: window.location.href,
            activeTab: document.querySelector('.tab-button.active, .active')?.textContent?.trim(),
            recursosCount: recursosBlocks.length,
            contenidoCount: contenidoBlocks.length,
            recursosBlocks,
            contenidoBlocks,
            totalMutations: window.domMutations ? window.domMutations.length : 0
          };
        });

        console.log(`   URL: ${state.url}`);
        console.log(`   Active tab: ${state.activeTab}`);
        console.log(`   Recursos blocks: ${state.recursosCount}`);
        state.recursosBlocks.forEach((title, i) => {
          console.log(`      ${i + 1}. "${title}"`);
        });

        if (state.contenidoCount > 0) {
          console.log(`   ⚠️ Contenido blocks: ${state.contenidoCount}`);
          state.contenidoBlocks.forEach((title, i) => {
            console.log(`      ${i + 1}. "${title}"`);
          });
        }

        console.log(`   Total DOM mutations: ${state.totalMutations}`);

        // Log recent network activity
        const recentEvents = events.filter(e => e.timestamp > roleChangeStart && e.type === 'network-request');
        if (recentEvents.length > 0) {
          console.log(`   Recent network requests: ${recentEvents.length}`);
          recentEvents.slice(-3).forEach(event => {
            console.log(`      ${event.method} ${event.url}`);
          });
        }
      }

      // Get final DOM mutations
      const finalMutations = await page.evaluate(() => {
        return window.domMutations || [];
      });

      console.log(`\n📋 TOTAL DOM MUTATIONS: ${finalMutations.length}`);

      // Show significant mutations
      const significantMutations = finalMutations.filter(m =>
        m.addedNodes > 0 &&
        (m.targetId.includes('bloque') || m.targetClass.includes('block') || m.targetClass.includes('bc-'))
      );

      console.log(`📋 SIGNIFICANT MUTATIONS (${significantMutations.length}):`);
      significantMutations.forEach((mut, i) => {
        console.log(`   ${i + 1}. ${mut.targetTag}#${mut.targetId}.${mut.targetClass} +${mut.addedNodes} nodes`);
      });

      // Final summary
      console.log('\n📊 === FINAL SUMMARY ===');
      const networkRequests = events.filter(e => e.type === 'network-request');
      const networkResponses = events.filter(e => e.type === 'network-response');

      console.log(`Total network requests: ${networkRequests.length}`);
      console.log(`Total network responses: ${networkResponses.length}`);
      console.log(`Total DOM mutations: ${finalMutations.length}`);

      // Take final screenshot
      await page.screenshot({ path: 'post-role-change-analysis.png', fullPage: true });
      console.log('📸 Screenshot saved: post-role-change-analysis.png');

    } catch (error) {
      console.log(`❌ Error in analysis: ${error.message}`);
      throw error;
    }
  });
});