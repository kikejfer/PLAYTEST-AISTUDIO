const { test, expect } = require('@playwright/test');
const { login } = require('./utils/login-helper');

test.describe('Find Role Panel URLs', () => {
  test('Discover correct panel URLs for each role', async ({ page }) => {
    console.log('\n🔍 === FINDING ROLE PANEL URLS ===');

    try {
      // Login as kikejfer
      await login(page, 'kikejfer');
      console.log('✅ Logged in as kikejfer');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`📋 Current URL (Administrador Secundario): ${currentUrl}`);

      // 1. Search for role definitions in JavaScript
      console.log('\n1️⃣ === SEARCHING FOR ROLE DEFINITIONS ===');

      const roleDefinitions = await page.evaluate(() => {
        // Search for role objects in global scope
        const possibleRoleVars = [
          'roles', 'ROLES', 'userRoles', 'roleConfig', 'ROLE_CONFIG',
          'panels', 'PANELS', 'roleMap', 'ROLE_MAP'
        ];

        const found = {};
        possibleRoleVars.forEach(varName => {
          if (window[varName] !== undefined) {
            found[varName] = window[varName];
          }
        });

        return found;
      });

      console.log('📋 Found role-related variables:');
      Object.entries(roleDefinitions).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
      });

      // 2. Search in page source for role configurations
      console.log('\n2️⃣ === SEARCHING PAGE SOURCE FOR ROLE CONFIGS ===');

      const pageContent = await page.content();

      // Look for common patterns
      const patterns = [
        /panel["\s]*:["\s]*[^"'\s]+/gi,
        /["']profesor["'][^}]+panel[^"']+["'][^"']+["']/gi,
        /["']creador["'][^}]+panel[^"']+["'][^"']+["']/gi,
        /PPF[^"']*panel/gi,
        /PCC[^"']*panel/gi
      ];

      patterns.forEach((pattern, i) => {
        const matches = pageContent.match(pattern);
        if (matches) {
          console.log(`   Pattern ${i + 1} matches:`);
          matches.slice(0, 5).forEach(match => console.log(`     "${match}"`));
        }
      });

      // 3. Test educated guesses for panel URLs
      console.log('\n3️⃣ === TESTING PANEL URL GUESSES ===');

      const panelGuesses = {
        'Profesor': [
          '/profesor-panel',
          '/ppf-panel',
          '/teacher-panel',
          '/panel-profesor',
          'profesor-panel.html',
          'ppf-panel.html'
        ],
        'Creador': [
          '/creador-panel',
          '/pcc-panel',
          '/creator-panel',
          '/panel-creador',
          'creador-panel.html',
          'pcc-panel.html'
        ]
      };

      for (const [roleName, urls] of Object.entries(panelGuesses)) {
        console.log(`\n📋 Testing ${roleName} panel URLs:`);

        for (const url of urls) {
          try {
            const roleObj = {
              name: roleName,
              code: roleName === 'Profesor' ? 'PPF' : 'PCC',
              panel: url
            };

            console.log(`   Testing: ${JSON.stringify(roleObj)}`);

            // Try the changeRole with this object
            const result = await page.evaluate((testRole) => {
              try {
                // Override confirm to always return true for testing
                const originalConfirm = window.confirm;
                window.confirm = () => true;

                console.log(`Testing changeRole with:`, testRole);
                const result = changeRole(testRole);

                // Restore original confirm
                window.confirm = originalConfirm;

                return { success: true, result: result };
              } catch (error) {
                return { success: false, error: error.message };
              }
            }, roleObj);

            console.log(`     Result: ${JSON.stringify(result)}`);

            // Check if URL changed
            await page.waitForTimeout(1000);
            const newUrl = page.url();
            if (newUrl !== currentUrl) {
              console.log(`     🎯 SUCCESS! URL changed to: ${newUrl}`);
              // Navigate back to continue testing
              await page.goto(currentUrl);
              await page.waitForTimeout(2000);
            }

          } catch (error) {
            console.log(`     ❌ Error: ${error.message}`);
          }
        }
      }

      // 4. Check existing links for panel URLs
      console.log('\n4️⃣ === CHECKING EXISTING LINKS FOR PANEL HINTS ===');

      const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        return allLinks.map(link => ({
          href: link.href,
          text: link.textContent?.trim()
        })).filter(link =>
          link.href.includes('panel') ||
          link.text.includes('panel') ||
          link.text.includes('Profesor') ||
          link.text.includes('Creador')
        );
      });

      console.log('📋 Panel-related links found:');
      links.forEach(link => {
        console.log(`   "${link.text}" → ${link.href}`);
      });

      // 5. Check current panel structure for clues
      console.log('\n5️⃣ === ANALYZING CURRENT PANEL STRUCTURE ===');

      const panelInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          baseUrl: window.location.origin,
          pathname: window.location.pathname,
          metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
            name: meta.name,
            content: meta.content,
            property: meta.getAttribute('property')
          })).filter(meta => meta.content && (
            meta.content.includes('panel') ||
            meta.content.includes('admin') ||
            meta.content.includes('profesor') ||
            meta.content.includes('creador')
          ))
        };
      });

      console.log('📋 Current panel info:');
      console.log(`   Title: ${panelInfo.title}`);
      console.log(`   URL: ${panelInfo.url}`);
      console.log(`   Base: ${panelInfo.baseUrl}`);
      console.log(`   Path: ${panelInfo.pathname}`);
      console.log(`   Relevant meta tags:`, panelInfo.metaTags);

      // Make educated guesses based on current URL pattern
      const baseUrl = panelInfo.baseUrl;
      const potentialUrls = {
        'Profesor': `${baseUrl}/profesor-panel`,
        'Creador': `${baseUrl}/creador-panel`
      };

      console.log('\n📋 Most likely panel URLs:');
      Object.entries(potentialUrls).forEach(([role, url]) => {
        console.log(`   ${role}: ${url}`);
      });

    } catch (error) {
      console.log(`❌ Error in investigation: ${error.message}`);
      throw error;
    }
  });
});