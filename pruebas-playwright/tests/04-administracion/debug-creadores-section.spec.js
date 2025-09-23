const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Debug Creadores Section', () => {

  test('Take screenshots of AdminPrincipal panel and Creadores section', async ({ page }) => {

    await test.step('Login como AdminPrincipal', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[name="nickname"]', { timeout: 30000 });
      await page.locator('input[name="nickname"]').fill('AdminPrincipal');
      await page.locator('input[name="password"]').fill('kikejfer');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

      await page.waitForURL(/admin-principal-panel/, { timeout: 60000 });
      console.log('✅ AdminPrincipal logged in successfully');

      // Esperar a que cargue la información del panel
      await page.waitForTimeout(5000);
      console.log('✅ Waiting for panel information to load');
    });

    await test.step('Take screenshot of initial admin panel', async () => {
      await page.screenshot({ path: 'admin-panel-initial.png', fullPage: true });
      console.log('📸 Screenshot taken: admin-panel-initial.png');
    });

    await test.step('Scroll and find Creadores section', async () => {
      // Scroll down to find Creadores section
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);
      console.log('✅ Scrolled down to find Creadores section');

      // Esperar a que cargue la información después del scroll
      await page.waitForTimeout(3000);
      console.log('✅ Waiting for information to load after scroll');

      await page.screenshot({ path: 'admin-panel-after-scroll.png', fullPage: true });
      console.log('📸 Screenshot taken: admin-panel-after-scroll.png');

      // Look for Creadores section
      const creatorsSection = page.locator('.creators-section, .creadores-section, .creators, .creadores, h2:has-text("Creadores"), h3:has-text("Creadores"), .section:has-text("Creadores")').first();

      if (await creatorsSection.count() > 0) {
        console.log('✅ Found Creadores section');

        // Highlight the section
        await creatorsSection.evaluate(element => {
          element.style.border = '3px solid red';
          element.style.backgroundColor = 'yellow';
        });

        await page.screenshot({ path: 'creadores-section-highlighted.png', fullPage: true });
        console.log('📸 Screenshot taken: creadores-section-highlighted.png');

        // Take screenshot of just the Creadores section
        await creatorsSection.screenshot({ path: 'creadores-section-only.png' });
        console.log('📸 Screenshot taken: creadores-section-only.png');

        // Search specifically for table rows, divs, or any structure within Creadores
        const creatorsData = creatorsSection.locator('tr, .row, .user-item, .creator-item, div').all();
        const dataCount = await creatorsSection.locator('tr, .row, .user-item, .creator-item, div').count();
        console.log(`🔍 Found ${dataCount} data elements within Creadores section`);

        // Look specifically for AndGar within Creadores
        const andgarInCreators = creatorsSection.locator('text=AndGar');
        const andgarInCreatorsCount = await andgarInCreators.count();
        console.log(`🔍 Found ${andgarInCreatorsCount} AndGar elements within Creadores section`);

        if (andgarInCreatorsCount > 0) {
          // Highlight AndGar within Creadores
          for (let i = 0; i < andgarInCreatorsCount; i++) {
            const element = andgarInCreators.nth(i);
            await element.evaluate(el => {
              el.style.border = '3px solid orange';
              el.style.backgroundColor = 'orange';
            });
          }
          await page.screenshot({ path: 'andgar-in-creadores-highlighted.png', fullPage: true });
          console.log('📸 Screenshot taken: andgar-in-creadores-highlighted.png');
        }

      } else {
        console.log('⚠️ Creadores section not found');

        // Look for any text containing "Creadores"
        const creatorsText = page.locator('text=Creadores').first();
        if (await creatorsText.count() > 0) {
          await creatorsText.scrollIntoViewIfNeeded();
          await creatorsText.evaluate(element => {
            element.style.border = '3px solid blue';
            element.style.backgroundColor = 'lightblue';
          });
          await page.screenshot({ path: 'creadores-text-found.png', fullPage: true });
          console.log('📸 Screenshot taken: creadores-text-found.png');
        }
      }
    });

    await test.step('Search for AndGar in the page', async () => {
      // Look for AndGar anywhere on the page
      const andgarElements = page.locator('text=AndGar');
      const andgarCount = await andgarElements.count();

      console.log(`🔍 Found ${andgarCount} elements containing "AndGar"`);

      if (andgarCount > 0) {
        // Highlight all AndGar elements
        for (let i = 0; i < andgarCount; i++) {
          const element = andgarElements.nth(i);
          await element.evaluate(el => {
            el.style.border = '2px solid green';
            el.style.backgroundColor = 'lightgreen';
          });
        }

        await page.screenshot({ path: 'andgar-elements-highlighted.png', fullPage: true });
        console.log('📸 Screenshot taken: andgar-elements-highlighted.png');
      } else {
        console.log('⚠️ No AndGar elements found on page');
        await page.screenshot({ path: 'no-andgar-found.png', fullPage: true });
        console.log('📸 Screenshot taken: no-andgar-found.png');
      }
    });

    console.log('🎯 Debug screenshots completed');
  });
});