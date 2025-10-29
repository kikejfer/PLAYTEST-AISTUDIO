const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Verify Blocks with Long Timeout', () => {
  test('Check correct blocks data with extended timeouts', async ({ page }) => {
    console.log('\n🔍 === VERIFYING CORRECT BLOCKS WITH LONG TIMEOUT ===');

    try {
      // Set very long timeout for this test
      test.setTimeout(120000); // 2 minutes

      // Login as kikejfer with retries
      console.log('📋 Attempting login with extended timeout...');
      let loginAttempts = 0;
      const maxAttempts = 3;

      while (loginAttempts < maxAttempts) {
        try {
          await login(page, 'kikejfer');
          console.log('✅ Login successful');
          break;
        } catch (loginError) {
          loginAttempts++;
          console.log(`⚠️ Login attempt ${loginAttempts} failed: ${loginError.message}`);
          if (loginAttempts === maxAttempts) {
            throw loginError;
          }
          console.log('🔄 Waiting 10 seconds before retry...');
          await page.waitForTimeout(10000);
        }
      }

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // 1. Check Profesor panel
      console.log('\n1️⃣ === CHECKING PROFESOR PANEL ===');

      console.log('📋 Navigating to Profesor panel...');
      await page.evaluate(() => {
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/teachers-panel-schedules', { timeout: 30000 });
      console.log('✅ Navigated to Profesor panel');

      // Wait for page to load completely
      await page.waitForTimeout(3000);

      console.log('📋 Analyzing Profesor panel state...');

      // Check if we're in the right tab
      try {
        const recursosTab = page.locator('button:has-text("📚 Recursos"), button:has-text("Recursos")').first();
        const tabExists = await recursosTab.count();

        if (tabExists > 0) {
          await recursosTab.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Recursos tab');
        } else {
          console.log('⚠️ Recursos tab not found, proceeding anyway');
        }
      } catch (tabError) {
        console.log(`⚠️ Could not click Recursos tab: ${tabError.message}`);
      }

      // Extract blocks from Profesor panel
      const profesorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          blocks: Array.from(cards).map((card, index) => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();
            return { index, title };
          })
        };
      });

      console.log('📊 PROFESOR PANEL RESULTS:');
      if (profesorBlocks.containerFound) {
        console.log(`   Found ${profesorBlocks.blocks.length} blocks in recursos container`);
        profesorBlocks.blocks.forEach(block => {
          console.log(`   - "${block.title}"`);
        });
      } else {
        console.log(`   ❌ ${profesorBlocks.error}`);
      }

      // 2. Check Creador panel
      console.log('\n2️⃣ === CHECKING CREADOR PANEL ===');

      console.log('📋 Navigating to Creador panel...');
      await page.evaluate(() => {
        const roleObj = {
          name: 'Creador',
          code: 'PCC',
          panel: 'https://playtest-frontend.onrender.com/creators-panel-content'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/creators-panel-content', { timeout: 30000 });
      console.log('✅ Navigated to Creador panel');

      // Wait for page to load
      await page.waitForTimeout(3000);

      // Check if we're in the right tab
      try {
        const contenidoTab = page.locator('button:has-text("📝 Contenido"), button:has-text("Contenido")').first();
        const tabExists = await contenidoTab.count();

        if (tabExists > 0) {
          await contenidoTab.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Contenido tab');
        } else {
          console.log('⚠️ Contenido tab not found, proceeding anyway');
        }
      } catch (tabError) {
        console.log(`⚠️ Could not click Contenido tab: ${tabError.message}`);
      }

      // Extract blocks from Creador panel
      const creadorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          blocks: Array.from(cards).map((card, index) => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();
            return { index, title };
          })
        };
      });

      console.log('📊 CREADOR PANEL RESULTS:');
      if (creadorBlocks.containerFound) {
        console.log(`   Found ${creadorBlocks.blocks.length} blocks in contenido container`);
        creadorBlocks.blocks.forEach(block => {
          console.log(`   - "${block.title}"`);
        });
      } else {
        console.log(`   ❌ ${creadorBlocks.error}`);
      }

      // 3. Validation
      console.log('\n3️⃣ === VALIDATION RESULTS ===');

      const expectedProfesor = ["Constitución Española 1978"];
      const expectedCreador = ["Grado Informática Redes", "Patrón de Yate (PY)", "Patrón Embarcación Recreo (PER)"];

      console.log('📋 EXPECTED vs ACTUAL:');

      console.log('\n👨‍🏫 PROFESOR:');
      console.log(`   Expected: ${expectedProfesor.join(', ')}`);
      console.log(`   Actual: ${profesorBlocks.blocks?.map(b => b.title).join(', ') || 'No blocks found'}`);

      const profesorMatch = profesorBlocks.blocks?.length === 1 &&
                           profesorBlocks.blocks[0]?.title === expectedProfesor[0];
      console.log(`   Match: ${profesorMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);

      console.log('\n🎨 CREADOR:');
      console.log(`   Expected: ${expectedCreador.join(', ')}`);
      console.log(`   Actual: ${creadorBlocks.blocks?.map(b => b.title).join(', ') || 'No blocks found'}`);

      const creadorMatch = creadorBlocks.blocks?.length === expectedCreador.length &&
                          expectedCreador.every(expected =>
                            creadorBlocks.blocks?.some(actual => actual.title === expected)
                          );
      console.log(`   Match: ${creadorMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Overall result
      console.log('\n🎯 === FINAL RESULT ===');
      if (profesorMatch && creadorMatch) {
        console.log('🎉 SUCCESS: Both panels show correct blocks!');
        console.log('✅ changeRole function fix is working correctly');
      } else if (profesorMatch) {
        console.log('⚠️ PARTIAL: Profesor correct, Creador incorrect');
      } else if (creadorMatch) {
        console.log('⚠️ PARTIAL: Creador correct, Profesor incorrect');
      } else {
        console.log('❌ FAIL: Both panels show incorrect blocks');
      }

    } catch (error) {
      console.log(`❌ Error in verification: ${error.message}`);
      throw error;
    }
  });
});