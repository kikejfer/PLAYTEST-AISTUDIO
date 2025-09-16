const { test, expect } = require('@playwright/test');

test.describe('Navigation Service Core Functionality', () => {
  const testUsers = [
    { username: 'AdminPrincipal', password: 'kikejfer', role: 'ADP', panel: 'admin-principal-panel' },
    { username: 'kikejfer', password: '123', role: 'ADS', panel: 'admin-secundario-panel' },
    { username: 'admin', password: 'kikejfer', role: 'SPT', panel: 'support-panel' },
    { username: 'Toñi', password: '987', role: 'PCC', panel: 'creators-panel' },
    { username: 'AntLop', password: '1001', role: 'PPF', panel: 'teachers-panel' },
    { username: 'JaiGon', password: '654', role: 'JGD', panel: 'jugadores-panel' }
  ];

  for (const user of testUsers) {
    test(`Navigation Service initialization - ${user.username} (${user.role})`, async ({ page }) => {
      console.log(`🧭 Testing NavigationService for: ${user.username} (${user.role})`);
      
      // Login
      await page.goto('https://playtest-frontend.onrender.com/');
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('button[type="submit"]').click();
      
      // Wait for panel to load
      await page.waitForTimeout(4000);
      
      // Check if navigation-service.js loads without 404 errors
      const navigationService404 = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource').some(resource => 
          resource.name.includes('navigation-service.js') && 
          (resource.responseStart === 0 || resource.transferSize === 0)
        );
      });
      
      expect(navigationService404).toBe(false);
      console.log('✅ navigation-service.js loads without 404 errors');
      
      // Verify NavigationService is available globally
      const navigationServiceAvailable = await page.evaluate(() => {
        return {
          NavigationServiceClass: typeof window.NavigationService === 'function',
          navigationServiceInstance: typeof window.navigationService === 'object',
          navigationServiceInitialized: window.navigationService?.getStatus ? true : false
        };
      });
      
      expect(navigationServiceAvailable.NavigationServiceClass).toBe(true);
      expect(navigationServiceAvailable.navigationServiceInstance).toBe(true);
      expect(navigationServiceAvailable.navigationServiceInitialized).toBe(true);
      console.log('✅ NavigationService is globally available and initialized');
      
      // Get NavigationService status
      const navServiceStatus = await page.evaluate(() => {
        return window.navigationService.getStatus();
      });
      
      expect(navServiceStatus).toBeTruthy();
      expect(navServiceStatus.user).toBeTruthy();
      expect(navServiceStatus.role).toBeTruthy();
      console.log(`✅ NavigationService status: User=${navServiceStatus.user}, Role=${navServiceStatus.role}`);
      
      // Verify no console errors related to navigation service
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && (
          msg.text().includes('navigation-service') || 
          msg.text().includes('NavigationService')
        )) {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(consoleErrors.length).toBe(0);
      console.log('✅ No NavigationService console errors');
    });
  }

  test('Navigation Service - Support Button Injection', async ({ page }) => {
    console.log('🆘 Testing support button injection');
    
    // Login as Toñi (PCC with complex panel)
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Check for support button injection
    const supportButtonInfo = await page.evaluate(() => {
      const supportButtons = document.querySelectorAll('.nav-support-btn, button:has-text("Soporte")');
      const floatingContainer = document.querySelector('.navigation-service-floating');
      
      return {
        supportButtonCount: supportButtons.length,
        hasFloatingContainer: !!floatingContainer,
        supportButtonsInfo: Array.from(supportButtons).map(btn => ({
          text: btn.textContent,
          visible: btn.offsetParent !== null,
          clickable: !btn.disabled
        }))
      };
    });
    
    // Should have at least one support button
    expect(supportButtonInfo.supportButtonCount).toBeGreaterThan(0);
    console.log(`✅ Support buttons injected: ${supportButtonInfo.supportButtonCount}`);
    console.log(`📍 Floating container: ${supportButtonInfo.hasFloatingContainer}`);
    
    // Test support button functionality
    if (supportButtonInfo.supportButtonCount > 0) {
      const supportButtonClickable = supportButtonInfo.supportButtonsInfo.some(btn => 
        btn.visible && btn.clickable
      );
      expect(supportButtonClickable).toBe(true);
      console.log('✅ Support buttons are visible and clickable');
    }
  });

  test('Navigation Service - Role Detection', async ({ page }) => {
    console.log('🎭 Testing role detection across different panels');
    
    const roleTests = [
      { username: 'Toñi', password: '987', expectedRole: 'PCC' },
      { username: 'AntLop', password: '1001', expectedRole: 'PPF' },
      { username: 'JaiGon', password: '654', expectedRole: 'JGD' }
    ];
    
    for (const roleTest of roleTests) {
      // Login
      await page.goto('https://playtest-frontend.onrender.com/');
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill(roleTest.username);
      await page.locator('input[name="password"]').fill(roleTest.password);
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(3000);
      
      // Check role detection
      const detectedRole = await page.evaluate(() => {
        return window.navigationService.getStatus().role;
      });
      
      expect(detectedRole).toBe(roleTest.expectedRole);
      console.log(`✅ ${roleTest.username}: Role detected correctly as ${detectedRole}`);
    }
  });

  test('Navigation Service - User Detection', async ({ page }) => {
    console.log('👤 Testing user detection functionality');
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(3000);
    
    // Test user detection
    const userDetection = await page.evaluate(() => {
      const status = window.navigationService.getStatus();
      return {
        user: status.user,
        hasUser: !!status.user && status.user !== 'Unknown',
        role: status.role,
        supportEnabled: status.supportEnabled,
        notificationsEnabled: status.notificationsEnabled
      };
    });
    
    expect(userDetection.hasUser).toBe(true);
    expect(userDetection.user).toBe('Toñi');
    expect(userDetection.role).toBe('PCC');
    expect(userDetection.supportEnabled).toBe(true);
    
    console.log(`✅ User detected: ${userDetection.user}`);
    console.log(`🎭 Role: ${userDetection.role}`);
    console.log(`🆘 Support enabled: ${userDetection.supportEnabled}`);
    console.log(`📢 Notifications enabled: ${userDetection.notificationsEnabled}`);
  });

  test('Navigation Service - Refresh Functionality', async ({ page }) => {
    console.log('🔄 Testing NavigationService refresh functionality');
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(3000);
    
    // Get initial status
    const initialStatus = await page.evaluate(() => {
      return window.navigationService.getStatus();
    });
    
    // Simulate role change
    await page.evaluate(() => {
      localStorage.setItem('activeRole', 'PPF');
      window.navigationService.refresh();
    });
    
    await page.waitForTimeout(1000);
    
    // Get status after refresh
    const refreshedStatus = await page.evaluate(() => {
      return window.navigationService.getStatus();
    });
    
    expect(refreshedStatus.role).toBe('PPF');
    console.log(`✅ Role changed from ${initialStatus.role} to ${refreshedStatus.role}`);
    
    // Reset to original role
    await page.evaluate(() => {
      localStorage.setItem('activeRole', 'PCC');
    });
    
    console.log('✅ NavigationService refresh functionality works');
  });

  test('Navigation Service - Console Logging', async ({ page }) => {
    console.log('📝 Testing NavigationService console logging');
    
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('NavigationService') || msg.text().includes('🧭')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Verify expected console logs
    const expectedLogs = [
      '🧭 NavigationService initializing...',
      '✅ NavigationService initialized successfully',
      '🧭 Navigation Service loaded successfully'
    ];
    
    for (const expectedLog of expectedLogs) {
      const logFound = consoleLogs.some(log => log.includes(expectedLog.replace('🧭 ', '').replace('✅ ', '')));
      expect(logFound).toBe(true);
      console.log(`✅ Found log: ${expectedLog}`);
    }
    
    console.log(`📊 Total NavigationService logs: ${consoleLogs.length}`);
  });
});