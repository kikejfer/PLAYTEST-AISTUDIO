const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Kikejfer Direct Access', () => {

  test('Click Entrar button and see what kikejfer has access to', async ({ page }) => {
    console.log('🎯 ACCESO DIRECTO PARA KIKEJFER');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📋 HACIENDO CLICK EN "ENTRAR"...');

    try {
      // Click the Entrar button
      await page.click('button:has-text("Entrar")');
      await page.waitForTimeout(5000);

      console.log('✅ Click en "Entrar" realizado');

      // Check what's available now
      const blockCards = await page.locator('.bc-block-card').count();
      console.log(`📦 Block cards después del click: ${blockCards}`);

      if (blockCards > 0) {
        console.log('✅ KIKEJFER TIENE BLOQUES DISPONIBLES:');

        // Extract block information directly without role switching
        for (let i = 0; i < blockCards; i++) {
          console.log(`\n🔍 Procesando bloque ${i + 1}...`);

          const blockElement = page.locator('.bc-block-card').nth(i);

          // Get block title
          const blockTitle = await blockElement.locator('.bc-block-title').textContent().catch(() => 'Sin título');
          console.log(`   📋 Título: "${blockTitle}"`);

          // Get stats
          const preguntas = await blockElement.locator('span:has-text("Preguntas:")').textContent().then(text => text.replace('Preguntas:', '').trim()).catch(() => '0');
          const temas = await blockElement.locator('span:has-text("Temas:")').textContent().then(text => text.replace('Temas:', '').trim()).catch(() => '0');
          const usuarios = await blockElement.locator('span:has-text("Usuarios:")').textContent().then(text => text.replace('Usuarios:', '').trim()).catch(() => '0');

          console.log(`   📝 Preguntas: ${preguntas}`);
          console.log(`   📚 Temas: ${temas}`);
          console.log(`   👥 Usuarios: ${usuarios}`);
        }

        // Calculate totals
        const totals = {
          totalBloques: blockCards,
          totalPreguntas: 0,
          totalTemas: 0,
          totalUsuarios: 0
        };

        for (let i = 0; i < blockCards; i++) {
          const blockElement = page.locator('.bc-block-card').nth(i);

          const preguntas = await blockElement.locator('span:has-text("Preguntas:")').textContent().then(text => parseInt(text.replace('Preguntas:', '').trim()) || 0).catch(() => 0);
          const temas = await blockElement.locator('span:has-text("Temas:")').textContent().then(text => parseInt(text.replace('Temas:', '').trim()) || 0).catch(() => 0);
          const usuarios = await blockElement.locator('span:has-text("Usuarios:")').textContent().then(text => parseInt(text.replace('Usuarios:', '').trim()) || 0).catch(() => 0);

          totals.totalPreguntas += preguntas;
          totals.totalTemas += temas;
          totals.totalUsuarios += usuarios;
        }

        console.log('\n🏆 TOTALES PARA KIKEJFER:');
        console.log('=' .repeat(40));
        console.log(`📦 Total Bloques: ${totals.totalBloques}`);
        console.log(`📚 Total Temas: ${totals.totalTemas}`);
        console.log(`📝 Total Preguntas: ${totals.totalPreguntas}`);
        console.log(`👥 Total Usuarios: ${totals.totalUsuarios}`);

      } else {
        console.log('❌ No hay bloques disponibles para kikejfer después de hacer click en Entrar');

        // Check if there are tabs available
        const tabs = await page.locator('button, .tab-button').all();
        console.log(`📋 Pestañas disponibles después de Entrar: ${tabs.length}`);

        for (let tab of tabs) {
          const tabText = await tab.textContent().catch(() => '');
          if (tabText.trim()) {
            console.log(`   - "${tabText.trim()}"`);
          }
        }
      }

    } catch (error) {
      console.log(`❌ Error haciendo click en Entrar: ${error.message}`);
    }

    console.log('\n✅ ANÁLISIS DIRECTO COMPLETADO PARA KIKEJFER');
  });

});