const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Quick Permission Analysis', () => {
  test('Analyze permission differences between users', async ({ page }) => {
    console.log('\n🔍 === QUICK PERMISSION ANALYSIS ===');

    try {
      // 1. Get kikejfer permissions
      console.log('\n1️⃣ === KIKEJFER PERMISSIONS ===');
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(2000);

      const kikejferInfo = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const tokenData = token ? JSON.parse(token) : null;

        return {
          hasToken: !!token,
          userId: tokenData?.userId || null,
          roles: tokenData?.roles || [],
          permissions: tokenData?.permissions || [],
          nickname: tokenData?.nickname || null,
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('📋 kikejfer token data:');
      console.log(`   User ID: ${kikejferInfo.userId}`);
      console.log(`   Nickname: ${kikejferInfo.nickname}`);
      console.log(`   Active role: ${kikejferInfo.activeRole}`);
      console.log(`   Roles: ${JSON.stringify(kikejferInfo.roles)}`);
      console.log(`   Permissions: ${JSON.stringify(kikejferInfo.permissions)}`);

      // Check available role functions
      const roleFunctions = await page.evaluate(() => {
        return {
          hasChangeRole: typeof changeRole === 'function',
          hasDetectRoleFromToken: typeof detectRoleFromToken === 'function',
          hasGetValidActiveRole: typeof getValidActiveRole === 'function',
          hasGetUserRolesFromSystem: typeof getUserRolesFromSystem === 'function'
        };
      });

      console.log('📋 Available role functions:');
      Object.entries(roleFunctions).forEach(([func, exists]) => {
        console.log(`   ${func}: ${exists ? '✅' : '❌'}`);
      });

      // 2. Test role change monitoring (short version)
      console.log('\n2️⃣ === TESTING PROFESOR ROLE CHANGE ===');

      // Set up dialog handler
      page.on('dialog', async dialog => {
        console.log(`📋 Dialog: "${dialog.message()}" (${dialog.type()})`);
        await dialog.accept();
      });

      // Monitor role changes
      await page.evaluate(() => {
        window.roleEvents = [];
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          if (key === 'activeRole') {
            window.roleEvents.push({
              timestamp: Date.now(),
              key: key,
              value: value,
              stack: new Error().stack.split('\n')[2]?.trim()
            });
            console.log(`📦 activeRole changed to: ${value}`);
          }
          return originalSetItem.call(this, key, value);
        };
      });

      // Execute role change
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
      await page.waitForTimeout(5000); // Monitor for 5 seconds

      const roleEvents = await page.evaluate(() => window.roleEvents || []);
      console.log(`📋 Role change events: ${roleEvents.length}`);
      roleEvents.forEach((event, i) => {
        const offset = event.timestamp - roleChangeStart;
        console.log(`   ${i + 1}. [+${offset}ms] activeRole = ${event.value}`);
      });

      // 3. Get AdminPrincipal permissions for comparison
      console.log('\n3️⃣ === ADMINPRINCIPAL PERMISSIONS ===');

      // Clear session and login as AdminPrincipal
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await login(page, 'AdminPrincipal');
      await page.waitForTimeout(2000);

      const adminInfo = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const tokenData = token ? JSON.parse(token) : null;

        return {
          userId: tokenData?.userId || null,
          roles: tokenData?.roles || [],
          permissions: tokenData?.permissions || [],
          nickname: tokenData?.nickname || null,
          activeRole: localStorage.getItem('activeRole')
        };
      });

      console.log('📋 AdminPrincipal token data:');
      console.log(`   User ID: ${adminInfo.userId}`);
      console.log(`   Nickname: ${adminInfo.nickname}`);
      console.log(`   Active role: ${adminInfo.activeRole}`);
      console.log(`   Roles: ${JSON.stringify(adminInfo.roles)}`);
      console.log(`   Permissions: ${JSON.stringify(adminInfo.permissions)}`);

      // 4. Permission comparison
      console.log('\n4️⃣ === PERMISSION COMPARISON ===');

      const kikejferRoles = kikejferInfo.roles || [];
      const adminRoles = adminInfo.roles || [];
      const kikejferPerms = kikejferInfo.permissions || [];
      const adminPerms = adminInfo.permissions || [];

      console.log('📋 ROLE DIFFERENCES:');
      console.log(`   kikejfer roles: [${kikejferRoles.join(', ')}]`);
      console.log(`   AdminPrincipal roles: [${adminRoles.join(', ')}]`);

      const missingRoles = adminRoles.filter(role => !kikejferRoles.includes(role));
      console.log(`   Roles kikejfer is missing: [${missingRoles.join(', ')}]`);

      console.log('📋 PERMISSION DIFFERENCES:');
      console.log(`   kikejfer permissions: [${kikejferPerms.join(', ')}]`);
      console.log(`   AdminPrincipal permissions: [${adminPerms.join(', ')}]`);

      const missingPerms = adminPerms.filter(perm => !kikejferPerms.includes(perm));
      console.log(`   Permissions kikejfer is missing: [${missingPerms.join(', ')}]`);

      // 5. Test AdminPrincipal role stability
      console.log('\n5️⃣ === TESTING ADMINPRINCIPAL ROLE STABILITY ===');

      // Check if AdminPrincipal has automatic role changes
      await page.evaluate(() => {
        window.adminRoleEvents = [];
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          if (key === 'activeRole') {
            window.adminRoleEvents.push({
              timestamp: Date.now(),
              value: value
            });
            console.log(`📦 AdminPrincipal activeRole changed to: ${value}`);
          }
          return originalSetItem.call(this, key, value);
        };
      });

      await page.waitForTimeout(3000);

      const adminRoleEvents = await page.evaluate(() => window.adminRoleEvents || []);
      console.log(`📋 AdminPrincipal role events during 3 seconds: ${adminRoleEvents.length}`);

      if (adminRoleEvents.length === 0) {
        console.log('✅ AdminPrincipal role remains stable (no automatic changes)');
      } else {
        adminRoleEvents.forEach((event, i) => {
          console.log(`   ${i + 1}. activeRole changed to: ${event.value}`);
        });
      }

      // 6. Summary
      console.log('\n6️⃣ === SUMMARY ===');

      console.log('📋 KEY FINDINGS:');

      if (missingRoles.length > 0) {
        console.log(`   🔑 kikejfer is missing these roles: ${missingRoles.join(', ')}`);
        console.log('   💡 Adding these roles might prevent automatic role changes');
      }

      if (missingPerms.length > 0) {
        console.log(`   🔐 kikejfer is missing these permissions: ${missingPerms.join(', ')}`);
        console.log('   💡 Adding these permissions might stabilize role selection');
      }

      if (roleEvents.some(e => e.value !== 'PPF')) {
        console.log('   ⚠️ kikejfer experiences automatic role changes');
      }

      if (adminRoleEvents.length === 0) {
        console.log('   ✅ AdminPrincipal does not experience automatic role changes');
      }

      console.log('\n📋 RECOMMENDATION:');
      if (missingRoles.includes('admin') || missingPerms.includes('admin')) {
        console.log('   🎯 Grant admin role/permissions to prevent automatic role switching');
      } else if (missingRoles.length > 0 || missingPerms.length > 0) {
        console.log(`   🎯 Grant missing roles/permissions: ${[...missingRoles, ...missingPerms].join(', ')}`);
      } else {
        console.log('   🤔 Permission difference not obvious - may be role hierarchy issue');
      }

    } catch (error) {
      console.log(`❌ Error in permission analysis: ${error.message}`);
      throw error;
    }
  });
});