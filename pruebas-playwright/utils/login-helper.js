/**
 * Utility module for handling user login across different tests
 * Provides consistent login functionality with error handling
 */

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

/**
 * Performs login for a user with the given credentials
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname
 * @param {string} password - User password
 * @param {string} expectedPanel - Expected panel URL pattern (optional)
 * @returns {Promise<void>}
 */
async function performLogin(page, nickname, password, expectedPanel = null) {
  try {
    // Navigate to login page
    await page.goto(LOGIN_URL, { timeout: 15000 });

    // Wait for login form to be ready
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });

    // Fill login form
    await page.locator('input[name="nickname"]').fill(nickname);
    await page.locator('input[name="password"]').fill(password);

    // Submit login
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

    // Wait for login to process
    await page.waitForTimeout(4000);

    // If expected panel is provided, verify redirect
    if (expectedPanel) {
      await page.waitForURL(new RegExp(expectedPanel), { timeout: 10000 });
      console.log(`✅ ${nickname} logged in successfully and redirected to ${expectedPanel}`);
    } else {
      console.log(`✅ ${nickname} logged in successfully`);
    }

  } catch (error) {
    console.log(`❌ Login failed for ${nickname}: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a test step for login within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname
 * @param {string} password - User password
 * @param {string} expectedPanel - Expected panel URL pattern (optional)
 * @returns {Promise<void>}
 */
async function createLoginStep(test, page, nickname, password, expectedPanel = null) {
  await test.step(`Login como ${nickname}`, async () => {
    await performLogin(page, nickname, password, expectedPanel);
  });
}

/**
 * User credentials for common test users
 */
const TEST_USERS = {
  'AndGar': { password: '1002' },
  'JaiGon': { password: '1003' },
  'SebDom': { password: '1004' },
  'kikejfer': { password: '123' },
  'AdminPrincipal': { password: 'kikejfer' },
  'admin': { password: 'kikejfer' },
  'Toñi': { password: '987' },
  'AntLop': { password: '1001' }
};

/**
 * Simple login function that only requires nickname
 * Automatically redirects to the appropriate panel after login
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname (AndGar, JaiGon, SebDom, kikejfer, AdminPrincipal, admin)
 * @returns {Promise<void>}
 */
async function login(page, nickname) {
  const user = TEST_USERS[nickname];
  if (!user) {
    throw new Error(`Unknown user: ${nickname}. Available users: ${Object.keys(TEST_USERS).join(', ')}`);
  }

  try {
    // Navigate to login page
    await page.goto(LOGIN_URL, { timeout: 15000 });

    // Wait for login form to be ready
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });

    // Fill login form
    await page.locator('input[name="nickname"]').fill(nickname);
    await page.locator('input[name="password"]').fill(user.password);

    // Submit login
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();

    // Wait for login to process and automatic redirect
    await page.waitForTimeout(4000);

    console.log(`✅ ${nickname} logged in successfully`);

  } catch (error) {
    console.log(`❌ Login failed for ${nickname}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  login,
  performLogin,
  createLoginStep,
  TEST_USERS,
  LOGIN_URL
};