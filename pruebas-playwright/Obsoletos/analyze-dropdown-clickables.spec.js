const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Analyze Dropdown Clickable Elements', () => {
  test('Find all clickable elements in role dropdown', async ({ page }) => {
    console.log('\n🔍 === ANALYZING ALL CLICKABLE ELEMENTS IN DROPDOWN ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      // Open role selector
      console.log('\n📋 Opening role selector...');
      await page.waitForSelector('#role-selector-btn', { timeout: 10000 });
      const roleSelectorBtn = page.locator('#role-selector-btn');
      await roleSelectorBtn.click();
      await page.waitForTimeout(1500);

      await page.waitForSelector('#role-options', { state: 'visible', timeout: 8000 });
      console.log('✅ #role-options is visible');

      // Analyze ALL elements in the dropdown for clickability
      console.log('\n🔍 === COMPREHENSIVE CLICKABILITY ANALYSIS ===');

      const roleOptionsContainer = page.locator('#role-options');

      // 1. All elements with onclick attributes
      console.log('\n1️⃣ Elements with onclick attributes:');
      const onclickElements = await roleOptionsContainer.locator('[onclick]').all();
      console.log(`Found ${onclickElements.length} elements with onclick`);

      for (let i = 0; i < onclickElements.length; i++) {
        const element = onclickElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const onclick = await element.getAttribute('onclick');
        const textContent = await element.textContent();
        const className = await element.getAttribute('class') || 'no-class';
        console.log(`   ${i + 1}. <${tagName.toLowerCase()}> class="${className}" onclick="${onclick}" text="${textContent?.trim()}"`);
      }

      // 2. All elements with cursor pointer style
      console.log('\n2️⃣ Elements with cursor: pointer style:');
      const pointerElements = await roleOptionsContainer.locator('*').evaluateAll(elements => {
        return elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.cursor === 'pointer';
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent?.trim(),
          onclick: el.onclick ? 'has-onclick' : 'no-onclick'
        }));
      });

      console.log(`Found ${pointerElements.length} elements with cursor: pointer`);
      pointerElements.forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tagName.toLowerCase()}> class="${el.className}" ${el.onclick} text="${el.textContent}"`);
      });

      // 3. All elements with event listeners
      console.log('\n3️⃣ Elements with event listeners:');
      const elementsWithListeners = await roleOptionsContainer.locator('*').evaluateAll(elements => {
        return elements.filter(el => {
          // Check for common event listener indicators
          return el.onclick ||
                 el.addEventListener ||
                 el.dataset.action ||
                 el.dataset.role ||
                 el.getAttribute('data-action') ||
                 el.getAttribute('data-role') ||
                 el.getAttribute('role');
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent?.trim(),
          dataAction: el.dataset.action || el.getAttribute('data-action'),
          dataRole: el.dataset.role || el.getAttribute('data-role'),
          role: el.getAttribute('role')
        }));
      });

      console.log(`Found ${elementsWithListeners.length} elements with potential listeners`);
      elementsWithListeners.forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tagName.toLowerCase()}> class="${el.className}" data-action="${el.dataAction}" data-role="${el.dataRole}" role="${el.role}" text="${el.textContent}"`);
      });

      // 4. All clickable HTML elements (button, a, input, etc.)
      console.log('\n4️⃣ Standard clickable HTML elements:');
      const standardClickables = await roleOptionsContainer.locator('button, a, input[type="button"], input[type="submit"], [role="button"]').all();
      console.log(`Found ${standardClickables.length} standard clickable elements`);

      for (let i = 0; i < standardClickables.length; i++) {
        const element = standardClickables[i];
        const tagName = await element.evaluate(el => el.tagName);
        const textContent = await element.textContent();
        const className = await element.getAttribute('class') || 'no-class';
        const type = await element.getAttribute('type') || 'no-type';
        console.log(`   ${i + 1}. <${tagName.toLowerCase()}> type="${type}" class="${className}" text="${textContent?.trim()}"`);
      }

      // 5. Try to find elements by specific data attributes that might indicate clickability
      console.log('\n5️⃣ Elements with data attributes that suggest interaction:');
      const dataElements = await roleOptionsContainer.locator('[data-*]').all();
      console.log(`Found ${dataElements.length} elements with data attributes`);

      for (let i = 0; i < Math.min(dataElements.length, 10); i++) {
        const element = dataElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const textContent = await element.textContent();
        const className = await element.getAttribute('class') || 'no-class';

        // Get all data attributes
        const dataAttrs = await element.evaluate(el => {
          const attrs = {};
          for (let attr of el.attributes) {
            if (attr.name.startsWith('data-')) {
              attrs[attr.name] = attr.value;
            }
          }
          return attrs;
        });

        console.log(`   ${i + 1}. <${tagName.toLowerCase()}> class="${className}" data-attrs=${JSON.stringify(dataAttrs)} text="${textContent?.trim()}"`);
      }

      // 6. Test actual clickability by attempting clicks (safely)
      console.log('\n6️⃣ Testing actual clickability on Profesor elements:');

      // Try different selectors for Profesor
      const profesorSelectors = [
        'div:has(span:text("Profesor"))',
        'span:text("Profesor")',
        ':text("Profesor")',
        'div:text("Profesor")',
        '[data-role*="profesor" i]',
        '[data-action*="profesor" i]'
      ];

      for (const selector of profesorSelectors) {
        try {
          const elements = await roleOptionsContainer.locator(selector).all();
          console.log(`   Selector "${selector}": Found ${elements.length} elements`);

          if (elements.length > 0) {
            const element = elements[0];
            const tagName = await element.evaluate(el => el.tagName);
            const textContent = await element.textContent();
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();

            console.log(`     First match: <${tagName.toLowerCase()}> visible=${isVisible} enabled=${isEnabled} text="${textContent?.trim()}"`);
          }
        } catch (error) {
          console.log(`     Selector "${selector}": Error - ${error.message}`);
        }
      }

      // Take screenshot for visual analysis
      await page.screenshot({ path: 'dropdown-analysis.png', fullPage: true });
      console.log('\n📸 Screenshot saved: dropdown-analysis.png');

    } catch (error) {
      console.log(`❌ Error in analysis: ${error.message}`);
      throw error;
    }
  });
});