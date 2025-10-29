const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Investigate Permission System', () => {
  test('Analyze permission system to prevent automatic role changes', async ({ page }) => {
    console.log('\n🔍 === INVESTIGATING PERMISSION SYSTEM ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // 1. Analyze user permissions and roles
      console.log('\n1️⃣ === ANALYZING USER PERMISSIONS AND ROLES ===');

      const userTokenInfo = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const tokenData = token ? JSON.parse(token) : null;

        return {
          hasToken: !!token,
          tokenData: tokenData,
          roles: tokenData?.roles || [],
          userId: tokenData?.userId || null,
          permissions: tokenData?.permissions || [],
          exp: tokenData?.exp || null
        };
      });

      console.log('📋 User token analysis:');
      console.log(`   Has token: ${userTokenInfo.hasToken}`);
      console.log(`   User ID: ${userTokenInfo.userId}`);
      console.log(`   Roles: ${JSON.stringify(userTokenInfo.roles)}`);
      console.log(`   Permissions: ${JSON.stringify(userTokenInfo.permissions)}`);
      console.log(`   Token expiry: ${userTokenInfo.exp ? new Date(userTokenInfo.exp * 1000) : 'N/A'}`);

      // 2. Test role validation functions
      console.log('\n2️⃣ === TESTING ROLE VALIDATION FUNCTIONS ===');

      const roleValidationInfo = await page.evaluate(() => {
        // Check if there are any role validation functions available
        const functions = [];

        // Common role validation function names
        const possibleFunctions = [
          'validateRole',
          'checkRolePermissions',
          'hasRoleAccess',
          'canAccessRole',
          'validateUserRole',
          'isRoleValid',
          'checkPermissions',
          'hasPermission'
        ];

        possibleFunctions.forEach(funcName => {
          if (typeof window[funcName] === 'function') {
            functions.push({
              name: funcName,
              type: 'global',
              code: window[funcName].toString().substring(0, 200) + '...'
            });
          }
        });

        return {
          availableFunctions: functions,
          windowKeys: Object.keys(window).filter(key =>
            key.toLowerCase().includes('role') ||
            key.toLowerCase().includes('permission') ||
            key.toLowerCase().includes('auth')
          )
        };
      });

      console.log('📋 Role validation functions:');
      roleValidationInfo.availableFunctions.forEach(func => {
        console.log(`   ${func.name}: ${func.code}`);
      });

      console.log('📋 Window keys related to roles/permissions:');
      roleValidationInfo.windowKeys.forEach(key => {
        console.log(`   ${key}`);
      });

      // 3. Navigate to Profesor panel and capture all role change activity
      console.log('\n3️⃣ === MONITORING ROLE CHANGE VALIDATION ===');

      // Set up comprehensive monitoring before role change
      await page.evaluate(() => {
        window.roleChangeEvents = [];

        // Monitor localStorage access
        const originalGetItem = localStorage.getItem;
        const originalSetItem = localStorage.setItem;

        localStorage.getItem = function(key) {
          const value = originalGetItem.call(this, key);
          if (key === 'activeRole' || key === 'token') {
            window.roleChangeEvents.push({
              timestamp: Date.now(),
              type: 'localStorage.getItem',
              key: key,
              value: value,
              stack: new Error().stack.split('\n')[2]?.trim()
            });
          }
          return value;
        };

        localStorage.setItem = function(key, value) {
          if (key === 'activeRole' || key === 'token') {
            window.roleChangeEvents.push({
              timestamp: Date.now(),
              type: 'localStorage.setItem',
              key: key,
              value: value,
              stack: new Error().stack.split('\n')[2]?.trim()
            });
          }
          return originalSetItem.call(this, key, value);
        };

        // Monitor function calls related to roles
        if (typeof changeRole === 'function') {
          const originalChangeRole = changeRole;
          window.changeRole = function(...args) {
            window.roleChangeEvents.push({
              timestamp: Date.now(),
              type: 'changeRole.called',
              arguments: args,
              stack: new Error().stack.split('\n')[2]?.trim()
            });
            return originalChangeRole.apply(this, args);
          };
        }

        console.log('🔍 Role change monitoring setup complete');
      });

      // Execute role change to Profesor
      console.log('📋 Executing changeRole to Profesor...');
      const roleChangeStart = Date.now();

      await page.evaluate(() => {
        const roleObj = {
          name: 'Profesor',
          code: 'PPF',
          panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
        };
        changeRole(roleObj);
      });

      await page.waitForURL('**/teachers-panel-schedules', { timeout: 10000 });
      console.log('✅ Navigated to Profesor panel');

      // Wait and monitor for automatic role changes
      await page.waitForTimeout(15000); // Wait 15 seconds to capture automatic changes

      // Get all role change events
      const roleChangeEvents = await page.evaluate(() => {
        return window.roleChangeEvents || [];
      });

      console.log(`📋 Total role change events: ${roleChangeEvents.length}`);
      roleChangeEvents.forEach((event, i) => {
        const timeOffset = event.timestamp - roleChangeStart;
        console.log(`   ${i + 1}. [+${timeOffset}ms] ${event.type}`);
        if (event.key) {
          console.log(`      ${event.key} = ${event.value}`);
        }
        if (event.arguments) {
          console.log(`      args: ${JSON.stringify(event.arguments)}`);
        }
        if (event.stack) {
          console.log(`      from: ${event.stack}`);
        }
      });

      // 4. Test different user roles for comparison
      console.log('\n4️⃣ === COMPARING WITH DIFFERENT USER ROLES ===');

      // Get current AdminPrincipal token info for comparison
      console.log('📋 Logging in as AdminPrincipal for comparison...');

      // Logout current user
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Login as AdminPrincipal
      await login(page, 'AdminPrincipal');
      await page.waitForTimeout(2000);

      const adminTokenInfo = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const tokenData = token ? JSON.parse(token) : null;

        return {
          roles: tokenData?.roles || [],
          permissions: tokenData?.permissions || [],
          userId: tokenData?.userId || null
        };
      });

      console.log('📋 AdminPrincipal token analysis:');
      console.log(`   User ID: ${adminTokenInfo.userId}`);
      console.log(`   Roles: ${JSON.stringify(adminTokenInfo.roles)}`);
      console.log(`   Permissions: ${JSON.stringify(adminTokenInfo.permissions)}`);

      // 5. Compare permissions between users
      console.log('\n5️⃣ === PERMISSION COMPARISON ===');

      console.log('📋 KIKEJFER vs ADMINPRINCIPAL:');

      // Compare roles
      const kikejferRoles = userTokenInfo.roles || [];
      const adminRoles = adminTokenInfo.roles || [];

      console.log(`   kikejfer roles: ${kikejferRoles.join(', ')}`);
      console.log(`   AdminPrincipal roles: ${adminRoles.join(', ')}`);

      const rolesDiff = adminRoles.filter(role => !kikejferRoles.includes(role));
      console.log(`   Roles only AdminPrincipal has: ${rolesDiff.join(', ')}`);

      // Compare permissions
      const kikejferPerms = userTokenInfo.permissions || [];
      const adminPerms = adminTokenInfo.permissions || [];

      console.log(`   kikejfer permissions: ${kikejferPerms.join(', ')}`);
      console.log(`   AdminPrincipal permissions: ${adminPerms.join(', ')}`);

      const permsDiff = adminPerms.filter(perm => !kikejferPerms.includes(perm));
      console.log(`   Permissions only AdminPrincipal has: ${permsDiff.join(', ')}`);

      // 6. Check if there's role hierarchy or priority system
      console.log('\n6️⃣ === CHECKING ROLE HIERARCHY SYSTEM ===');

      const hierarchyInfo = await page.evaluate(() => {
        // Look for role hierarchy configuration
        const possibleHierarchyKeys = [
          'roleHierarchy',
          'rolePriority',
          'roleOrder',
          'userRoleConfig',
          'roleConfig',
          'authConfig'
        ];

        const foundConfigs = {};

        possibleHierarchyKeys.forEach(key => {
          if (window[key]) {
            foundConfigs[key] = window[key];
          }
        });

        return {
          configs: foundConfigs,
          hasRoleManager: typeof window.RoleManager !== 'undefined',
          hasAuthManager: typeof window.AuthManager !== 'undefined'
        };
      });

      console.log('📋 Role hierarchy analysis:');
      console.log(`   Has RoleManager: ${hierarchyInfo.hasRoleManager}`);
      console.log(`   Has AuthManager: ${hierarchyInfo.hasAuthManager}`);
      console.log(`   Found configs: ${Object.keys(hierarchyInfo.configs).join(', ')}`);

      Object.entries(hierarchyInfo.configs).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value)}`);
      });

      // Take final screenshot
      await page.screenshot({ path: 'permission-system-analysis.png', fullPage: true });
      console.log('📸 Screenshot saved: permission-system-analysis.png');

      // 7. Summary and recommendations
      console.log('\n7️⃣ === SUMMARY AND RECOMMENDATIONS ===');

      console.log('📋 FINDINGS:');

      // Analyze the automatic role change pattern
      const automaticChanges = roleChangeEvents.filter(event =>
        event.type === 'localStorage.setItem' &&
        event.key === 'activeRole' &&
        !event.stack?.includes('changeRole')
      );

      if (automaticChanges.length > 0) {
        console.log(`   🔍 Found ${automaticChanges.length} automatic role changes`);
        automaticChanges.forEach(change => {
          console.log(`      At +${change.timestamp - roleChangeStart}ms: activeRole changed to ${change.value}`);
        });
      }

      console.log('\n📋 PERMISSION REQUIREMENTS TO PREVENT AUTOMATIC ROLE CHANGES:');
      if (permsDiff.length > 0) {
        console.log(`   Missing permissions: ${permsDiff.join(', ')}`);
      }
      if (rolesDiff.length > 0) {
        console.log(`   Missing roles: ${rolesDiff.join(', ')}`);
      }

    } catch (error) {
      console.log(`❌ Error in permission investigation: ${error.message}`);
      throw error;
    }
  });
});