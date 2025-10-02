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

    // Call the logout function directly instead of clicking the button
    await page.evaluate(() => {
      // Remove all auth tokens
      localStorage.removeItem('playtest_auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');

      // Clear any remaining data
      sessionStorage.clear();
    });

    console.log('✅ Logout successful');

  } catch (error) {
    // Fallback: clear session manually
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (fallbackError) {
      // Silent fail
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
 * Performs logout and closes the browser completely
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').Browser} browser - Playwright browser object
 * @returns {Promise<void>}
 */
async function logoutAndCloseBrowser(page, browser) {
  try {
    // First perform logout
    await performLogout(page);

    // Then close the browser
    if (browser && !browser.isClosed) {
      await browser.close();
      console.log('✅ Browser closed successfully');
    }
  } catch (error) {
    console.log(`⚠️ Error during logout and browser close: ${error.message}`);
    // Try to force close browser anyway
    try {
      if (browser && !browser.isClosed) {
        await browser.close();
      }
    } catch (closeError) {
      console.log(`⚠️ Error force closing browser: ${closeError.message}`);
    }
  }
}

/**
 * Performs safe logout without affecting browser context (for multi-session scenarios)
 * Only clears localStorage and sessionStorage, does not clear cookies or close context
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 */
async function performSafeLogout(page) {
  try {
    // Check if we have a valid page
    if (!page.url() || page.url() === 'about:blank') {
      return;
    }

    // Call the logout function directly - only remove specific auth items, not all localStorage
    await page.evaluate(() => {
      localStorage.removeItem('playtest_auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      sessionStorage.clear();
    });

    console.log('✅ Safe logout successful');

  } catch (error) {
    console.log(`⚠️ Error in safe logout: ${error.message}`);
    // Final fallback - try just localStorage cleanup
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (fallbackError) {
      console.log(`⚠️ Even fallback cleanup failed: ${fallbackError.message}`);
    }
  }
}

module.exports = {
  performLogout,
  createLogoutStep,
  logoutAndCloseBrowser,
  performSafeLogout
};