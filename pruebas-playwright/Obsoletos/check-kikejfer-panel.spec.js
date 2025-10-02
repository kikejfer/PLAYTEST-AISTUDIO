const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Check Kikejfer Panel Structure', () => {

  test('Analyze what kikejfer sees on teachers panel', async ({ page }) => {
    console.log('🔍 ANALIZANDO PANEL DE KIKEJFER');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('📋 CONTENIDO DEL PANEL PARA KIKEJFER:');

    // Check basic page structure
    const title = await page.title();
    console.log(`📄 Título: "${title}"`);

    // Check if kikejfer has blocks directly visible (like admin panels)
    const blockCards = await page.locator('.bc-block-card').count();
    console.log(`📦 Block cards visibles: ${blockCards}`);

    if (blockCards > 0) {
      console.log('✅ Kikejfer tiene bloques directamente visibles');

      for (let i = 0; i < Math.min(blockCards, 5); i++) {
        const blockTitle = await page.locator('.bc-block-card').nth(i).locator('.bc-block-title').textContent().catch(() => 'Sin título');
        console.log(`   ${i + 1}. "${blockTitle}"`);
      }
    } else {
      console.log('❌ No hay block cards directos');
    }

    // Check tabs available
    const tabs = await page.locator('button, .tab-button, [role="tab"]').all();
    console.log(`📋 Pestañas disponibles: ${tabs.length}`);

    for (let i = 0; i < Math.min(tabs.length, 10); i++) {
      const tabText = await tabs[i].textContent().catch(() => '');
      if (tabText.trim()) {
        console.log(`   - "${tabText.trim()}"`);
      }
    }

    // Check for role selector
    const roleSelector = await page.locator('#role-selector-btn').count();
    const roleContainer = await page.locator('#role-selector-container').count();
    console.log(`🎯 Role selector btn: ${roleSelector > 0 ? 'SÍ' : 'NO'}`);
    console.log(`🎯 Role container: ${roleContainer > 0 ? 'SÍ' : 'NO'}`);

    // Check current role if available
    const currentRole = await page.locator('#current-role-name').textContent().catch(() => null);
    if (currentRole) {
      console.log(`📋 Rol actual: "${currentRole}"`);
    }

    // Check what panels kikejfer has access to
    console.log('\n🔍 COMPROBANDO ACCESO A OTROS PANELES:');

    const panelsToCheck = [
      'creators-panel-content.html',
      'admin-principal-panel.html',
      'admin-secundario-panel.html'
    ];

    for (const panel of panelsToCheck) {
      try {
        await page.goto(`${BASE_URL}/${panel}`);
        await page.waitForTimeout(2000);

        const panelTitle = await page.title();
        const hasBlocks = await page.locator('.bc-block-card').count();

        console.log(`   📄 ${panel}: "${panelTitle}" - ${hasBlocks} bloques`);

        if (hasBlocks > 0) {
          console.log(`      ✅ ESTE PANEL TIENE BLOQUES PARA KIKEJFER`);
        }
      } catch (error) {
        console.log(`   ❌ ${panel}: Error de acceso`);
      }
    }

    console.log('\n✅ ANÁLISIS COMPLETADO PARA KIKEJFER');
  });

});