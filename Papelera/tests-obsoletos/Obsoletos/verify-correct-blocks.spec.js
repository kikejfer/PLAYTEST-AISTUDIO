const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Verify Correct Blocks Data', () => {
  test('Check both Profesor and Creador panels for correct blocks', async ({ page }) => {
    console.log('\n🔍 === VERIFYING CORRECT BLOCKS DATA ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // 1. Check Profesor panel thoroughly
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
      await page.waitForTimeout(5000); // Wait for full load

      console.log('📋 Analyzing Profesor panel state...');

      // Check URL and basic state
      const profesorState = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          activeRole: document.querySelector('#current-role-name')?.textContent?.trim(),
          activeTab: document.querySelector('.tab-button.active, .active')?.textContent?.trim()
        };
      });

      console.log(`   URL: ${profesorState.url}`);
      console.log(`   Title: ${profesorState.title}`);
      console.log(`   Active role: ${profesorState.activeRole}`);
      console.log(`   Active tab: ${profesorState.activeTab}`);

      // Make sure we're in Recursos tab
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

      // Extract all blocks in Profesor panel
      const profesorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#recursos-bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          blocks: Array.from(cards).map((card, index) => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();

            // Try to get stats in both formats
            const stats = {};

            // New format (inline spans) - using standard CSS selectors
            const allSpans = card.querySelectorAll('span');
            allSpans.forEach(span => {
              const text = span.textContent;
              if (text.includes('Preguntas:')) {
                stats.preguntas = text.split(':')[1]?.trim();
              } else if (text.includes('Temas:')) {
                stats.temas = text.split(':')[1]?.trim();
              } else if (text.includes('Usuarios:')) {
                stats.usuarios = text.split(':')[1]?.trim();
              }
            });

            return { index, title, stats };
          })
        };
      });

      console.log('📊 PROFESOR PANEL BLOCKS:');
      if (profesorBlocks.containerFound) {
        console.log(`   Found ${profesorBlocks.blocks.length} blocks in recursos container`);
        profesorBlocks.blocks.forEach(block => {
          console.log(`   - "${block.title}"`);
          if (block.stats.preguntas) {
            console.log(`     Preguntas: ${block.stats.preguntas}, Temas: ${block.stats.temas}, Usuarios: ${block.stats.usuarios}`);
          }
        });
      } else {
        console.log(`   ❌ ${profesorBlocks.error}`);
      }

      // Take screenshot of Profesor panel
      await page.screenshot({ path: 'profesor-blocks-verification.png', fullPage: true });
      console.log('📸 Profesor screenshot: profesor-blocks-verification.png');

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
      await page.waitForTimeout(5000); // Wait for full load

      // Check Creador state
      const creadorState = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          activeRole: document.querySelector('#current-role-name')?.textContent?.trim(),
          activeTab: document.querySelector('.tab-button.active, .active')?.textContent?.trim()
        };
      });

      console.log(`   URL: ${creadorState.url}`);
      console.log(`   Title: ${creadorState.title}`);
      console.log(`   Active role: ${creadorState.activeRole}`);
      console.log(`   Active tab: ${creadorState.activeTab}`);

      // Make sure we're in Contenido tab
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

      // Extract all blocks in Creador panel
      const creadorBlocks = await page.evaluate(() => {
        const container = document.querySelector('#bloques-creados-container');
        if (!container) return { error: 'Container not found', blocks: [] };

        const cards = container.querySelectorAll('.bc-block-card');
        return {
          containerFound: true,
          blocks: Array.from(cards).map((card, index) => {
            const title = card.querySelector('.bc-block-title')?.textContent?.trim();

            // Try to get stats - using standard CSS selectors
            const stats = {};
            const allSpans = card.querySelectorAll('span');
            allSpans.forEach(span => {
              const text = span.textContent;
              if (text.includes('Preguntas:')) {
                stats.preguntas = text.split(':')[1]?.trim();
              } else if (text.includes('Temas:')) {
                stats.temas = text.split(':')[1]?.trim();
              } else if (text.includes('Usuarios:')) {
                stats.usuarios = text.split(':')[1]?.trim();
              }
            });

            return { index, title, stats };
          })
        };
      });

      console.log('📊 CREADOR PANEL BLOCKS:');
      if (creadorBlocks.containerFound) {
        console.log(`   Found ${creadorBlocks.blocks.length} blocks in contenido container`);
        creadorBlocks.blocks.forEach(block => {
          console.log(`   - "${block.title}"`);
          if (block.stats.preguntas) {
            console.log(`     Preguntas: ${block.stats.preguntas}, Temas: ${block.stats.temas}, Usuarios: ${block.stats.usuarios}`);
          }
        });
      } else {
        console.log(`   ❌ ${creadorBlocks.error}`);
      }

      // Take screenshot of Creador panel
      await page.screenshot({ path: 'creador-blocks-verification.png', fullPage: true });
      console.log('📸 Creador screenshot: creador-blocks-verification.png');

      // 3. Compare with expected data
      console.log('\n3️⃣ === COMPARISON WITH EXPECTED DATA ===');

      const expectedProfesor = ["Constitución Española 1978"];
      const expectedCreador = ["Grado Informática Redes", "Patrón de Yate (PY)", "Patrón Embarcación Recreo (PER)"];

      console.log('📋 EXPECTED vs ACTUAL:');

      console.log('\n👨‍🏫 PROFESOR:');
      console.log(`   Expected: ${expectedProfesor.join(', ')}`);
      console.log(`   Actual: ${profesorBlocks.blocks.map(b => b.title).join(', ')}`);

      const profesorMatch = profesorBlocks.blocks.length === 1 &&
                           profesorBlocks.blocks[0].title === expectedProfesor[0];
      console.log(`   Match: ${profesorMatch ? '✅' : '❌'}`);

      console.log('\n🎨 CREADOR:');
      console.log(`   Expected: ${expectedCreador.join(', ')}`);
      console.log(`   Actual: ${creadorBlocks.blocks.map(b => b.title).join(', ')}`);

      const creadorMatch = creadorBlocks.blocks.length === expectedCreador.length &&
                          expectedCreador.every(expected =>
                            creadorBlocks.blocks.some(actual => actual.title === expected)
                          );
      console.log(`   Match: ${creadorMatch ? '✅' : '❌'}`);

    } catch (error) {
      console.log(`❌ Error in verification: ${error.message}`);
      throw error;
    }
  });
});