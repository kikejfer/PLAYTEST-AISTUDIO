const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Debug Role Selector', () => {
  test('Investigate role selector options for Profesor and Creador', async ({ page }) => {
    console.log('\n🔍 === DEBUGGING ROLE SELECTOR ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');

      // Wait a moment for page to stabilize
      await page.waitForTimeout(3000);

      // Step 1: Find and click role selector button
      console.log('\n📋 Step 1: Looking for #role-selector-btn...');
      const roleSelectorExists = await page.locator('#role-selector-btn').count();
      console.log(`📋 #role-selector-btn found: ${roleSelectorExists > 0 ? 'YES' : 'NO'}`);

      if (roleSelectorExists === 0) {
        console.log('❌ #role-selector-btn not found, cannot proceed');
        return;
      }

      await page.waitForSelector('#role-selector-btn', { timeout: 10000 });
      const roleSelectorBtn = page.locator('#role-selector-btn');

      // Check current role before clicking
      console.log('\n📋 Current role before clicking:');
      try {
        const currentRoleName = page.locator('#current-role-name');
        const currentRoleText = await currentRoleName.textContent();
        console.log(`   Current role: "${currentRoleText}"`);
      } catch (error) {
        console.log(`   Could not read current role: ${error.message}`);
      }

      await roleSelectorBtn.click();
      await page.waitForTimeout(1500);
      console.log('✅ Clicked #role-selector-btn');

      // Step 2: Wait for role options and analyze structure
      console.log('\n📋 Step 2: Analyzing #role-options...');
      try {
        await page.waitForSelector('#role-options', { state: 'visible', timeout: 8000 });
        console.log('✅ #role-options is visible');

        // Get all elements inside role-options
        const roleOptionsContainer = page.locator('#role-options');

        // Check all direct children
        console.log('\n🔍 Direct children of #role-options:');
        const children = await roleOptionsContainer.locator('> *').all();
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const tagName = await child.evaluate(el => el.tagName);
          const className = await child.getAttribute('class') || 'no-class';
          const textContent = await child.textContent();
          const id = await child.getAttribute('id') || 'no-id';
          console.log(`   ${i + 1}. <${tagName.toLowerCase()}> id="${id}" class="${className}" text="${textContent?.trim()}"`);
        }

        // Look for all clickable elements
        console.log('\n🔍 All clickable elements (button, div, span) in #role-options:');
        const clickableElements = await roleOptionsContainer.locator('button, div, span, a, li').all();
        for (let i = 0; i < clickableElements.length; i++) {
          const element = clickableElements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class') || 'no-class';
          const textContent = await element.textContent();
          const id = await element.getAttribute('id') || 'no-id';
          const onclick = await element.getAttribute('onclick') || 'no-onclick';
          console.log(`   ${i + 1}. <${tagName.toLowerCase()}> id="${id}" class="${className}" onclick="${onclick}" text="${textContent?.trim()}"`);
        }

        // Look specifically for text containing "Profesor" or "Creador"
        console.log('\n🎯 Elements containing "Profesor" or "Creador":');

        const profesorElements = await roleOptionsContainer.locator(':text("Profesor")').all();
        console.log(`📚 Found ${profesorElements.length} elements with "Profesor"`);
        for (let i = 0; i < profesorElements.length; i++) {
          const element = profesorElements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class') || 'no-class';
          const textContent = await element.textContent();
          const id = await element.getAttribute('id') || 'no-id';
          console.log(`   Profesor ${i + 1}: <${tagName.toLowerCase()}> id="${id}" class="${className}" text="${textContent?.trim()}"`);
        }

        const creadorElements = await roleOptionsContainer.locator(':text("Creador")').all();
        console.log(`🎨 Found ${creadorElements.length} elements with "Creador"`);
        for (let i = 0; i < creadorElements.length; i++) {
          const element = creadorElements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class') || 'no-class';
          const textContent = await element.textContent();
          const id = await element.getAttribute('id') || 'no-id';
          console.log(`   Creador ${i + 1}: <${tagName.toLowerCase()}> id="${id}" class="${className}" text="${textContent?.trim()}"`);
        }

        // Take screenshot for visual analysis
        await page.screenshot({ path: 'role-selector-debug.png', fullPage: true });
        console.log('\n📸 Screenshot saved: role-selector-debug.png');

      } catch (error) {
        console.log(`❌ Error analyzing #role-options: ${error.message}`);
      }

    } catch (error) {
      console.log(`❌ Error in debug test: ${error.message}`);
      throw error;
    }
  });
});