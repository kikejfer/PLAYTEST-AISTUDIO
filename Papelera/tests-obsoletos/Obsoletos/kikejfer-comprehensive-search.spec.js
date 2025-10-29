const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Kikejfer Comprehensive Search', () => {

  test('Find where kikejfer blocks are located', async ({ page }) => {
    console.log('🔍 BÚSQUEDA COMPLETA PARA KIKEJFER');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    console.log('\n📋 PROBANDO DIFERENTES PANELES PARA KIKEJFER:');

    const panelsToTry = [
      'teachers-panel-schedules.html',
      'creators-panel-content.html',
      'admin-principal-panel.html',
      'admin-secundario-panel.html',
      'creators-panel-analytics.html',
      'creators-panel-marketing.html',
      'creators-panel-tournaments.html',
      'creators-panel-monetization.html'
    ];

    const results = [];

    for (const panel of panelsToTry) {
      console.log(`\n🔄 Probando ${panel}...`);

      try {
        await page.goto(`${BASE_URL}/${panel}`);
        await page.waitForTimeout(3000);

        const title = await page.title();
        console.log(`   📄 Título: "${title}"`);

        // Check for blocks immediately
        const blockCards = await page.locator('.bc-block-card').count();
        console.log(`   📦 Bloques inmediatos: ${blockCards}`);

        if (blockCards > 0) {
          console.log(`   ✅ ENCONTRADOS BLOQUES EN ${panel}!`);

          const blocks = [];
          for (let i = 0; i < Math.min(blockCards, 3); i++) {
            const blockTitle = await page.locator('.bc-block-card').nth(i).locator('.bc-block-title').textContent().catch(() => 'Sin título');
            blocks.push(blockTitle);
          }

          results.push({
            panel,
            blockCount: blockCards,
            blocks: blocks
          });
        }

        // Check for buttons that might reveal content
        const buttons = await page.locator('button').all();
        for (const button of buttons) {
          const buttonText = await button.textContent().catch(() => '');
          if (buttonText.includes('Entrar') || buttonText.includes('Acceder') || buttonText.includes('Ver')) {
            console.log(`   🔘 Botón encontrado: "${buttonText.trim()}"`);

            try {
              await button.click();
              await page.waitForTimeout(2000);

              const newBlockCards = await page.locator('.bc-block-card').count();
              if (newBlockCards > 0 && newBlockCards !== blockCards) {
                console.log(`   ✅ ¡BLOQUES APARECIERON DESPUÉS DE CLICK! (${newBlockCards})`);

                const newBlocks = [];
                for (let i = 0; i < Math.min(newBlockCards, 3); i++) {
                  const blockTitle = await page.locator('.bc-block-card').nth(i).locator('.bc-block-title').textContent().catch(() => 'Sin título');
                  newBlocks.push(blockTitle);
                }

                results.push({
                  panel: `${panel} (después de click)`,
                  blockCount: newBlockCards,
                  blocks: newBlocks
                });
              }
            } catch (error) {
              console.log(`   ⚠️ Error con botón: ${error.message}`);
            }
            break; // Only try the first relevant button
          }
        }

      } catch (error) {
        console.log(`   ❌ Error accediendo a ${panel}: ${error.message}`);
      }
    }

    console.log('\n🎯 RESUMEN DE RESULTADOS PARA KIKEJFER:');
    console.log('=' .repeat(50));

    if (results.length > 0) {
      results.forEach(result => {
        console.log(`\n📄 Panel: ${result.panel}`);
        console.log(`📦 Bloques: ${result.blockCount}`);
        result.blocks.forEach((block, index) => {
          console.log(`   ${index + 1}. "${block}"`);
        });
      });

      // If we found blocks, extract full details from the best panel
      const bestResult = results.reduce((prev, current) =>
        (current.blockCount > prev.blockCount) ? current : prev
      );

      console.log(`\n🎯 EXTRAYENDO DETALLES DEL MEJOR PANEL: ${bestResult.panel}`);

      // Go back to the best panel
      const panelUrl = bestResult.panel.includes('(después de click)') ?
        bestResult.panel.replace(' (después de click)', '') : bestResult.panel;

      await page.goto(`${BASE_URL}/${panelUrl}`);
      await page.waitForTimeout(3000);

      // Click button if needed
      if (bestResult.panel.includes('(después de click)')) {
        const button = await page.locator('button:has-text("Entrar"), button:has-text("Acceder"), button:has-text("Ver")').first();
        if (await button.count() > 0) {
          await button.click();
          await page.waitForTimeout(2000);
        }
      }

      // Extract detailed information
      const finalBlockCards = await page.locator('.bc-block-card').count();
      console.log(`\n📊 DETALLES FINALES PARA KIKEJFER (${finalBlockCards} bloques):`);

      let totalPreguntas = 0, totalTemas = 0, totalUsuarios = 0;

      for (let i = 0; i < finalBlockCards; i++) {
        const blockElement = page.locator('.bc-block-card').nth(i);

        const blockTitle = await blockElement.locator('.bc-block-title').textContent().catch(() => 'Sin título');
        const preguntas = await blockElement.locator('span:has-text("Preguntas:")').textContent().then(text => parseInt(text.replace('Preguntas:', '').trim()) || 0).catch(() => 0);
        const temas = await blockElement.locator('span:has-text("Temas:")').textContent().then(text => parseInt(text.replace('Temas:', '').trim()) || 0).catch(() => 0);
        const usuarios = await blockElement.locator('span:has-text("Usuarios:")').textContent().then(text => parseInt(text.replace('Usuarios:', '').trim()) || 0).catch(() => 0);

        console.log(`\n   ${i + 1}. "${blockTitle}"`);
        console.log(`      📝 Preguntas: ${preguntas}`);
        console.log(`      📚 Temas: ${temas}`);
        console.log(`      👥 Usuarios: ${usuarios}`);

        totalPreguntas += preguntas;
        totalTemas += temas;
        totalUsuarios += usuarios;
      }

      console.log('\n🏆 TOTALES FINALES PARA KIKEJFER:');
      console.log('=' .repeat(40));
      console.log(`📦 Total Bloques: ${finalBlockCards}`);
      console.log(`📚 Total Temas: ${totalTemas}`);
      console.log(`📝 Total Preguntas: ${totalPreguntas}`);
      console.log(`👥 Total Usuarios: ${totalUsuarios}`);
      console.log(`📍 Panel: ${bestResult.panel}`);

    } else {
      console.log('❌ No se encontraron bloques para kikejfer en ningún panel');
    }

    console.log('\n✅ BÚSQUEDA COMPLETA FINALIZADA PARA KIKEJFER');
  });

});