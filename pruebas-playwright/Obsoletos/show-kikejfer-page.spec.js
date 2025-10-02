const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Show Kikejfer Page Content', () => {

  test('Show what kikejfer sees on teachers panel', async ({ page }) => {
    console.log('📄 MOSTRANDO CONTENIDO DE PÁGINA PARA KIKEJFER');

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForTimeout(5000);

    console.log('\n📋 INFORMACIÓN DE LA PÁGINA:');
    console.log(`URL: ${page.url()}`);
    console.log(`Título: ${await page.title()}`);

    // Take screenshot
    await page.screenshot({ path: 'kikejfer-page.png', fullPage: true });
    console.log('📸 Screenshot guardada como kikejfer-page.png');

    // Get page HTML content
    const content = await page.content();
    console.log('\n📝 CONTENIDO HTML (primeros 1000 caracteres):');
    console.log(content.substring(0, 1000));

    // Check specific elements
    console.log('\n🔍 ELEMENTOS ENCONTRADOS:');

    const buttons = await page.locator('button').all();
    console.log(`\n🔘 Botones (${buttons.length}):`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`   ${i + 1}. "${text}"`);
    }

    const inputs = await page.locator('input').all();
    console.log(`\n📝 Inputs (${inputs.length}):`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      console.log(`   ${i + 1}. type="${type}" name="${name}"`);
    }

    const divs = await page.locator('div').all();
    console.log(`\n📦 Total divs: ${divs.length}`);

    const spans = await page.locator('span').all();
    console.log(`📄 Total spans: ${spans.length}`);

    // Check for role-related elements
    const roleElements = await page.locator('[id*="role"], [class*="role"]').all();
    console.log(`\n🎯 Elementos con 'role' en id/class: ${roleElements.length}`);

    // Check for block-related elements
    const blockElements = await page.locator('[id*="block"], [class*="block"]').all();
    console.log(`📦 Elementos con 'block' en id/class: ${blockElements.length}`);

    console.log('\n✅ ANÁLISIS COMPLETADO');
  });

});