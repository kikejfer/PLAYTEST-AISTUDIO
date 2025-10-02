const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Compare User Permissions', () => {
  test('Compare kikejfer vs AdminPrincipal permissions', async ({ page }) => {
    console.log('\n🔍 === COMPARING USER PERMISSIONS ===');

    try {
      // 1. Get kikejfer permissions
      console.log('\n1️⃣ === KIKEJFER TOKEN ANALYSIS ===');
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');

      const kikejferToken = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');

        let tokenData = null;
        try {
          tokenData = token ? JSON.parse(token) : null;
        } catch (e) {
          console.log('Error parsing token:', e);
        }

        return {
          hasToken: !!token,
          tokenRaw: token,
          tokenData: tokenData,
          activeRole: activeRole,
          userId: tokenData?.userId || null,
          nickname: tokenData?.nickname || null,
          roles: tokenData?.roles || [],
          permissions: tokenData?.permissions || [],
          userType: tokenData?.userType || null,
          isAdmin: tokenData?.isAdmin || false
        };
      });

      console.log('📋 kikejfer data:');
      console.log(`   Has token: ${kikejferToken.hasToken}`);
      console.log(`   User ID: ${kikejferToken.userId}`);
      console.log(`   Nickname: ${kikejferToken.nickname}`);
      console.log(`   User type: ${kikejferToken.userType}`);
      console.log(`   Is admin: ${kikejferToken.isAdmin}`);
      console.log(`   Active role: ${kikejferToken.activeRole}`);
      console.log(`   Roles: [${kikejferToken.roles.join(', ')}]`);
      console.log(`   Permissions: [${kikejferToken.permissions.join(', ')}]`);

      // 2. Get AdminPrincipal permissions
      console.log('\n2️⃣ === ADMINPRINCIPAL TOKEN ANALYSIS ===');

      // Clear session
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await login(page, 'AdminPrincipal');
      console.log('✅ Logged in as AdminPrincipal');

      const adminToken = await page.evaluate(() => {
        const token = localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');

        let tokenData = null;
        try {
          tokenData = token ? JSON.parse(token) : null;
        } catch (e) {
          console.log('Error parsing token:', e);
        }

        return {
          hasToken: !!token,
          tokenRaw: token,
          tokenData: tokenData,
          activeRole: activeRole,
          userId: tokenData?.userId || null,
          nickname: tokenData?.nickname || null,
          roles: tokenData?.roles || [],
          permissions: tokenData?.permissions || [],
          userType: tokenData?.userType || null,
          isAdmin: tokenData?.isAdmin || false
        };
      });

      console.log('📋 AdminPrincipal data:');
      console.log(`   Has token: ${adminToken.hasToken}`);
      console.log(`   User ID: ${adminToken.userId}`);
      console.log(`   Nickname: ${adminToken.nickname}`);
      console.log(`   User type: ${adminToken.userType}`);
      console.log(`   Is admin: ${adminToken.isAdmin}`);
      console.log(`   Active role: ${adminToken.activeRole}`);
      console.log(`   Roles: [${adminToken.roles.join(', ')}]`);
      console.log(`   Permissions: [${adminToken.permissions.join(', ')}]`);

      // 3. Direct comparison
      console.log('\n3️⃣ === DIRECT COMPARISON ===');

      console.log('📋 USER TYPE COMPARISON:');
      console.log(`   kikejfer userType: ${kikejferToken.userType || 'undefined'}`);
      console.log(`   AdminPrincipal userType: ${adminToken.userType || 'undefined'}`);

      console.log('📋 ADMIN STATUS COMPARISON:');
      console.log(`   kikejfer isAdmin: ${kikejferToken.isAdmin}`);
      console.log(`   AdminPrincipal isAdmin: ${adminToken.isAdmin}`);

      console.log('📋 ROLE COMPARISON:');
      const kikejferRoles = kikejferToken.roles || [];
      const adminRoles = adminToken.roles || [];

      console.log(`   kikejfer roles: [${kikejferRoles.join(', ')}]`);
      console.log(`   AdminPrincipal roles: [${adminRoles.join(', ')}]`);

      const missingRoles = adminRoles.filter(role => !kikejferRoles.includes(role));
      const extraRoles = kikejferRoles.filter(role => !adminRoles.includes(role));

      if (missingRoles.length > 0) {
        console.log(`   ❌ kikejfer is missing roles: [${missingRoles.join(', ')}]`);
      }
      if (extraRoles.length > 0) {
        console.log(`   ➕ kikejfer has extra roles: [${extraRoles.join(', ')}]`);
      }
      if (missingRoles.length === 0 && extraRoles.length === 0) {
        console.log(`   ✅ Both users have identical roles`);
      }

      console.log('📋 PERMISSION COMPARISON:');
      const kikejferPerms = kikejferToken.permissions || [];
      const adminPerms = adminToken.permissions || [];

      console.log(`   kikejfer permissions: [${kikejferPerms.join(', ')}]`);
      console.log(`   AdminPrincipal permissions: [${adminPerms.join(', ')}]`);

      const missingPerms = adminPerms.filter(perm => !kikejferPerms.includes(perm));
      const extraPerms = kikejferPerms.filter(perm => !adminPerms.includes(perm));

      if (missingPerms.length > 0) {
        console.log(`   ❌ kikejfer is missing permissions: [${missingPerms.join(', ')}]`);
      }
      if (extraPerms.length > 0) {
        console.log(`   ➕ kikejfer has extra permissions: [${extraPerms.join(', ')}]`);
      }
      if (missingPerms.length === 0 && extraPerms.length === 0) {
        console.log(`   ✅ Both users have identical permissions`);
      }

      // 4. Check role validation functions
      console.log('\n4️⃣ === ROLE VALIDATION FUNCTION ANALYSIS ===');

      const roleValidation = await page.evaluate(() => {
        // Test role validation with current user
        const results = {};

        // Test detectRoleFromToken function
        if (typeof detectRoleFromToken === 'function') {
          try {
            results.detectRoleFromToken = detectRoleFromToken();
          } catch (e) {
            results.detectRoleFromToken = `Error: ${e.message}`;
          }
        }

        // Test getValidActiveRole function
        if (typeof getValidActiveRole === 'function') {
          try {
            results.getValidActiveRole = getValidActiveRole();
          } catch (e) {
            results.getValidActiveRole = `Error: ${e.message}`;
          }
        }

        // Test getUserRolesFromSystem function
        if (typeof getUserRolesFromSystem === 'function') {
          try {
            results.getUserRolesFromSystem = getUserRolesFromSystem();
          } catch (e) {
            results.getUserRolesFromSystem = `Error: ${e.message}`;
          }
        }

        return results;
      });

      console.log('📋 AdminPrincipal role validation results:');
      Object.entries(roleValidation).forEach(([func, result]) => {
        console.log(`   ${func}: ${JSON.stringify(result)}`);
      });

      // 5. Summary and recommendation
      console.log('\n5️⃣ === SUMMARY AND RECOMMENDATION ===');

      console.log('📋 KEY DIFFERENCES:');

      const hasUserTypeDiff = kikejferToken.userType !== adminToken.userType;
      const hasAdminStatusDiff = kikejferToken.isAdmin !== adminToken.isAdmin;
      const hasRoleDiff = missingRoles.length > 0 || extraRoles.length > 0;
      const hasPermDiff = missingPerms.length > 0 || extraPerms.length > 0;

      if (hasUserTypeDiff) {
        console.log(`   🔍 User type difference: ${kikejferToken.userType} vs ${adminToken.userType}`);
      }

      if (hasAdminStatusDiff) {
        console.log(`   🔍 Admin status difference: ${kikejferToken.isAdmin} vs ${adminToken.isAdmin}`);
      }

      if (hasRoleDiff) {
        console.log(`   🔍 Role differences found`);
      }

      if (hasPermDiff) {
        console.log(`   🔍 Permission differences found`);
      }

      console.log('\n📋 RECOMMENDATION TO PREVENT AUTOMATIC ROLE CHANGES:');

      if (hasAdminStatusDiff && !kikejferToken.isAdmin) {
        console.log('   🎯 PRIORITY: Set kikejfer.isAdmin = true');
      }

      if (missingRoles.includes('admin') || missingRoles.includes('administrator')) {
        console.log('   🎯 PRIORITY: Add admin/administrator role to kikejfer');
      }

      if (missingPerms.includes('admin') || missingPerms.includes('role_management')) {
        console.log('   🎯 PRIORITY: Add admin/role_management permissions to kikejfer');
      }

      if (hasUserTypeDiff) {
        console.log(`   💡 Consider changing kikejfer userType from "${kikejferToken.userType}" to "${adminToken.userType}"`);
      }

      if (!hasUserTypeDiff && !hasAdminStatusDiff && !hasRoleDiff && !hasPermDiff) {
        console.log('   🤔 Users have identical permissions - issue may be in role detection logic');
      }

    } catch (error) {
      console.log(`❌ Error in permission comparison: ${error.message}`);
      throw error;
    }
  });
});