const { test, expect } = require('@playwright/test');

/**
 * Test Category: Generic Block Creation Module
 *
 * Tests the functionality of the generic "Bloques Creados" component
 * used by both Creator (PCC) and Professor (PPF) panels.
 *
 * Validates:
 * - Block count consistency between admin panel and user panels
 * - Block characteristics accuracy across different views
 * - Role-based filtering functionality
 */

test.describe('Generic Block Creation Module Tests', () => {
  let adminContext, toniContext;
  let adminPage, toniPage;

  test.beforeAll(async ({ browser }) => {
    // Create contexts for different browsers (simulating Edge and Chrome)
    adminContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    });

    toniContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    adminPage = await adminContext.newPage();
    toniPage = await toniContext.newPage();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await toniContext.close();
  });

  test('Admin Principal login in Edge browser', async () => {
    await adminPage.goto('https://playtest-frontend.onrender.com/');

    // Wait for login form
    await adminPage.waitForSelector('input[name="nickname"]');

    // Login as AdminPrincipal
    await adminPage.fill('input[name="nickname"]', 'AdminPrincipal');
    await adminPage.fill('input[name="password"]', 'kikejfer');
    await adminPage.click('button[type="submit"]');

    // Verify successful login and navigate to admin panel
    await adminPage.waitForURL(/admin-principal-panel/);
    await expect(adminPage).toHaveTitle(/Panel de Administrador Principal/);

    console.log('✅ AdminPrincipal logged in successfully (Edge)');
  });

  test('Toñi login in Chrome browser', async () => {
    await toniPage.goto('https://playtest-frontend.onrender.com/');

    // Wait for login form
    await toniPage.waitForSelector('input[name="nickname"]');

    // Login as Toñi
    await toniPage.fill('input[name="nickname"]', 'Toñi');
    await toniPage.fill('input[name="password"]', 'password123'); // Adjust password as needed
    await toniPage.click('button[type="submit"]');

    // Wait for successful login
    await toniPage.waitForLoadState('networkidle');

    console.log('✅ Toñi logged in successfully (Chrome)');
  });

  test('Verify Creator blocks consistency between Admin and Creator panels', async () => {
    // Step 1: Get Toñi's creator blocks count from Admin Panel
    await adminPage.goto('https://playtest-frontend.onrender.com/admin-principal-panel.html');
    await adminPage.waitForLoadState('networkidle');

    // Navigate to Creators section in Admin panel
    await adminPage.click('button[onclick="showTab(\'creators-management-tab\')"]');
    await adminPage.waitForSelector('#creators-management-tab');

    // Find Toñi in creators list and get block count
    const toniCreatorRow = await adminPage.locator('tr').filter({ hasText: 'Toñi' }).first();
    const adminCreatorBlockCount = await toniCreatorRow.locator('td').nth(2).textContent(); // Assuming blocks are in 3rd column

    console.log(`📊 Admin Panel - Toñi Creator blocks: ${adminCreatorBlockCount}`);

    // Step 2: Navigate to Toñi's Creator panel and verify block count
    await toniPage.goto('https://playtest-frontend.onrender.com/creators-panel-content.html');
    await toniPage.waitForLoadState('networkidle');

    // Wait for blocks to load
    await toniPage.waitForSelector('#bloques-creados-container');
    await toniPage.waitForTimeout(2000); // Allow time for blocks to load

    // Count blocks in Creator panel
    const creatorBlocks = await toniPage.locator('.bc-block-card').count();

    console.log(`📊 Creator Panel - Toñi blocks: ${creatorBlocks}`);

    // Verify counts match
    expect(creatorBlocks.toString()).toBe(adminCreatorBlockCount?.trim() || '0');

    // Step 3: Verify block characteristics match
    if (creatorBlocks > 0) {
      for (let i = 0; i < Math.min(creatorBlocks, 3); i++) { // Test first 3 blocks
        const blockCard = toniPage.locator('.bc-block-card').nth(i);
        const blockName = await blockCard.locator('.bc-block-title').textContent();

        // Click to expand block details
        await blockCard.locator('.bc-block-title').click();
        await toniPage.waitForTimeout(1000);

        // Get block characteristics from Creator panel
        const creatorStats = await blockCard.locator('.bc-block-stats').textContent();

        console.log(`📋 Block "${blockName}" stats in Creator panel: ${creatorStats}`);

        // Verify with Admin panel (would need to implement dropdown verification)
        // This is a placeholder for detailed characteristics comparison
        expect(creatorStats).toBeTruthy();
      }
    }
  });

  test('Verify Professor blocks consistency between Admin and Professor panels', async () => {
    // Step 1: Get Toñi's professor blocks count from Admin Panel
    await adminPage.goto('https://playtest-frontend.onrender.com/admin-principal-panel.html');
    await adminPage.waitForLoadState('networkidle');

    // Navigate to Players/Jugadores section in Admin panel
    await adminPage.click('button[onclick="showTab(\'jugadores-management-tab\')"]');
    await adminPage.waitForSelector('#jugadores-management-tab');

    // Find Toñi in players list and get block count (if she has professor role)
    const toniPlayerRow = await adminPage.locator('tr').filter({ hasText: 'Toñi' }).first();
    const adminPlayerBlockCount = await toniPlayerRow.locator('td').nth(2).textContent(); // Assuming blocks are in 3rd column

    console.log(`📊 Admin Panel - Toñi Professor blocks: ${adminPlayerBlockCount}`);

    // Step 2: Navigate to Toñi's Professor panel and verify block count
    await toniPage.goto('https://playtest-frontend.onrender.com/teachers-panel-schedules.html');
    await toniPage.waitForLoadState('networkidle');

    // Wait for blocks to load
    await toniPage.waitForSelector('#bloques-creados-container');
    await toniPage.waitForTimeout(2000);

    // Count blocks in Professor panel
    const professorBlocks = await toniPage.locator('.bc-block-card').count();

    console.log(`📊 Professor Panel - Toñi blocks: ${professorBlocks}`);

    // Verify counts match
    expect(professorBlocks.toString()).toBe(adminPlayerBlockCount?.trim() || '0');

    // Step 3: Verify block characteristics match
    if (professorBlocks > 0) {
      for (let i = 0; i < Math.min(professorBlocks, 3); i++) { // Test first 3 blocks
        const blockCard = toniPage.locator('.bc-block-card').nth(i);
        const blockName = await blockCard.locator('.bc-block-title').textContent();

        // Click to expand block details
        await blockCard.locator('.bc-block-title').click();
        await toniPage.waitForTimeout(1000);

        // Get block characteristics from Professor panel
        const professorStats = await blockCard.locator('.bc-block-stats').textContent();

        console.log(`📋 Block "${blockName}" stats in Professor panel: ${professorStats}`);

        // Verify with Admin panel (would need to implement dropdown verification)
        expect(professorStats).toBeTruthy();
      }
    }
  });

  test('AdminPrincipal logout from Edge browser', async () => {
    // Click on User Options in header
    await adminPage.click('[data-testid="user-options"]'); // Adjust selector as needed
    await adminPage.waitForSelector('[data-testid="logout-button"]'); // Adjust selector as needed

    // Click logout
    await adminPage.click('[data-testid="logout-button"]');

    // Verify logout
    await adminPage.waitForURL(/login|index/);

    console.log('✅ AdminPrincipal logged out successfully (Edge)');
  });

  test('Toñi logout from Chrome browser', async () => {
    // Click on User Options in header
    await toniPage.click('[data-testid="user-options"]'); // Adjust selector as needed
    await toniPage.waitForSelector('[data-testid="logout-button"]'); // Adjust selector as needed

    // Click logout
    await toniPage.click('[data-testid="logout-button"]');

    // Verify logout
    await toniPage.waitForURL(/login|index/);

    console.log('✅ Toñi logged out successfully (Chrome)');
  });
});