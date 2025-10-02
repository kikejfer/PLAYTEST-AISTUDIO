const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');
const { findUserRowByIdInSection } = require('./utils/admin-panel-helper');

test.describe('Verify AdminPrincipal Current Data', () => {
  test('Check current kikejfer data in AdminPrincipal panel', async ({ page }) => {
    console.log('\n🔍 === VERIFYING ADMINPRINCIPAL CURRENT DATA ===');

    try {
      // Login as AdminPrincipal
      await login(page, 'AdminPrincipal');
      console.log('✅ Logged in as AdminPrincipal');
      await page.waitForTimeout(3000);

      // Check current URL and title
      const currentUrl = page.url();
      const currentTitle = await page.title();
      console.log(`📋 Current URL: ${currentUrl}`);
      console.log(`📋 Current title: ${currentTitle}`);

      // Verify we're in the admin panel
      if (!currentUrl.includes('admin') && !currentUrl.includes('principal')) {
        console.log('❌ Not in admin panel, checking available panels...');
        const allLinks = await page.locator('a').all();
        for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
          const linkText = await allLinks[i].textContent();
          const linkHref = await allLinks[i].getAttribute('href');
          console.log(`   Link ${i + 1}: "${linkText}" → ${linkHref}`);
        }
      }

      // Check kikejfer in Profesores section
      console.log('\n1️⃣ === CHECKING KIKEJFER IN PROFESORES SECTION ===');

      try {
        const profesorData = await findUserRowByIdInSection(page, 'kikejfer', 'Profesores');

        if (profesorData) {
          console.log('✅ Found kikejfer in Profesores section:');
          console.log(`   Nickname: ${profesorData.nickname}`);
          console.log(`   Blocks: ${profesorData.blocks}`);
          console.log(`   Topics: ${profesorData.topics}`);
          console.log(`   Questions: ${profesorData.questions}`);
          console.log(`   Users: ${profesorData.users}`);
        } else {
          console.log('❌ kikejfer NOT found in Profesores section');
        }
      } catch (profesorError) {
        console.log(`❌ Error checking Profesores section: ${profesorError.message}`);
      }

      // Check kikejfer in Creadores section for comparison
      console.log('\n2️⃣ === CHECKING KIKEJFER IN CREADORES SECTION ===');

      try {
        const creadorData = await findUserRowByIdInSection(page, 'kikejfer', 'Creadores');

        if (creadorData) {
          console.log('✅ Found kikejfer in Creadores section:');
          console.log(`   Nickname: ${creadorData.nickname}`);
          console.log(`   Blocks: ${creadorData.blocks}`);
          console.log(`   Topics: ${creadorData.topics}`);
          console.log(`   Questions: ${creadorData.questions}`);
          console.log(`   Users: ${creadorData.users}`);
        } else {
          console.log('❌ kikejfer NOT found in Creadores section');
        }
      } catch (creadorError) {
        console.log(`❌ Error checking Creadores section: ${creadorError.message}`);
      }

      // Extract all data from both sections for full comparison
      console.log('\n3️⃣ === FULL SECTIONS COMPARISON ===');

      // Get all users in Profesores section
      console.log('\n📋 ALL USERS IN PROFESORES SECTION:');
      try {
        const profesoresSection = await page.locator('h3:has-text("Profesores")').first();
        const profesoresSectionExists = await profesoresSection.count();

        if (profesoresSectionExists > 0) {
          console.log('✅ Found Profesores section header');

          // Find the table associated with Profesores (table index 2 based on previous mapping)
          const profesoresContainer = profesoresSection.locator('xpath=following-sibling::div').first();
          const profesoresTable = profesoresContainer.locator('table').nth(2); // Table 3 (index 2)

          const profesoresRows = profesoresTable.locator('tbody tr');
          const profesoresCount = await profesoresRows.count();

          console.log(`📊 Found ${profesoresCount} professors in table`);

          for (let i = 0; i < profesoresCount; i++) {
            const row = profesoresRows.nth(i);
            const cells = row.locator('td');
            const cellCount = await cells.count();

            if (cellCount >= 5) {
              const nickname = await cells.nth(0).textContent();
              const blocks = await cells.nth(1).textContent();
              const topics = await cells.nth(2).textContent();
              const questions = await cells.nth(3).textContent();
              const users = await cells.nth(4).textContent();

              console.log(`   ${i + 1}. ${nickname?.trim()}: ${blocks?.trim()} bloques, ${topics?.trim()} temas, ${questions?.trim()} preguntas, ${users?.trim()} usuarios`);
            }
          }
        } else {
          console.log('❌ Profesores section header not found');
        }
      } catch (profesoresError) {
        console.log(`❌ Error extracting Profesores data: ${profesoresError.message}`);
      }

      // Get all users in Creadores section
      console.log('\n📋 ALL USERS IN CREADORES SECTION:');
      try {
        const creadoresSection = await page.locator('h3:has-text("Creadores")').first();
        const creadoresSectionExists = await creadoresSection.count();

        if (creadoresSectionExists > 0) {
          console.log('✅ Found Creadores section header');

          // Find the table associated with Creadores (table index 3 based on previous mapping)
          const creadoresContainer = creadoresSection.locator('xpath=following-sibling::div').first();
          const creadoresTable = creadoresContainer.locator('table').nth(3); // Table 4 (index 3)

          const creadoresRows = creadoresTable.locator('tbody tr');
          const creadoresCount = await creadoresRows.count();

          console.log(`📊 Found ${creadoresCount} creators in table`);

          for (let i = 0; i < creadoresCount; i++) {
            const row = creadoresRows.nth(i);
            const cells = row.locator('td');
            const cellCount = await cells.count();

            if (cellCount >= 5) {
              const nickname = await cells.nth(0).textContent();
              const blocks = await cells.nth(1).textContent();
              const topics = await cells.nth(2).textContent();
              const questions = await cells.nth(3).textContent();
              const users = await cells.nth(4).textContent();

              console.log(`   ${i + 1}. ${nickname?.trim()}: ${blocks?.trim()} bloques, ${topics?.trim()} temas, ${questions?.trim()} preguntas, ${users?.trim()} usuarios`);
            }
          }
        } else {
          console.log('❌ Creadores section header not found');
        }
      } catch (creadoresError) {
        console.log(`❌ Error extracting Creadores data: ${creadoresError.message}`);
      }

      // Take screenshot for reference
      await page.screenshot({ path: 'adminprincipal-current-data.png', fullPage: true });
      console.log('📸 Screenshot saved: adminprincipal-current-data.png');

    } catch (error) {
      console.log(`❌ Error verifying AdminPrincipal data: ${error.message}`);
      throw error;
    }
  });
});