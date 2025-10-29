const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Simple Blocks Verification', () => {
  test('Check blocks in both panels with simple selectors', async ({ page }) => {
    console.log('\n🔍 === SIMPLE BLOCKS VERIFICATION ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');

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

      await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Click Recursos tab if available
      try {
        const recursosTab = page.locator('button:has-text("📚 Recursos"), button:has-text("Recursos")').first();
        const tabExists = await recursosTab.count();
        if (tabExists > 0) {
          await recursosTab.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Recursos tab');
        }
      } catch (tabError) {
        console.log(`⚠️ Could not click Recursos tab: ${tabError.message}`);
      }

      // Extract blocks with simple selectors
      const profesorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          totalCards: cards.length,
          blocks: Array.from(cards).map((card, index) => {
            const titleElement = card.querySelector('.bc-block-title');
            const title = titleElement ? titleElement.textContent.trim() : 'No title found';
            return { index, title };
          })
        };
      });

      console.log('📊 PROFESOR PANEL RESULTS:');
      if (profesorBlocks.containerFound) {
        console.log(`   Container found: ✅`);
        console.log(`   Total cards: ${profesorBlocks.totalCards}`);
        console.log(`   Blocks found: ${profesorBlocks.blocks.length}`);
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

      await page.waitForURL('**/creators-panel-content', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Click Contenido tab if available
      try {
        const contenidoTab = page.locator('button:has-text("📝 Contenido"), button:has-text("Contenido")').first();
        const tabExists = await contenidoTab.count();
        if (tabExists > 0) {
          await contenidoTab.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Contenido tab');
        }
      } catch (tabError) {
        console.log(`⚠️ Could not click Contenido tab: ${tabError.message}`);
      }

      // Extract blocks with simple selectors
      const creadorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          totalCards: cards.length,
          blocks: Array.from(cards).map((card, index) => {
            const titleElement = card.querySelector('.bc-block-title');
            const title = titleElement ? titleElement.textContent.trim() : 'No title found';
            return { index, title };
          })
        };
      });

      console.log('📊 CREADOR PANEL RESULTS:');
      if (creadorBlocks.containerFound) {
        console.log(`   Container found: ✅`);
        console.log(`   Total cards: ${creadorBlocks.totalCards}`);
        console.log(`   Blocks found: ${creadorBlocks.blocks.length}`);
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
      console.log(`   Expected (1 block): ${expectedProfesor.join(', ')}`);
      const actualProfesorTitles = profesorBlocks.blocks?.map(b => b.title) || [];
      console.log(`   Actual (${actualProfesorTitles.length} blocks): ${actualProfesorTitles.join(', ')}`);

      const profesorMatch = actualProfesorTitles.length === 1 &&
                           actualProfesorTitles[0] === expectedProfesor[0];
      console.log(`   Result: ${profesorMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);

      console.log('\n🎨 CREADOR:');
      console.log(`   Expected (3 blocks): ${expectedCreador.join(', ')}`);
      const actualCreadorTitles = creadorBlocks.blocks?.map(b => b.title) || [];
      console.log(`   Actual (${actualCreadorTitles.length} blocks): ${actualCreadorTitles.join(', ')}`);

      const creadorMatch = actualCreadorTitles.length === expectedCreador.length &&
                          expectedCreador.every(expected =>
                            actualCreadorTitles.includes(expected)
                          );
      console.log(`   Result: ${creadorMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Final summary
      console.log('\n🎯 === FINAL RESULT ===');
      if (profesorMatch && creadorMatch) {
        console.log('🎉 SUCCESS: Both panels show correct blocks!');
        console.log('✅ changeRole function fix is working correctly');
        console.log('✅ No more automatic role switching issues');
      } else if (profesorMatch) {
        console.log('⚠️ PARTIAL SUCCESS: Profesor correct, Creador needs checking');
      } else if (creadorMatch) {
        console.log('⚠️ PARTIAL SUCCESS: Creador correct, Profesor needs checking');
      } else {
        console.log('❌ ISSUE: Both panels show incorrect blocks');
        console.log('💡 This may indicate other issues beyond the changeRole fix');
      }

    } catch (error) {
      console.log(`❌ Error in verification: ${error.message}`);
      throw error;
    }
  });
});