const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

// Configuration
const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Debug Toñi Profesora Panel', () => {

  test('Debug Toñi Profesora panel navigation and selectors', async ({ page }) => {
    // Login as Toñi
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(2000);

    // Navigate to PPF (Profesora) panel
    console.log('🔄 Navigating to PPF panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Debug: Check what tabs are available
    console.log('🔍 Checking available tabs...');
    const allTabs = await page.locator('.tab-button, button').all();
    for (let i = 0; i < allTabs.length; i++) {
      const tab = allTabs[i];
      const tabText = await tab.textContent();
      console.log(`📋 Tab ${i}: "${tabText}"`);
    }

    // Navigate to "Recursos" tab
    console.log('🔄 Navigating to Recursos tab...');
    const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first();
    await recursosTab.click();
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Recursos tab');

    // Debug: Check what containers exist
    console.log('🔍 Checking available containers...');
    const containers = await page.locator('div[id*="container"], div[id*="bloques"]').all();
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const containerId = await container.getAttribute('id');
      console.log(`📦 Container ${i}: id="${containerId}"`);
    }

    // Try different container selectors
    const possibleContainers = [
      '#recursos-bloques-creados-container',
      '#bloques-creados-container',
      '#recursos-container',
      '#profesora-bloques-container'
    ];

    for (const containerSelector of possibleContainers) {
      console.log(`🔍 Trying container: ${containerSelector}`);
      const containerExists = await page.locator(containerSelector).count();
      if (containerExists > 0) {
        console.log(`✅ Found container: ${containerSelector}`);

        // Check blocks inside this container
        const blockCards = page.locator(`${containerSelector} .bc-block-card`);
        const cardCount = await blockCards.count();
        console.log(`📋 Found ${cardCount} block cards in ${containerSelector}`);

        for (let i = 0; i < cardCount; i++) {
          const card = blockCards.nth(i);
          const titleElement = card.locator('.bc-block-title');
          const titleExists = await titleElement.count();

          if (titleExists > 0) {
            const titleText = await titleElement.textContent();
            console.log(`📝 Block ${i + 1}: "${titleText}"`);
          } else {
            console.log(`❌ Block ${i + 1}: No title found`);
          }
        }
      } else {
        console.log(`❌ Container not found: ${containerSelector}`);
      }
    }

    // Debug: Look for "Constitución Española 1978" specifically
    console.log('🔍 Searching for "Constitución Española 1978" block...');
    const constitucionBlock = page.locator('text="Constitución Española 1978"').first();
    const constitucionExists = await constitucionBlock.count();

    if (constitucionExists > 0) {
      console.log('✅ Found "Constitución Española 1978" block!');

      // Find its parent container
      const parentContainer = await constitucionBlock.locator('..').locator('..').getAttribute('id');
      console.log(`📦 Block is in container: ${parentContainer}`);
    } else {
      console.log('❌ "Constitución Española 1978" block NOT found');

      // Look for partial matches
      console.log('🔍 Looking for blocks containing "Constitución"...');
      const partialMatches = await page.locator('text*="Constitución"').all();
      if (partialMatches.length > 0) {
        for (let i = 0; i < partialMatches.length; i++) {
          const match = partialMatches[i];
          const matchText = await match.textContent();
          console.log(`🔍 Partial match ${i + 1}: "${matchText}"`);
        }
      } else {
        console.log('❌ No blocks containing "Constitución" found');
      }
    }

    // Take screenshot for debugging
    await page.screenshot({
      path: `debug-toni-profesora-${Date.now()}.png`,
      fullPage: true
    });
  });

});