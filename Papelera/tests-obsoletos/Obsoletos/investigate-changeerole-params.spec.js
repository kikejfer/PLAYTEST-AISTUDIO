const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Investigate changeRole Parameters', () => {
  test('Analyze changeRole function parameters and usage', async ({ page }) => {
    console.log('\n🔍 === INVESTIGATING CHANGEEROLE FUNCTION PARAMETERS ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      // 1. Inspect the changeRole function definition
      console.log('\n1️⃣ === EXAMINING CHANGEEROLE FUNCTION ===');

      const functionAnalysis = await page.evaluate(() => {
        const analysis = {
          exists: typeof changeRole === 'function',
          source: null,
          parameters: null,
          error: null
        };

        try {
          if (typeof changeRole === 'function') {
            // Get function source code
            analysis.source = changeRole.toString();

            // Try to determine parameter count
            const funcStr = changeRole.toString();
            const paramMatch = funcStr.match(/function[^(]*\(([^)]*)\)/);
            if (paramMatch) {
              analysis.parameters = paramMatch[1];
            }
          }
        } catch (error) {
          analysis.error = error.message;
        }

        return analysis;
      });

      console.log(`📋 changeRole function exists: ${functionAnalysis.exists}`);
      if (functionAnalysis.source) {
        console.log(`📋 Function source code:`);
        console.log(functionAnalysis.source);
        console.log(`📋 Parameters: "${functionAnalysis.parameters}"`);
      }
      if (functionAnalysis.error) {
        console.log(`❌ Error analyzing function: ${functionAnalysis.error}`);
      }

      // 2. Test different parameter variations
      console.log('\n2️⃣ === TESTING DIFFERENT PARAMETERS ===');

      const testParams = [
        'Profesor',
        'profesor',
        'PROFESOR',
        'Creador',
        'creador',
        'CREADOR',
        'Creador de Contenido',
        'creador-de-contenido',
        'teacher',
        'creator',
        '2', // Role ID
        '3', // Role ID
        { role: 'Profesor' },
        { name: 'Profesor' },
        { id: 2 }
      ];

      for (const param of testParams) {
        try {
          console.log(`\n📋 Testing changeRole(${JSON.stringify(param)})...`);

          const result = await page.evaluate((testParam) => {
            try {
              // Get current role before
              const currentBefore = document.querySelector('#current-role-name')?.textContent || 'unknown';

              // Call function
              const result = changeRole(testParam);

              // Check if role changed immediately
              const currentAfter = document.querySelector('#current-role-name')?.textContent || 'unknown';

              return {
                success: true,
                result: result,
                roleBefore: currentBefore,
                roleAfter: currentAfter,
                changed: currentBefore !== currentAfter
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }, param);

          console.log(`   Result: ${JSON.stringify(result)}`);

          // If role changed, wait a bit and check again
          if (result.success && result.changed) {
            await page.waitForTimeout(2000);
            const finalRole = await page.locator('#current-role-name').textContent();
            console.log(`   Final role after 2s: "${finalRole}"`);

            if (finalRole && finalRole.includes('Profesor')) {
              console.log(`   🎯 SUCCESS! Found working parameter: ${JSON.stringify(param)}`);
              break;
            }
          }

        } catch (error) {
          console.log(`   ❌ Error testing ${JSON.stringify(param)}: ${error.message}`);
        }
      }

      // 3. Investigate global variables that might be used
      console.log('\n3️⃣ === INVESTIGATING GLOBAL VARIABLES ===');

      const globalVars = await page.evaluate(() => {
        const vars = {};

        // Check for common role-related variables
        const checkVars = [
          'roles', 'ROLES', 'userRoles', 'availableRoles',
          'currentUser', 'user', 'USER',
          'roleMap', 'roleMapping', 'ROLE_MAP',
          'roleIds', 'ROLE_IDS'
        ];

        checkVars.forEach(varName => {
          if (window[varName] !== undefined) {
            vars[varName] = window[varName];
          }
        });

        return vars;
      });

      console.log('📋 Global variables found:');
      Object.entries(globalVars).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
      });

      // 4. Check DOM for role data attributes
      console.log('\n4️⃣ === CHECKING DOM FOR ROLE DATA ===');

      // Open dropdown to see role data
      try {
        await page.waitForSelector('#role-selector-btn', { timeout: 5000 });
        await page.locator('#role-selector-btn').click();
        await page.waitForTimeout(1000);
        await page.waitForSelector('#role-options', { state: 'visible', timeout: 5000 });

        const roleData = await page.evaluate(() => {
          const options = document.querySelectorAll('#role-options div');
          return Array.from(options).map(div => ({
            text: div.textContent?.trim(),
            attributes: Array.from(div.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            dataset: {...div.dataset}
          }));
        });

        console.log('📋 Role dropdown data:');
        roleData.forEach((role, i) => {
          console.log(`   ${i + 1}. "${role.text}"`);
          console.log(`      Attributes: ${JSON.stringify(role.attributes)}`);
          console.log(`      Dataset: ${JSON.stringify(role.dataset)}`);
        });

      } catch (dropdownError) {
        console.log(`⚠️ Could not analyze dropdown: ${dropdownError.message}`);
      }

      // 5. Check network requests when changeRole is called
      console.log('\n5️⃣ === MONITORING NETWORK REQUESTS ===');

      const networkRequests = [];
      page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      });

      // Try one more changeRole call with monitoring
      console.log('📋 Calling changeRole("Profesor") with network monitoring...');
      await page.evaluate(() => {
        console.log('About to call changeRole("Profesor")...');
        const result = changeRole("Profesor");
        console.log('changeRole returned:', result);
        return result;
      });

      await page.waitForTimeout(3000);

      console.log(`📋 Network requests during changeRole: ${networkRequests.length}`);
      networkRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`      Data: ${req.postData}`);
        }
      });

      // Take screenshot
      await page.screenshot({ path: 'changeerole-investigation.png', fullPage: true });
      console.log('📸 Screenshot saved: changeerole-investigation.png');

    } catch (error) {
      console.log(`❌ Error in investigation: ${error.message}`);
      throw error;
    }
  });
});