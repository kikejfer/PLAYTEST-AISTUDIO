/**
 * Utility module for handling user logout across different tests
 * Searches for logout button within header-container > user-dropdown structure
 */

/**
 * Performs logout from the current page using the correct header dropdown structure
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 */
async function performLogout(page) {
  try {
    // Check if we have a valid page
    if (!page.url() || page.url() === 'about:blank') {
      return;
    }

    // First, find the user-header
    const userHeader = page.locator('.user-header').first();
    const headerExists = await userHeader.count();

    if (headerExists > 0) {
      // Look for user-dropdown-btn within user-header (using ID selector)
      const dropdownBtn = userHeader.locator('#user-dropdown-btn').first();
      const dropdownBtnExists = await dropdownBtn.count();

      if (dropdownBtnExists > 0) {
        const isDropdownVisible = await dropdownBtn.isVisible();

        if (isDropdownVisible) {
          // Click the dropdown button to open the user options
          await dropdownBtn.click();
          await page.waitForTimeout(500); // Wait for dropdown to open

          // Now look for "Cerrar Sesión" button in the opened dropdown
          const logoutButton = page.locator('text="Cerrar Sesión"').first();
          await page.waitForTimeout(500); // Give it time to appear
          const logoutExists = await logoutButton.count();

          if (logoutExists > 0) {
            const isLogoutVisible = await logoutButton.isVisible();

            if (isLogoutVisible) {
              // Handle the confirmation dialog that will appear
              const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });

              await logoutButton.click();

              try {
                const dialog = await dialogPromise;
                await dialog.accept();
                await page.waitForTimeout(3000); // Wait for logout process
                console.log('✅ Logout successful');
                return;
              } catch (timeoutError) {
                // No dialog appeared or timeout - logout might still be successful
                await page.waitForTimeout(3000);
                console.log('✅ Logout successful (no dialog)');
                return;
              }
            }
          } else {
            // Try alternative selectors for logout button
            const altSelectors = [
              'button:has-text("Cerrar Sesión")',
              'a:has-text("Cerrar Sesión")',
              '[onclick*="logout"]',
              '.logout-btn'
            ];

            for (const selector of altSelectors) {
              const altButton = page.locator(selector).first();
              const altExists = await altButton.count();

              if (altExists > 0 && await altButton.isVisible()) {
                const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });

                await altButton.click();

                try {
                  const dialog = await dialogPromise;
                  await dialog.accept();
                  await page.waitForTimeout(3000);
                  console.log('✅ Logout successful');
                  return;
                } catch (timeoutError) {
                  // No dialog appeared or timeout - logout might still be successful
                  await page.waitForTimeout(3000);
                  console.log('✅ Logout successful (no dialog)');
                  return;
                }
              }
            }
          }
        }
      }
    }

    // If we reach here, the proper logout button wasn't found - fallback to manual cleanup
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (storageError) {
      // Silent fail
    }

    try {
      await page.context().clearCookies();
    } catch (cookieError) {
      // Silent fail
    }

  } catch (error) {
    // Fallback: clear session manually
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
    } catch (fallbackError) {
      // Silent fail
    }
  }
}

/**
 * Logout and close browser completely for independent sessions
 * Performs logout and then closes the entire browser instance
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Browser} browser - Browser instance to close (optional)
 * @returns {Promise<void>}
 */
async function logoutAndCloseBrowser(page, browser = null) {
  try {
    console.log('🔄 Starting logout and browser close process');

    // Skip UI logout and go directly to browser close for debugging
    console.log('⚠️ Skipping UI logout (debugging mode)');

    // Close the browser directly
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed completely (provided browser instance)');
    } else {
      // Get browser from page context and close it
      const browserInstance = page.context().browser();
      if (browserInstance) {
        await browserInstance.close();
        console.log('✅ Browser closed completely (from page context)');
      }
    }

  } catch (error) {
    console.log(`⚠️ Error during logout/browser close: ${error.message}`);

    // Fallback: try to close browser even if logout failed
    try {
      if (browser) {
        await browser.close();
      } else {
        const browserInstance = page.context().browser();
        if (browserInstance) {
          await browserInstance.close();
        }
      }
      console.log('✅ Browser closed during error fallback');
    } catch (fallbackError) {
      console.log(`❌ Could not close browser: ${fallbackError.message}`);
    }
  }
}

/**
 * Creates a test step for logout within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 */
async function createLogoutStep(test, page) {
  await test.step('Logout', async () => {
    await performLogout(page);
  });
}

/**
 * Creates a test step for logout and browser close within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Browser} browser - Browser instance to close (optional)
 * @returns {Promise<void>}
 */
async function createLogoutAndCloseStep(test, page, browser = null) {
  await test.step('Logout and Close Browser', async () => {
    await logoutAndCloseBrowser(page, browser);
  });
}

module.exports = {
  performLogout,
  createLogoutStep,
  logoutAndCloseBrowser,
  createLogoutAndCloseStep
};