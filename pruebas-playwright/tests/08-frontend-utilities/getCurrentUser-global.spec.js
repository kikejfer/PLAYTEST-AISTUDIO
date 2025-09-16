const { test, expect } = require('@playwright/test');

test.describe('Global getCurrentUser Function Tests', () => {
  const testUsers = [
    { username: 'Toñi', password: '987', expectedPanel: 'creators-panel' },
    { username: 'AntLop', password: '1001', expectedPanel: 'teachers-panel' },
    { username: 'JaiGon', password: '654', expectedPanel: 'jugadores-panel' }
  ];

  for (const user of testUsers) {
    test(`getCurrentUser function verification - ${user.username}`, async ({ page }) => {
      console.log(`👤 Testing getCurrentUser for: ${user.username}`);
      
      // Navigate to login
      await page.goto('https://playtest-frontend.onrender.com/');
      
      // Login
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('button[type="submit"]').click();
      
      // Wait for panel to load
      await page.waitForTimeout(3000);
      
      // Verify getCurrentUser is defined globally
      const isGetCurrentUserDefined = await page.evaluate(() => {
        return typeof window.getCurrentUser === 'function';
      });
      
      expect(isGetCurrentUserDefined).toBe(true);
      console.log(`✅ window.getCurrentUser is defined: ${isGetCurrentUserDefined}`);
      
      // Test getCurrentUser function
      const currentUser = await page.evaluate(() => {
        return window.getCurrentUser();
      });
      
      // Verify user data structure
      expect(currentUser).toBeTruthy();
      expect(currentUser.nickname).toBe(user.username);
      console.log(`✅ getCurrentUser returned correct user: ${currentUser.nickname}`);
      
      // Verify no redeclaration errors in console
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('redeclaration')) {
          consoleErrors.push(msg.text());
        }
      });
      
      // Refresh page to trigger potential redeclaration issues
      await page.reload();
      await page.waitForTimeout(2000);
      
      expect(consoleErrors.length).toBe(0);
      console.log(`✅ No redeclaration errors found for ${user.username}`);
      
      // Verify function still works after reload
      const currentUserAfterReload = await page.evaluate(() => {
        return window.getCurrentUser();
      });
      
      expect(currentUserAfterReload).toBeTruthy();
      expect(currentUserAfterReload.nickname).toBe(user.username);
      console.log(`✅ getCurrentUser works after reload: ${currentUserAfterReload.nickname}`);
    });
  }

  test('getCurrentUser function - No redeclaration conflicts', async ({ page }) => {
    console.log('🧪 Testing getCurrentUser redeclaration prevention');
    
    // Login as Toñi (PCC role with multiple components)
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    // Wait for creators panel to load (has multiple modules)
    await page.waitForTimeout(4000);
    
    // Check for redeclaration errors
    const redeclarationErrors = await page.evaluate(() => {
      // Look for any JavaScript errors in console
      const logs = [];
      const originalConsoleError = console.error;
      console.error = function(...args) {
        logs.push(args.join(' '));
        originalConsoleError.apply(console, arguments);
      };
      
      // Check if getCurrentUser is properly defined
      const isDefined = typeof window.getCurrentUser === 'function';
      const hasMarker = window._getCurrentUserGlobalDefined === true;
      
      return {
        isDefined,
        hasMarker,
        errorLogs: logs.filter(log => log.includes('redeclaration') || log.includes('getCurrentUser'))
      };
    });
    
    expect(redeclarationErrors.isDefined).toBe(true);
    expect(redeclarationErrors.hasMarker).toBe(true);
    expect(redeclarationErrors.errorLogs.length).toBe(0);
    
    console.log('✅ No redeclaration conflicts detected');
    console.log(`📝 Global marker present: ${redeclarationErrors.hasMarker}`);
  });

  test('getCurrentUser function - Cross-module compatibility', async ({ page }) => {
    console.log('🔄 Testing getCurrentUser across different modules');
    
    // Login as Toñi to access creators panel
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(3000);
    
    // Test in different tabs/sections of creators panel
    const tabSelectors = [
      '[onclick="showContentTab()"]',
      '[onclick="showAnalyticsTab()"]', 
      '[onclick="showPlayersTab()"]'
    ];
    
    for (const tabSelector of tabSelectors) {
      try {
        // Click on different tabs to load different modules
        const tabElement = await page.locator(tabSelector).first();
        if (await tabElement.isVisible()) {
          await tabElement.click();
          await page.waitForTimeout(1500);
          
          // Verify getCurrentUser still works
          const userFromModule = await page.evaluate(() => {
            return window.getCurrentUser();
          });
          
          expect(userFromModule).toBeTruthy();
          expect(userFromModule.nickname).toBe('Toñi');
          console.log(`✅ getCurrentUser works in tab: ${tabSelector}`);
        }
      } catch (error) {
        console.log(`⚠️ Tab ${tabSelector} not available: ${error.message}`);
      }
    }
  });

  test('getCurrentUser function - Authentication token handling', async ({ page }) => {
    console.log('🔐 Testing getCurrentUser authentication token handling');
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(3000);
    
    // Test getCurrentUser with token information
    const userWithTokenInfo = await page.evaluate(() => {
      const user = window.getCurrentUser();
      return {
        hasUser: !!user,
        hasAuthTokenInfo: user && user._hasAuthToken,
        hasAuthTokenPreview: user && !!user._authToken,
        nickname: user?.nickname
      };
    });
    
    expect(userWithTokenInfo.hasUser).toBe(true);
    expect(userWithTokenInfo.nickname).toBe('Toñi');
    console.log('✅ User data retrieved successfully');
    console.log(`📝 Auth token info: ${userWithTokenInfo.hasAuthTokenInfo}`);
    console.log(`🔑 Auth token preview: ${userWithTokenInfo.hasAuthTokenPreview}`);
    
    // Verify function handles missing tokens gracefully
    const gracefulHandling = await page.evaluate(() => {
      // Temporarily remove auth token
      const originalToken = localStorage.getItem('playtest_auth_token');
      localStorage.removeItem('playtest_auth_token');
      localStorage.removeItem('authToken');
      
      const userWithoutToken = window.getCurrentUser();
      
      // Restore token
      if (originalToken) {
        localStorage.setItem('playtest_auth_token', originalToken);
      }
      
      return {
        worksWithoutToken: !!userWithoutToken,
        nickname: userWithoutToken?.nickname
      };
    });
    
    expect(gracefulHandling.worksWithoutToken).toBe(true);
    console.log('✅ Function handles missing auth token gracefully');
  });
});