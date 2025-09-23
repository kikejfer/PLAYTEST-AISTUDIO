const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Debug Table Structure in Creadores', () => {

  test('Analyze exact table structure and find AndGar', async ({ page }) => {

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

    await test.step('Find and analyze Creadores section structure', async () => {
      // Scroll to find Creadores
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);
      await page.waitForTimeout(3000);

      const creatorsSection = page.locator('.creators-section, .creadores-section, .creators, .creadores, h2:has-text("Creadores"), h3:has-text("Creadores"), .section:has-text("Creadores")').first();

      if (await creatorsSection.count() > 0) {
        console.log('✅ Found Creadores section');

        // Analyze table structure
        const tables = creatorsSection.locator('table');
        const tableCount = await tables.count();
        console.log(`🔍 Found ${tableCount} tables in Creadores section`);

        if (tableCount > 0) {
          // Get all rows in the table
          const allRows = creatorsSection.locator('table tr, table tbody tr');
          const rowCount = await allRows.count();
          console.log(`🔍 Found ${rowCount} rows in Creadores table`);

          // Check each row for AndGar
          for (let i = 0; i < rowCount; i++) {
            const row = allRows.nth(i);
            const rowText = await row.textContent();
            console.log(`📝 Row ${i + 1}: ${rowText?.trim()}`);

            if (rowText && rowText.includes('AndGar')) {
              console.log(`🎯 FOUND AndGar in row ${i + 1}!`);

              // Highlight this row
              await row.evaluate(el => {
                el.style.border = '5px solid red';
                el.style.backgroundColor = 'yellow';
              });

              // Get all cells in this row
              const cells = row.locator('td, th');
              const cellCount = await cells.count();
              console.log(`📊 Row has ${cellCount} cells`);

              // Check each cell
              for (let j = 0; j < cellCount; j++) {
                const cell = cells.nth(j);
                const cellText = await cell.textContent();
                console.log(`  📋 Cell ${j + 1}: ${cellText?.trim()}`);

                // Look for dropdowns in cells
                const dropdowns = cell.locator('select');
                const dropdownCount = await dropdowns.count();
                if (dropdownCount > 0) {
                  console.log(`    🔽 Found ${dropdownCount} dropdown(s) in cell ${j + 1}`);

                  for (let k = 0; k < dropdownCount; k++) {
                    const dropdown = dropdowns.nth(k);
                    const selectedValue = await dropdown.inputValue();
                    console.log(`      🎯 Dropdown ${k + 1} selected value: ${selectedValue}`);

                    // Get all options
                    const options = dropdown.locator('option');
                    const optionCount = await options.count();
                    console.log(`      📋 Dropdown has ${optionCount} options`);

                    for (let l = 0; l < optionCount; l++) {
                      const option = options.nth(l);
                      const optionText = await option.textContent();
                      const optionValue = await option.getAttribute('value');
                      console.log(`        • Option ${l + 1}: "${optionText}" (value: ${optionValue})`);
                    }
                  }
                }
              }
            }
          }

          await page.screenshot({ path: 'table-structure-analysis.png', fullPage: true });
          console.log('📸 Screenshot taken: table-structure-analysis.png');

        } else {
          console.log('⚠️ No tables found in Creadores section');

          // Look for other structures
          const divs = creatorsSection.locator('div');
          const divCount = await divs.count();
          console.log(`🔍 Found ${divCount} divs in Creadores section`);

          // Check divs for AndGar
          for (let i = 0; i < divCount; i++) {
            const div = divs.nth(i);
            const divText = await div.textContent();

            if (divText && divText.includes('AndGar')) {
              console.log(`🎯 FOUND AndGar in div ${i + 1}: ${divText.trim()}`);
              await div.evaluate(el => {
                el.style.border = '3px solid orange';
                el.style.backgroundColor = 'lightblue';
              });

              // Look for dropdowns within this div
              const dropdowns = div.locator('select');
              const dropdownCount = await dropdowns.count();
              console.log(`  🔽 Found ${dropdownCount} dropdown(s) in AndGar div`);

              for (let j = 0; j < dropdownCount; j++) {
                const dropdown = dropdowns.nth(j);
                const selectedValue = await dropdown.inputValue();
                console.log(`    🎯 Dropdown ${j + 1} selected value: ${selectedValue}`);

                // Get all options
                const options = dropdown.locator('option');
                const optionCount = await options.count();

                for (let k = 0; k < optionCount; k++) {
                  const option = options.nth(k);
                  const optionText = await option.textContent();
                  const optionValue = await option.getAttribute('value');
                  console.log(`      • Option ${k + 1}: "${optionText}" (value: ${optionValue})`);
                }
              }

              // Look for any text elements that might show admin assignment
              const textElements = div.locator('span, p, label');
              const textCount = await textElements.count();
              for (let j = 0; j < textCount; j++) {
                const textEl = textElements.nth(j);
                const text = await textEl.textContent();
                if (text && text.trim()) {
                  console.log(`    📝 Text element ${j + 1}: "${text.trim()}"`);
                }
              }
            }
          }
        }

      } else {
        console.log('⚠️ Creadores section not found');
      }
    });

    console.log('🎯 Table structure analysis completed');
  });
});