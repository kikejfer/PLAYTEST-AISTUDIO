/**
 * Utility module for extracting information from PAP (Panel Administrador Principal) and PAS (Panel Administrador Secundario)
 * Handles navigation through admin sections and user data extraction
 */

/**
 * Extracts user information from PAP (Panel Administrador Principal)
 * @param {string} section - Section name (e.g., "Creadores", "Jugadores - Administrador Principal")
 * @param {string} nickname - User nickname to find
 * @param {string} [action] - Action to perform: "bloques", "Administrador", or empty for stats
 * @param {import('@playwright/test').Page} page - Playwright page object (optional, defaults to new Chrome browser)
 * @returns {Promise<string|Object|null>} Extracted value, stats object, or null
 */
async function extractUserInfoFromPAP(section, nickname, action = '', page = null) {
  let browser = null;
  let createdPage = false;

  try {
    console.log(`🔄 Extracting user info from PAP - Section: "${section}", User: "${nickname}", Action: "${action}"`);

    // Create browser and page if not provided
    if (!page) {
      const { chromium } = require('@playwright/test');
      browser = await chromium.launch();
      page = await browser.newPage();
      createdPage = true;
      console.log(`🌐 Created new Chrome browser for PAP extraction`);
    }

    // Step 1: Find the section within containers
    const sectionHeader = await findSectionHeader(page, section);
    if (!sectionHeader) {
      throw new Error(`Section "${section}" not found in PAP`);
    }

    // Step 2: Get user ID from database (simulated - in real implementation would query user table)
    const userId = await getUserIdFromNickname(nickname);

    // Step 3: Find user row by data-user-id in table-container
    const userRow = await findUserRowById(page, userId);
    if (!userRow) {
      throw new Error(`User "${nickname}" (ID: ${userId}) not found in section "${section}"`);
    }

    // Step 4: Perform action based on third parameter
    if (action === 'bloques') {
      return await clickExpandButton(userRow);
    } else if (action === 'Administrador') {
      return await getAdministratorValue(userRow);
    } else {
      return await getUserStats(userRow);
    }

  } catch (error) {
    console.log(`❌ Error extracting user info from PAP: ${error.message}`);
    throw error;
  } finally {
    // Close browser if we created it
    if (createdPage && browser) {
      await browser.close();
      console.log(`🔒 Closed Chrome browser for PAP extraction`);
    }
  }
}

/**
 * Extracts user information from PAS (Panel Administrador Secundario)
 * @param {string} section - Section name (e.g., "Creadores Asignados", "Profesores Asignados", "Jugadores Asignados")
 * @param {string} nickname - User nickname to find
 * @param {string} [action] - Action to perform: "bloques" or empty for stats
 * @param {import('@playwright/test').Page} page - Playwright page object (optional, defaults to new Chrome browser)
 * @returns {Promise<string|Object|null>} Extracted value, stats object, or null
 */
async function extractUserInfoFromPAS(section, nickname, action = '', page = null) {
  let browser = null;
  let createdPage = false;

  try {
    console.log(`🔄 Extracting user info from PAS - Section: "${section}", User: "${nickname}", Action: "${action}"`);

    // Create browser and page if not provided
    if (!page) {
      const { chromium } = require('@playwright/test');
      browser = await chromium.launch();
      page = await browser.newPage();
      createdPage = true;
      console.log(`🌐 Created new Chrome browser for PAS extraction`);
    }

    // Step 1: Find the section within containers
    const sectionHeader = await findSectionHeader(page, section);
    if (!sectionHeader) {
      throw new Error(`Section "${section}" not found in PAS`);
    }

    // Step 2: Get user ID from database (simulated - in real implementation would query user table)
    const userId = await getUserIdFromNickname(nickname);

    // Step 3: Find user row by data-user-id in table-container
    const userRow = await findUserRowById(page, userId);
    if (!userRow) {
      throw new Error(`User "${nickname}" (ID: ${userId}) not found in section "${section}"`);
    }

    // Step 4: Perform action based on third parameter
    if (action === 'bloques') {
      return await clickExpandButton(userRow);
    } else {
      return await getUserStats(userRow);
    }

  } catch (error) {
    console.log(`❌ Error extracting user info from PAS: ${error.message}`);
    throw error;
  } finally {
    // Close browser if we created it
    if (createdPage && browser) {
      await browser.close();
      console.log(`🔒 Closed Chrome browser for PAS extraction`);
    }
  }
}

/**
 * Finds section header within containers
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name to find
 * @returns {Promise<import('@playwright/test').Locator|null>} Section header locator or null
 */
async function findSectionHeader(page, section) {
  try {
    // Look for section-header within containers
    const containers = page.locator('.container');
    const containerCount = await containers.count();

    console.log(`🔍 Found ${containerCount} containers, searching for section "${section}"`);

    for (let i = 0; i < containerCount; i++) {
      const container = containers.nth(i);
      const sectionHeader = container.locator('.section-header span').filter({ hasText: section });

      if (await sectionHeader.count() > 0) {
        console.log(`✅ Found section "${section}" in container ${i + 1}`);
        return sectionHeader;
      }
    }

    console.log(`⚠️ Section "${section}" not found in any container`);
    return null;

  } catch (error) {
    console.log(`❌ Error finding section header: ${error.message}`);
    return null;
  }
}

/**
 * Gets user ID from nickname by querying the users table in Aiven database
 * @param {string} nickname - User nickname
 * @returns {Promise<string>} User ID
 */
async function getUserIdFromNickname(nickname) {
  try {
    // Make HTTP request to backend API to get user ID
    const response = await fetch('https://playtest-backend.onrender.com/api/users/get-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname: nickname })
    });

    if (!response.ok) {
      throw new Error(`Failed to get user ID for ${nickname}: ${response.status}`);
    }

    const data = await response.json();
    const userId = data.id ? data.id.toString() : null;

    if (!userId) {
      throw new Error(`User ID not found for nickname "${nickname}" in database`);
    }

    console.log(`📋 User ID for "${nickname}" from database: ${userId}`);
    return userId;

  } catch (error) {
    console.log(`❌ Database lookup failed for "${nickname}": ${error.message}`);

    // Fallback to hardcoded values only for development/testing
    console.log(`⚠️ Using fallback hardcoded ID for "${nickname}"`);
    const fallbackMap = {
      'AndGar': '18',
      'kikejfer': '2',
      'JaiGon': '3',
      'SebDom': '4',
      'Toñi': '5',
      'AdminPrincipal': '6'
    };

    const fallbackId = fallbackMap[nickname];
    if (!fallbackId) {
      throw new Error(`No fallback ID available for nickname "${nickname}"`);
    }

    console.log(`📋 Fallback ID for "${nickname}": ${fallbackId}`);
    return fallbackId;
  }
}

/**
 * Finds user row by data-user-id attribute
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} userId - User ID to find
 * @returns {Promise<import('@playwright/test').Locator|null>} User row locator or null
 */
async function findUserRowById(page, userId) {
  try {
    // Look for table-container and find row with data-user-id
    const tableContainer = page.locator('.table-container');
    const userRow = tableContainer.locator(`tr[data-user-id="${userId}"]`);

    if (await userRow.count() > 0) {
      console.log(`✅ Found user row with ID: ${userId}`);
      return userRow;
    }

    console.log(`⚠️ User row with ID "${userId}" not found`);
    return null;

  } catch (error) {
    console.log(`❌ Error finding user row: ${error.message}`);
    return null;
  }
}

/**
 * Clicks the expand button (btn btn-expand) in the first td of user row
 * @param {import('@playwright/test').Locator} userRow - User row locator
 * @returns {Promise<string>} Action result
 */
async function clickExpandButton(userRow) {
  try {
    const expandButton = userRow.locator('td').first().locator('.btn.btn-expand');

    if (await expandButton.count() > 0 && await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(2000); // Wait for expansion
      console.log(`✅ Clicked expand button successfully`);
      return 'expanded';
    } else {
      throw new Error('Expand button not found or not visible');
    }

  } catch (error) {
    console.log(`❌ Error clicking expand button: ${error.message}`);
    throw error;
  }
}

/**
 * Gets the administrator option value from the 8th td (PAP only)
 * @param {import('@playwright/test').Locator} userRow - User row locator
 * @returns {Promise<string>} Administrator option value
 */
async function getAdministratorValue(userRow) {
  try {
    const eighthTd = userRow.locator('td').nth(7); // 8th td (0-indexed)
    const selectElement = eighthTd.locator('select');

    if (await selectElement.count() > 0) {
      const selectedValue = await selectElement.inputValue();
      console.log(`✅ Administrator value: "${selectedValue}"`);
      return selectedValue;
    } else {
      throw new Error('Administrator select element not found in 8th td');
    }

  } catch (error) {
    console.log(`❌ Error getting administrator value: ${error.message}`);
    throw error;
  }
}

/**
 * Gets user statistics from td elements
 * @param {import('@playwright/test').Locator} userRow - User row locator
 * @returns {Promise<Object>} User statistics object
 */
async function getUserStats(userRow) {
  try {
    const tds = userRow.locator('td');

    // Extract values from specific td positions
    const bloquesCreados = await tds.nth(3).textContent(); // 4th td
    const temas = await tds.nth(4).textContent(); // 5th td
    const preguntas = await tds.nth(5).textContent(); // 6th td
    const alumnos = await tds.nth(6).textContent(); // 7th td

    const stats = {
      bloquesCreados: bloquesCreados?.trim() || '0',
      temas: temas?.trim() || '0',
      preguntas: preguntas?.trim() || '0',
      alumnos: alumnos?.trim() || '0'
    };

    console.log(`✅ User stats extracted:`, stats);
    return stats;

  } catch (error) {
    console.log(`❌ Error getting user stats: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a test step for PAP user info extraction within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name
 * @param {string} nickname - User nickname
 * @param {string} [action] - Action to perform
 * @returns {Promise<string|Object|null>}
 */
async function createPAPExtractionStep(test, page, section, nickname, action = '') {
  return await test.step(`Extract "${nickname}" info from PAP section "${section}"`, async () => {
    return await extractUserInfoFromPAP(page, section, nickname, action);
  });
}

/**
 * Creates a test step for PAS user info extraction within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name
 * @param {string} nickname - User nickname
 * @param {string} [action] - Action to perform
 * @returns {Promise<string|Object|null>}
 */
async function createPASExtractionStep(test, page, section, nickname, action = '') {
  return await test.step(`Extract "${nickname}" info from PAS section "${section}"`, async () => {
    return await extractUserInfoFromPAS(page, section, nickname, action);
  });
}

module.exports = {
  extractUserInfoFromPAP,
  extractUserInfoFromPAS,
  createPAPExtractionStep,
  createPASExtractionStep,
  findSectionHeader,
  getUserIdFromNickname,
  findUserRowById,
  clickExpandButton,
  getAdministratorValue,
  getUserStats
};