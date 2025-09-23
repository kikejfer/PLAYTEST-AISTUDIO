/**
 * Utility module for handling user login across different tests
 * Provides consistent login functionality with error handling and browser selection
 */

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

/**
 * Browser user agent strings for different browsers
 */
const BROWSER_USER_AGENTS = {
  'chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'firefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'opera': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
  'vivaldi': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Vivaldi/6.5.3206.39',
  'explorer': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; rv:11.0) like Gecko'
};

/**
 * Sets browser-specific user agent if browser parameter is provided
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} browser - Browser name (chrome, edge, firefox, opera, vivaldi, explorer)
 */
async function setBrowserUserAgent(page, browser) {
  if (browser && BROWSER_USER_AGENTS[browser.toLowerCase()]) {
    const userAgent = BROWSER_USER_AGENTS[browser.toLowerCase()];
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgent
    });
    console.log(`🌐 User agent set for ${browser}: ${userAgent.substring(0, 50)}...`);
  }
}

/**
 * Performs login for a user with the given credentials
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname
 * @param {string} password - User password
 * @param {string} expectedPanel - Expected panel URL pattern (optional)
 * @param {string} browser - Browser to simulate (chrome, edge, firefox, opera, vivaldi, explorer) (optional)
 * @returns {Promise<void>}
 */
async function performLogin(page, nickname, password, expectedPanel = null, browser = null) {
  try {
    // Set browser user agent if specified
    await setBrowserUserAgent(page, browser);

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
      console.log(`✅ ${nickname} logged in successfully and redirected to ${expectedPanel}${browser ? ` (${browser})` : ''}`);
    } else {
      console.log(`✅ ${nickname} logged in successfully${browser ? ` (${browser})` : ''}`);
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
 * @param {string} browser - Browser to simulate (chrome, edge, firefox, opera, vivaldi, explorer) (optional)
 * @returns {Promise<void>}
 */
async function createLoginStep(test, page, nickname, password, expectedPanel = null, browser = null) {
  const stepName = `Login como ${nickname}${browser ? ` (${browser})` : ''}`;
  await test.step(stepName, async () => {
    await performLogin(page, nickname, password, expectedPanel, browser);
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
 * @param {string} browser - Browser to simulate (chrome, edge, firefox, opera, vivaldi, explorer) (optional)
 * @returns {Promise<void>}
 */
async function login(page, nickname, browser = null) {
  const user = TEST_USERS[nickname];
  if (!user) {
    throw new Error(`Unknown user: ${nickname}. Available users: ${Object.keys(TEST_USERS).join(', ')}`);
  }

  try {
    // Set browser user agent if specified
    await setBrowserUserAgent(page, browser);

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

    console.log(`✅ ${nickname} logged in successfully${browser ? ` (${browser})` : ''}`);

  } catch (error) {
    console.log(`❌ Login failed for ${nickname}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  login,
  performLogin,
  createLoginStep,
  setBrowserUserAgent,
  TEST_USERS,
  LOGIN_URL,
  BROWSER_USER_AGENTS
};