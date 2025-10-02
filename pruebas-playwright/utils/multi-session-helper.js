/**
 * Helper for managing multiple user sessions in the same browser
 */

const { chromium } = require('@playwright/test');

/**
 * Creates multiple user sessions in separate contexts of the same browser
 * @param {Array<string>} usernames - Array of usernames to create sessions for
 * @returns {Promise<{browser: Browser, sessions: Object}>} Browser instance and sessions object
 */
async function createMultipleUserSessions(usernames) {
  console.log(`🌐 Creating browser with ${usernames.length} user sessions`);

  const browser = await chromium.launch({ headless: false });
  const sessions = {};

  for (const username of usernames) {
    try {
      console.log(`👤 Creating session for ${username}`);

      // Create new context for this user
      const context = await browser.newContext();
      const page = await context.newPage();

      // Import login function
      const { login } = require('./login-helper');

      // Perform login
      await login(page, username);

      sessions[username] = {
        context,
        page,
        username
      };

      console.log(`✅ Session created for ${username}`);

    } catch (error) {
      console.log(`❌ Failed to create session for ${username}: ${error.message}`);
      throw error;
    }
  }

  return { browser, sessions };
}

/**
 * Closes all sessions and the browser
 * @param {Browser} browser - Browser instance
 * @param {Object} sessions - Sessions object
 */
async function closeAllSessions(browser, sessions) {
  console.log('🧹 Closing all sessions...');

  try {
    // Close all contexts
    for (const [username, session] of Object.entries(sessions)) {
      try {
        if (session.context && !session.context.isClosed) {
          await session.context.close();
          console.log(`✅ Closed session for ${username}`);
        }
      } catch (error) {
        console.log(`⚠️ Error closing session for ${username}: ${error.message}`);
      }
    }

    // Close browser
    if (browser && !browser.isClosed) {
      await browser.close();
      console.log('✅ Browser closed');
    }

  } catch (error) {
    console.log(`⚠️ Error during cleanup: ${error.message}`);
  }
}

/**
 * Switches to a specific user session
 * @param {Object} sessions - Sessions object
 * @param {string} username - Username to switch to
 * @returns {Page} Page object for the user
 */
function switchToUser(sessions, username) {
  if (!sessions[username]) {
    throw new Error(`Session for ${username} not found`);
  }

  console.log(`🔄 Switching to ${username} session`);
  return sessions[username].page;
}

module.exports = {
  createMultipleUserSessions,
  closeAllSessions,
  switchToUser
};