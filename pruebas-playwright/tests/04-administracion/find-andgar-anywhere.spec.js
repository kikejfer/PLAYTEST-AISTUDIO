const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Find AndGar Anywhere on Page', () => {

  test('Search for AndGar in every element on the page', async ({ page }) => {

    await test.step('Login como AdminPrincipal', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[name="nickname"]', { timeout: 30000 });
      await page.locator('input[name="nickname"]').fill('AdminPrincipal');
      await page.locator('input[name="password"]').fill('kikejfer');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/admin-principal-panel/, { timeout: 60000 });
      await page.waitForTimeout(5000);
      console.log('✅ AdminPrincipal logged in successfully');
    });

    await test.step('Search for all AndGar elements on page', async () => {
      // Scroll to bottom to load all content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(6000); // Extended wait

      // Find ALL elements containing AndGar
      const allAndGarElements = page.locator('*:has-text("AndGar")');
      const count = await allAndGarElements.count();
      console.log(`🔍 Found ${count} elements containing "AndGar" on the page`);

      for (let i = 0; i < count; i++) {
        const element = allAndGarElements.nth(i);

        // Get element details
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.getAttribute('class') || '';
        const id = await element.getAttribute('id') || '';
        const text = await element.textContent();

        console.log(`\n📍 Element ${i + 1}:`);
        console.log(`  Tag: ${tagName}`);
        console.log(`  Class: "${className}"`);
        console.log(`  ID: "${id}"`);
        console.log(`  Text: "${text?.trim()}"`);

        // Check if it's inside Creadores section
        const creatorsParent = element.locator('xpath=ancestor::*[contains(@class, "creators") or contains(@class, "creadores") or contains(text(), "Creadores")]');
        const isInCreadores = await creatorsParent.count() > 0;
        console.log(`  In Creadores: ${isInCreadores}`);

        // Highlight the element
        await element.evaluate((el, index) => {
          el.style.border = `3px solid ${index === 0 ? 'red' : 'blue'}`;
          el.style.backgroundColor = index === 0 ? 'yellow' : 'lightgreen';
          // Add a label
          const label = document.createElement('div');
          label.textContent = `AndGar #${index + 1}`;
          label.style.position = 'absolute';
          label.style.backgroundColor = 'black';
          label.style.color = 'white';
          label.style.padding = '2px 5px';
          label.style.fontSize = '12px';
          label.style.zIndex = '9999';
          el.style.position = 'relative';
          el.appendChild(label);
        }, i);

        // Look for parent elements that might contain admin dropdown
        const parentElement = element.locator('xpath=..');
        const parentText = await parentElement.textContent();
        if (parentText && parentText.includes('kikejfer')) {
          console.log(`  🎯 Parent contains "kikejfer": ${parentText.trim()}`);
        }

        // Look for sibling dropdowns
        const siblingSelects = element.locator('xpath=../select | xpath=../../select | xpath=../*/select');
        const selectCount = await siblingSelects.count();
        if (selectCount > 0) {
          console.log(`  🔽 Found ${selectCount} dropdown(s) in nearby elements`);

          for (let j = 0; j < selectCount; j++) {
            const select = siblingSelects.nth(j);
            const selectedValue = await select.inputValue();
            console.log(`    Dropdown ${j + 1} value: "${selectedValue}"`);
          }
        }
      }

      await page.screenshot({ path: 'all-andgar-elements-highlighted.png', fullPage: true });
      console.log('📸 Screenshot taken: all-andgar-elements-highlighted.png');
    });

    console.log('🎯 Complete AndGar search completed');
  });
});