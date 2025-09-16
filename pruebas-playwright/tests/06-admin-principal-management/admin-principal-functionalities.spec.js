const { test, expect } = require('@playwright/test');

/**
 * Test Category: Admin Principal Functionalities
 *
 * Tests comprehensive administrative functionalities including:
 * - User management (adding secondary admins, technical support)
 * - Role reassignments (professors, creators, players)
 * - Permission verification
 * - Cleanup operations
 */

test.describe('Admin Principal Functionalities Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Admin Principal login and setup', async () => {
    await page.goto('https://playtest-frontend.onrender.com/');

    // Wait for login form
    await page.waitForSelector('input[name="nickname"]');

    // Login as AdminPrincipal
    await page.fill('input[name="nickname"]', 'AdminPrincipal');
    await page.fill('input[name="password"]', 'kikejfer');
    await page.click('button[type="submit"]');

    // Verify successful login and navigate to admin panel
    await page.waitForURL(/admin-principal-panel/);
    await expect(page).toHaveTitle(/Panel de Administrador Principal/);

    console.log('✅ AdminPrincipal logged in successfully');
  });

  test('Add new secondary administrator (ArmJal, 1007)', async () => {
    await page.goto('https://playtest-frontend.onrender.com/admin-principal-panel.html');
    await page.waitForLoadState('networkidle');

    // Navigate to Secondary Admins section
    await page.click('button[onclick="showTab(\'admins-management-tab\')"]');
    await page.waitForSelector('#admins-management-tab');

    // Click Add New Admin button
    await page.click('button[data-testid="add-admin-button"]'); // Adjust selector as needed
    await page.waitForSelector('#add-admin-modal'); // Adjust selector as needed

    // Fill in new admin details
    await page.fill('input[name="admin-nickname"]', 'ArmJal');
    await page.fill('input[name="admin-id"]', '1007');
    await page.fill('input[name="admin-password"]', 'defaultPassword123'); // Adjust as needed

    // Submit new admin
    await page.click('button[data-testid="confirm-add-admin"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message'); // Adjust selector as needed

    // Verify ArmJal appears in admin list
    const armjalRow = await page.locator('tr').filter({ hasText: 'ArmJal' });
    await expect(armjalRow).toBeVisible();

    console.log('✅ Secondary administrator ArmJal (1007) added successfully');
  });

  test('Reassign professor HarSpe to ArmJal', async () => {
    // Navigate to Professors section
    await page.click('button[onclick="showTab(\'profesores-management-tab\')"]');
    await page.waitForSelector('#profesores-management-tab');

    // Find HarSpe in professors list
    const harSpeRow = await page.locator('tr').filter({ hasText: 'HarSpe' });
    await expect(harSpeRow).toBeVisible();

    // Click reassign button for HarSpe
    await harSpeRow.locator('button[data-testid="reassign-button"]').click();
    await page.waitForSelector('#reassign-modal');

    // Select ArmJal as new admin
    await page.selectOption('select[name="new-admin"]', 'ArmJal');

    // Confirm reassignment
    await page.click('button[data-testid="confirm-reassign"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message');

    // Verify HarSpe is now assigned to ArmJal
    const updatedHarSpeRow = await page.locator('tr').filter({ hasText: 'HarSpe' });
    const assignedAdmin = await updatedHarSpeRow.locator('td[data-column="assigned-admin"]').textContent();
    expect(assignedAdmin?.trim()).toBe('ArmJal');

    console.log('✅ Professor HarSpe reassigned to ArmJal successfully');
  });

  test('Reassign creator JesPea to ArmJal', async () => {
    // Navigate to Creators section
    await page.click('button[onclick="showTab(\'creators-management-tab\')"]');
    await page.waitForSelector('#creators-management-tab');

    // Find JesPea in creators list
    const jesPeaRow = await page.locator('tr').filter({ hasText: 'JesPea' });
    await expect(jesPeaRow).toBeVisible();

    // Click reassign button for JesPea
    await jesPeaRow.locator('button[data-testid="reassign-button"]').click();
    await page.waitForSelector('#reassign-modal');

    // Select ArmJal as new admin
    await page.selectOption('select[name="new-admin"]', 'ArmJal');

    // Confirm reassignment
    await page.click('button[data-testid="confirm-reassign"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message');

    // Verify JesPea is now assigned to ArmJal
    const updatedJesPeaRow = await page.locator('tr').filter({ hasText: 'JesPea' });
    const assignedAdmin = await updatedJesPeaRow.locator('td[data-column="assigned-admin"]').textContent();
    expect(assignedAdmin?.trim()).toBe('ArmJal');

    console.log('✅ Creator JesPea reassigned to ArmJal successfully');
  });

  test('Reassign player AurBor to ArmJal', async () => {
    // Navigate to Players section
    await page.click('button[onclick="showTab(\'jugadores-management-tab\')"]');
    await page.waitForSelector('#jugadores-management-tab');

    // Find AurBor in players list
    const aurBorRow = await page.locator('tr').filter({ hasText: 'AurBor' });
    await expect(aurBorRow).toBeVisible();

    // Click reassign button for AurBor
    await aurBorRow.locator('button[data-testid="reassign-button"]').click();
    await page.waitForSelector('#reassign-modal');

    // Select ArmJal as new admin
    await page.selectOption('select[name="new-admin"]', 'ArmJal');

    // Confirm reassignment
    await page.click('button[data-testid="confirm-reassign"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message');

    // Verify AurBor is now assigned to ArmJal
    const updatedAurBorRow = await page.locator('tr').filter({ hasText: 'AurBor' });
    const assignedAdmin = await updatedAurBorRow.locator('td[data-column="assigned-admin"]').textContent();
    expect(assignedAdmin?.trim()).toBe('ArmJal');

    console.log('✅ Player AurBor reassigned to ArmJal successfully');
  });

  test('Add new technical support: PedPic (1008)', async () => {
    // Navigate to Technical Support section
    await page.click('button[onclick="showTab(\'support-management-tab\')"]');
    await page.waitForSelector('#support-management-tab');

    // Click Add New Support button
    await page.click('button[data-testid="add-support-button"]');
    await page.waitForSelector('#add-support-modal');

    // Fill in new support details
    await page.fill('input[name="support-nickname"]', 'PedPic');
    await page.fill('input[name="support-id"]', '1008');
    await page.fill('input[name="support-password"]', 'supportPassword123');

    // Submit new support
    await page.click('button[data-testid="confirm-add-support"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message');

    // Verify PedPic appears in support list
    const pedPicRow = await page.locator('tr').filter({ hasText: 'PedPic' });
    await expect(pedPicRow).toBeVisible();

    console.log('✅ Technical support PedPic (1008) added successfully');
  });

  test('AdminPrincipal logout', async () => {
    // Click on User Options in header
    await page.click('[data-testid="user-options"]');
    await page.waitForSelector('[data-testid="logout-button"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Verify logout
    await page.waitForURL(/login|index/);

    console.log('✅ AdminPrincipal logged out successfully');
  });

  test('ArmJal login and verify assignments', async () => {
    await page.goto('https://playtest-frontend.onrender.com/');

    // Wait for login form
    await page.waitForSelector('input[name="nickname"]');

    // Login as ArmJal
    await page.fill('input[name="nickname"]', 'ArmJal');
    await page.fill('input[name="password"]', 'defaultPassword123');
    await page.click('button[type="submit"]');

    // Verify successful login and navigate to admin panel
    await page.waitForURL(/admin-secundario-panel/);
    await expect(page).toHaveTitle(/Panel de Administrador Secundario/);

    // Verify professor assignments
    await page.click('button[onclick="showTab(\'profesores-management-tab\')"]');
    await page.waitForSelector('#profesores-management-tab');

    const harSpeVisible = await page.locator('tr').filter({ hasText: 'HarSpe' }).isVisible();
    expect(harSpeVisible).toBe(true);

    // Verify creator assignments
    await page.click('button[onclick="showTab(\'creators-management-tab\')"]');
    await page.waitForSelector('#creators-management-tab');

    const jesPeaVisible = await page.locator('tr').filter({ hasText: 'JesPea' }).isVisible();
    expect(jesPeaVisible).toBe(true);

    // Verify player assignments
    await page.click('button[onclick="showTab(\'jugadores-management-tab\')"]');
    await page.waitForSelector('#jugadores-management-tab');

    const aurBorVisible = await page.locator('tr').filter({ hasText: 'AurBor' }).isVisible();
    expect(aurBorVisible).toBe(true);

    console.log('✅ ArmJal can see all assigned users: HarSpe, JesPea, AurBor');
  });

  test('ArmJal logout', async () => {
    // Click on User Options in header
    await page.click('[data-testid="user-options"]');
    await page.waitForSelector('[data-testid="logout-button"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Verify logout
    await page.waitForURL(/login|index/);

    console.log('✅ ArmJal logged out successfully');
  });

  test('AdminPrincipal login for cleanup', async () => {
    await page.goto('https://playtest-frontend.onrender.com/');

    // Login as AdminPrincipal again
    await page.fill('input[name="nickname"]', 'AdminPrincipal');
    await page.fill('input[name="password"]', 'kikejfer');
    await page.click('button[type="submit"]');

    await page.waitForURL(/admin-principal-panel/);

    console.log('✅ AdminPrincipal logged in for cleanup operations');
  });

  test('Undo reassignments - return users to AdminPrincipal', async () => {
    await page.goto('https://playtest-frontend.onrender.com/admin-principal-panel.html');
    await page.waitForLoadState('networkidle');

    // Reassign HarSpe back to AdminPrincipal
    await page.click('button[onclick="showTab(\'profesores-management-tab\')"]');
    const harSpeRow = await page.locator('tr').filter({ hasText: 'HarSpe' });
    await harSpeRow.locator('button[data-testid="reassign-button"]').click();
    await page.selectOption('select[name="new-admin"]', 'AdminPrincipal');
    await page.click('button[data-testid="confirm-reassign"]');
    await page.waitForSelector('.success-message');

    // Reassign JesPea back to AdminPrincipal
    await page.click('button[onclick="showTab(\'creators-management-tab\')"]');
    const jesPeaRow = await page.locator('tr').filter({ hasText: 'JesPea' });
    await jesPeaRow.locator('button[data-testid="reassign-button"]').click();
    await page.selectOption('select[name="new-admin"]', 'AdminPrincipal');
    await page.click('button[data-testid="confirm-reassign"]');
    await page.waitForSelector('.success-message');

    // Reassign AurBor back to AdminPrincipal
    await page.click('button[onclick="showTab(\'jugadores-management-tab\')"]');
    const aurBorRow = await page.locator('tr').filter({ hasText: 'AurBor' });
    await aurBorRow.locator('button[data-testid="reassign-button"]').click();
    await page.selectOption('select[name="new-admin"]', 'AdminPrincipal');
    await page.click('button[data-testid="confirm-reassign"]');
    await page.waitForSelector('.success-message');

    console.log('✅ All reassignments undone - users returned to AdminPrincipal');
  });

  test('Remove ArmJal as secondary administrator', async () => {
    // Navigate to Secondary Admins section
    await page.click('button[onclick="showTab(\'admins-management-tab\')"]');
    await page.waitForSelector('#admins-management-tab');

    // Find ArmJal in admin list
    const armjalRow = await page.locator('tr').filter({ hasText: 'ArmJal' });
    await expect(armjalRow).toBeVisible();

    // Click remove button for ArmJal
    await armjalRow.locator('button[data-testid="remove-admin-button"]').click();
    await page.waitForSelector('#confirm-remove-modal');

    // Confirm removal
    await page.click('button[data-testid="confirm-remove-admin"]');

    // Wait for success confirmation
    await page.waitForSelector('.success-message');

    // Verify ArmJal is no longer in admin list
    const armjalRowAfterRemoval = await page.locator('tr').filter({ hasText: 'ArmJal' });
    await expect(armjalRowAfterRemoval).not.toBeVisible();

    console.log('✅ ArmJal removed as secondary administrator successfully');
  });

  test('Final AdminPrincipal logout', async () => {
    // Click on User Options in header
    await page.click('[data-testid="user-options"]');
    await page.waitForSelector('[data-testid="logout-button"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Verify logout
    await page.waitForURL(/login|index/);

    console.log('✅ AdminPrincipal final logout completed');
  });
});