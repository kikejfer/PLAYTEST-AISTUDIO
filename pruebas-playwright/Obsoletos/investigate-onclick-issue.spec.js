const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Investigate OnClick Issue', () => {
  test('Deep investigation of onclick functionality', async ({ page }) => {
    console.log('\n🔍 === INVESTIGATING ONCLICK FUNCTIONALITY ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      // Enable console logging to catch JavaScript errors
      const logs = [];
      const errors = [];

      page.on('console', msg => {
        logs.push(`${msg.type()}: ${msg.text()}`);
        console.log(`🔔 Console ${msg.type()}: ${msg.text()}`);
      });

      page.on('pageerror', error => {
        errors.push(error.message);
        console.log(`❌ Page Error: ${error.message}`);
      });

      // Open role selector
      console.log('\n📋 Opening role selector...');
      await page.waitForSelector('#role-selector-btn', { timeout: 10000 });
      const roleSelectorBtn = page.locator('#role-selector-btn');
      await roleSelectorBtn.click();
      await page.waitForTimeout(1500);

      await page.waitForSelector('#role-options', { state: 'visible', timeout: 8000 });
      console.log('✅ #role-options is visible');

      // 1. Inspect the actual onclick function content
      console.log('\n1️⃣ === EXAMINING ONCLICK FUNCTIONS ===');

      const profesorDiv = page.locator('#role-options div:has(span:text("Profesor"))').first();

      // Get the onclick function as string
      const onclickFunction = await profesorDiv.evaluate(el => {
        return el.onclick ? el.onclick.toString() : 'no onclick';
      });
      console.log(`📋 Profesor div onclick function: ${onclickFunction}`);

      // Get all onclick functions in the dropdown
      const allOnclicks = await page.locator('#role-options div').evaluateAll(elements => {
        return elements.map((el, index) => ({
          index,
          text: el.textContent?.trim(),
          onclick: el.onclick ? el.onclick.toString() : 'no onclick',
          disabled: el.disabled,
          style: el.style.cssText
        }));
      });

      console.log('\n📋 All onclick functions in dropdown:');
      allOnclicks.forEach(item => {
        console.log(`   ${item.index}: "${item.text}" | onclick: ${item.onclick.substring(0, 100)}${item.onclick.length > 100 ? '...' : ''}`);
        if (item.disabled) console.log(`     ⚠️ Element is DISABLED`);
      });

      // 2. Check for JavaScript errors before clicking
      console.log('\n2️⃣ === PRE-CLICK STATE ===');
      console.log(`📋 Console messages so far: ${logs.length}`);
      console.log(`📋 JavaScript errors so far: ${errors.length}`);

      // Check current role state
      const currentRole = await page.locator('#current-role-name').textContent();
      console.log(`📋 Current role before click: "${currentRole}"`);

      // 3. Execute onclick manually with JavaScript
      console.log('\n3️⃣ === MANUAL ONCLICK EXECUTION ===');

      try {
        const manualClickResult = await profesorDiv.evaluate(el => {
          console.log('About to execute onclick manually...');
          if (el.onclick) {
            const result = el.onclick();
            console.log('onclick executed, result:', result);
            return { success: true, result: result };
          } else {
            return { success: false, error: 'No onclick function' };
          }
        });

        console.log(`📋 Manual onclick result: ${JSON.stringify(manualClickResult)}`);
      } catch (evalError) {
        console.log(`❌ Error executing onclick manually: ${evalError.message}`);
      }

      // Wait and check for changes
      await page.waitForTimeout(2000);

      const roleAfterManual = await page.locator('#current-role-name').textContent();
      console.log(`📋 Role after manual onclick: "${roleAfterManual}"`);

      // 4. Try normal click and monitor network requests
      console.log('\n4️⃣ === MONITORING CLICK WITH NETWORK REQUESTS ===');

      // Monitor network requests
      const networkRequests = [];
      page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log(`🌐 Request: ${request.method()} ${request.url()}`);
      });

      page.on('response', response => {
        console.log(`📡 Response: ${response.status()} ${response.url()}`);
      });

      // Reopen dropdown (it might have closed)
      try {
        const optionsVisible = await page.locator('#role-options').isVisible();
        if (!optionsVisible) {
          console.log('📋 Reopening dropdown...');
          await roleSelectorBtn.click();
          await page.waitForTimeout(1000);
          await page.waitForSelector('#role-options', { state: 'visible', timeout: 5000 });
        }
      } catch (reopenError) {
        console.log(`⚠️ Could not reopen dropdown: ${reopenError.message}`);
      }

      // Perform normal click
      console.log('📋 Performing normal click on Profesor div...');
      const profesorDivNew = page.locator('#role-options div:has(span:text("Profesor"))').first();

      await profesorDivNew.click();
      console.log('✅ Normal click executed');

      // Wait for network activity
      await page.waitForTimeout(3000);

      console.log(`📋 Network requests during click: ${networkRequests.length}`);
      networkRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.method} ${req.url}`);
      });

      // 5. Check final state
      console.log('\n5️⃣ === FINAL STATE CHECK ===');

      const finalRole = await page.locator('#current-role-name').textContent();
      console.log(`📋 Final role: "${finalRole}"`);

      console.log(`📋 Total console messages: ${logs.length}`);
      console.log(`📋 Total JavaScript errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log('\n❌ JavaScript Errors Found:');
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }

      // 6. Try with different users for comparison
      console.log('\n6️⃣ === COMPARISON WITH DIFFERENT APPROACH ===');

      // Check if the issue is specific to kikejfer by examining page source
      const pageSource = await page.content();
      const hasRoleChangeScript = pageSource.includes('role') && pageSource.includes('change');
      console.log(`📋 Page contains role change scripts: ${hasRoleChangeScript}`);

      // Look for any disabled states or restrictions
      const bodyClasses = await page.locator('body').getAttribute('class');
      console.log(`📋 Body classes: "${bodyClasses}"`);

      // Take screenshot
      await page.screenshot({ path: 'onclick-investigation.png', fullPage: true });
      console.log('📸 Screenshot saved: onclick-investigation.png');

    } catch (error) {
      console.log(`❌ Error in investigation: ${error.message}`);
      throw error;
    }
  });
});