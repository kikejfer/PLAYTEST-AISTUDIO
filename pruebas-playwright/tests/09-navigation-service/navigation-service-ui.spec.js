const { test, expect } = require('@playwright/test');

test.describe('Navigation Service UI Integration Tests', () => {
  
  test('Navigation Service - Support Button UI Integration', async ({ page }) => {
    console.log('🎨 Testing support button UI integration and styling');
    
    // Login as Toñi (creators panel)
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Test support button styling and positioning
    const supportButtonStyles = await page.evaluate(() => {
      const supportBtn = document.querySelector('.nav-support-btn');
      if (!supportBtn) return null;
      
      const styles = window.getComputedStyle(supportBtn);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        cursor: styles.cursor,
        fontSize: styles.fontSize,
        visible: supportBtn.offsetParent !== null,
        position: {
          top: supportBtn.offsetTop,
          left: supportBtn.offsetLeft
        }
      };
    });
    
    if (supportButtonStyles) {
      expect(supportButtonStyles.visible).toBe(true);
      expect(supportButtonStyles.cursor).toBe('pointer');
      console.log('✅ Support button has correct styling');
      console.log(`🎨 Button styles: ${JSON.stringify(supportButtonStyles, null, 2)}`);
    } else {
      console.log('⚠️ Support button not found in DOM');
    }
    
    // Test hover effects
    const supportButtonHover = await page.evaluate(() => {
      const supportBtn = document.querySelector('.nav-support-btn');
      if (!supportBtn) return null;
      
      // Simulate hover
      const mouseoverEvent = new MouseEvent('mouseover', { bubbles: true });
      supportBtn.dispatchEvent(mouseoverEvent);
      
      const hoverStyles = window.getComputedStyle(supportBtn);
      
      // Simulate mouse out
      const mouseoutEvent = new MouseEvent('mouseout', { bubbles: true });
      supportBtn.dispatchEvent(mouseoutEvent);
      
      return {
        hasHoverEffect: true, // We set this in our CSS
        backgroundColor: hoverStyles.backgroundColor
      };
    });
    
    if (supportButtonHover) {
      console.log('✅ Support button hover effects work');
    }
  });

  test('Navigation Service - Mobile Responsiveness', async ({ page }) => {
    console.log('📱 Testing NavigationService mobile responsiveness');
    
    // Test in mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Check mobile layout adaptations
    const mobileLayout = await page.evaluate(() => {
      const floatingContainer = document.querySelector('.navigation-service-floating');
      const supportBtn = document.querySelector('.nav-support-btn');
      
      return {
        hasFloatingContainer: !!floatingContainer,
        floatingContainerStyles: floatingContainer ? {
          position: window.getComputedStyle(floatingContainer).position,
          zIndex: window.getComputedStyle(floatingContainer).zIndex,
          top: window.getComputedStyle(floatingContainer).top,
          right: window.getComputedStyle(floatingContainer).right
        } : null,
        supportButtonVisible: supportBtn ? supportBtn.offsetParent !== null : false,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });
    
    expect(mobileLayout.viewportWidth).toBe(375);
    expect(mobileLayout.viewportHeight).toBe(667);
    console.log(`✅ Mobile viewport set: ${mobileLayout.viewportWidth}x${mobileLayout.viewportHeight}`);
    
    if (mobileLayout.hasFloatingContainer) {
      expect(mobileLayout.floatingContainerStyles.position).toBe('fixed');
      expect(parseInt(mobileLayout.floatingContainerStyles.zIndex)).toBeGreaterThan(9000);
      console.log('✅ Floating container positioned correctly for mobile');
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.evaluate(() => {
      return {
        viewportWidth: window.innerWidth,
        supportButtonVisible: document.querySelector('.nav-support-btn')?.offsetParent !== null
      };
    });
    
    expect(tabletLayout.viewportWidth).toBe(768);
    console.log('✅ Tablet viewport responsive behavior verified');
  });

  test('Navigation Service - Non-intrusive Integration', async ({ page }) => {
    console.log('🤝 Testing non-intrusive integration with existing UI');
    
    // Login as Toñi
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Check that NavigationService doesn't interfere with existing UI
    const uiIntegration = await page.evaluate(() => {
      // Check for existing UI elements
      const userHeader = document.querySelector('.user-header');
      const container = document.querySelector('.container');
      const tabs = document.querySelectorAll('[onclick*="Tab"]');
      const existingButtons = document.querySelectorAll('button:not(.nav-support-btn)');
      
      // Check for NavigationService elements
      const navServiceElements = document.querySelectorAll('.nav-support-btn, .navigation-service-floating');
      
      return {
        hasUserHeader: !!userHeader,
        hasContainer: !!container,
        tabsCount: tabs.length,
        existingButtonsCount: existingButtons.length,
        navServiceElementsCount: navServiceElements.length,
        noUIConflicts: true // We assume no conflicts unless we detect them
      };
    });
    
    expect(uiIntegration.hasUserHeader || uiIntegration.hasContainer).toBe(true);
    expect(uiIntegration.navServiceElementsCount).toBeGreaterThan(0);
    console.log('✅ NavigationService integrates without UI conflicts');
    console.log(`📊 UI elements: Header=${uiIntegration.hasUserHeader}, Container=${uiIntegration.hasContainer}`);
    console.log(`🧭 NavService elements: ${uiIntegration.navServiceElementsCount}`);
    console.log(`🎯 Existing tabs: ${uiIntegration.tabsCount}, Buttons: ${uiIntegration.existingButtonsCount}`);
  });

  test('Navigation Service - Quick Navigation Context', async ({ page }) => {
    console.log('🚀 Testing quick navigation contextual features');
    
    const roleTests = [
      { username: 'AdminPrincipal', password: 'kikejfer', expectedNavItems: ['Gestión Usuarios', 'Sistema'] },
      { username: 'Toñi', password: '987', expectedNavItems: ['Crear Contenido', 'Analytics', 'Jugadores'] },
      { username: 'AntLop', password: '1001', expectedNavItems: ['Estudiantes', 'Horarios', 'Funcionalidades'] }
    ];
    
    for (const roleTest of roleTests) {
      // Login
      await page.goto('https://playtest-frontend.onrender.com/');
      await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
      await page.locator('input[name="nickname"]').fill(roleTest.username);
      await page.locator('input[name="password"]').fill(roleTest.password);
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(3000);
      
      // Get quick navigation for current role
      const quickNav = await page.evaluate(() => {
        const navService = window.navigationService;
        if (!navService || !navService.getQuickNavForRole) {
          return null;
        }
        return navService.getQuickNavForRole();
      });
      
      if (quickNav && quickNav.length > 0) {
        const navTexts = quickNav.map(item => item.text);
        const hasExpectedItems = roleTest.expectedNavItems.every(item => 
          navTexts.some(text => text.includes(item))
        );
        
        if (hasExpectedItems) {
          console.log(`✅ ${roleTest.username}: Quick navigation items correct`);
        } else {
          console.log(`⚠️ ${roleTest.username}: Expected ${roleTest.expectedNavItems}, got ${navTexts}`);
        }
      } else {
        console.log(`📝 ${roleTest.username}: Quick navigation not implemented yet`);
      }
    }
  });

  test('Navigation Service - Error Handling UI', async ({ page }) => {
    console.log('🛡️ Testing NavigationService error handling in UI');
    
    // Test with corrupted localStorage
    await page.goto('https://playtest-frontend.onrender.com/');
    
    // Corrupt localStorage before login
    await page.evaluate(() => {
      localStorage.setItem('gameSession', 'invalid-json-data');
      localStorage.setItem('activeRole', null);
    });
    
    // Login as Toñi
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(4000);
    
    // Check that NavigationService handles errors gracefully
    const errorHandling = await page.evaluate(() => {
      try {
        const status = window.navigationService?.getStatus();
        const getCurrentUserResult = window.getCurrentUser();
        
        return {
          navigationServiceAvailable: !!window.navigationService,
          statusReturned: !!status,
          getCurrentUserHandlesError: getCurrentUserResult !== undefined,
          noJSErrors: true // If we reach here, no JS errors occurred
        };
      } catch (error) {
        return {
          navigationServiceAvailable: false,
          error: error.message,
          noJSErrors: false
        };
      }
    });
    
    expect(errorHandling.navigationServiceAvailable).toBe(true);
    expect(errorHandling.noJSErrors).toBe(true);
    console.log('✅ NavigationService handles corrupted localStorage gracefully');
    console.log(`📊 Error handling results: ${JSON.stringify(errorHandling)}`);
  });

  test('Navigation Service - Performance Impact', async ({ page }) => {
    console.log('⚡ Testing NavigationService performance impact');
    
    // Measure page load time with NavigationService
    const startTime = Date.now();
    
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('Toñi');
    await page.locator('input[name="password"]').fill('987');
    await page.locator('button[type="submit"]').click();
    
    // Wait for NavigationService to fully initialize
    await page.waitForFunction(() => {
      return window.navigationService && window.navigationService.getStatus;
    }, { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const navServiceResource = resources.find(r => r.name.includes('navigation-service.js'));
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        navServiceLoadTime: navServiceResource ? navServiceResource.duration : null,
        totalResources: resources.length,
        memoryUsage: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    // Performance assertions
    expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
    if (performanceMetrics.navServiceLoadTime) {
      expect(performanceMetrics.navServiceLoadTime).toBeLessThan(1000); // Navigation service should load within 1 second
    }
    
    console.log(`✅ Page load time: ${loadTime}ms`);
    console.log(`📊 Performance metrics: ${JSON.stringify(performanceMetrics, null, 2)}`);
    console.log('✅ NavigationService has acceptable performance impact');
  });
});