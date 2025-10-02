/**
 * Utility module for handling created blocks in PCC (Creator) and PPF (Professor) panels
 * Provides functions for extracting block characteristics from their respective panels
 */

/**
 * Selects the appropriate role using the role selector
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} role - User role ('Creador' or 'Profesor')
 */
async function selectRole(page, role) {
  const startTime = Date.now();
  try {
    console.log(`🔄 [${Date.now() - startTime}ms] Selecting role: ${role}`);

    // Direct JavaScript execution of changeRole function with correct parameters
    let roleObj;
    if (role === 'Creador') {
      roleObj = {
        name: 'Creador',
        code: 'PCC',
        panel: 'https://playtest-frontend.onrender.com/creators-panel-content'
      };
    } else if (role === 'Profesor') {
      roleObj = {
        name: 'Profesor',
        code: 'PPF',
        panel: 'https://playtest-frontend.onrender.com/teachers-panel-schedules'
      };
    } else {
      throw new Error(`Invalid role: ${role}. Expected 'Creador' or 'Profesor'`);
    }

    console.log(`📋 [${Date.now() - startTime}ms] Executing changeRole with object: ${JSON.stringify(roleObj)}`);

    // Set up SINGLE dialog handler for the confirmation popup using 'once'
    page.once('dialog', async dialog => {
      console.log(`📋 [${Date.now() - startTime}ms] Dialog appeared: "${dialog.message()}"`);
      console.log(`📋 [${Date.now() - startTime}ms] Dialog type: ${dialog.type()}`);

      try {
        if (dialog.type() === 'confirm') {
          console.log(`📋 [${Date.now() - startTime}ms] Accepting confirmation dialog for role change`);
          await dialog.accept();
          console.log(`📋 [${Date.now() - startTime}ms] Dialog accepted`);
        } else {
          console.log(`📋 [${Date.now() - startTime}ms] Dismissing dialog`);
          await dialog.dismiss();
        }
      } catch (error) {
        console.log(`⚠️ [${Date.now() - startTime}ms] Dialog was already handled: ${error.message}`);
      }
    });

    // Execute changeRole function directly via JavaScript (without bypassing confirm)
    console.log(`🔄 [${Date.now() - startTime}ms] About to execute changeRole function...`);
    const result = await page.evaluate((roleObject) => {
      if (typeof changeRole === 'function') {
        console.log(`Calling changeRole with:`, roleObject);
        const result = changeRole(roleObject);
        console.log('changeRole result:', result);
        return { success: true, result: result };
      } else {
        console.log('changeRole function not found');
        return { success: false, error: 'changeRole function not found' };
      }
    }, roleObj);

    console.log(`📋 [${Date.now() - startTime}ms] Direct changeRole result: ${JSON.stringify(result)}`);

    if (!result.success) {
      throw new Error(`changeRole function not available: ${result.error}`);
    }

    // Wait for page navigation to new panel
    console.log(`📋 [${Date.now() - startTime}ms] Waiting for navigation to ${roleObj.panel}...`);

    // Check if we're already on the target URL
    const currentUrlBefore = page.url();
    console.log(`📋 [${Date.now() - startTime}ms] Current URL before wait: ${currentUrlBefore}`);

    try {
      // If we're not already on the panel, wait for navigation
      if (!currentUrlBefore.includes(roleObj.panel)) {
        await page.waitForURL(roleObj.panel, { timeout: 10000 });
        console.log(`✅ [${Date.now() - startTime}ms] Successfully navigated to ${role} panel: ${page.url()}`);
      } else {
        console.log(`✅ [${Date.now() - startTime}ms] Already on ${role} panel: ${page.url()}`);
      }

      // Wait for panel to load
      console.log(`🔄 [${Date.now() - startTime}ms] Waiting for panel to load (1s)...`);
      await page.waitForTimeout(1000);
      console.log(`✅ [${Date.now() - startTime}ms] Selected role: ${role} via direct JavaScript execution and navigation`);

    } catch (navigationError) {
      console.log(`⚠️ [${Date.now() - startTime}ms] Navigation timeout or error: ${navigationError.message}`);
      console.log(`📋 [${Date.now() - startTime}ms] Current URL: ${page.url()}`);

      // Check if we're at least on a different page
      const currentUrl = page.url();
      // Check if URL contains the panel URL (more reliable than checking role name)
      if (currentUrl.includes(roleObj.panel) || currentUrl === roleObj.panel) {
        console.log(`✅ [${Date.now() - startTime}ms] Appears to be on ${role} panel despite navigation timeout`);
        // Wait for panel to load
        await page.waitForTimeout(1000);
      } else {
        throw new Error(`Failed to navigate to ${role} panel. Expected: ${roleObj.panel}, Current URL: ${currentUrl}`);
      }
    }

  } catch (error) {
    console.log(`❌ [${Date.now() - startTime}ms] Error selecting role ${role}: ${error.message}`);
    throw error;
  }
}

/**
 * Navigates to the appropriate tab based on user role
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} role - User role ('Creador' or 'Profesor')
 */
async function navigateToCreatedBlocksTab(page, role) {
  const startTime = Date.now();
  try {
    console.log(`🔄 [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: Starting for role ${role}`);

    // First select the appropriate role
    console.log(`🔄 [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: About to call selectRole...`);
    await selectRole(page, role);
    console.log(`✅ [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: selectRole completed`);

    let tabSelector;

    if (role === 'Creador') {
      // Navigate to "Contenido" tab in PCC panel
      tabSelector = '.tab-button:has-text("Contenido"), button:has-text("Contenido")';
    } else if (role === 'Profesor') {
      // Navigate to "Recursos" tab in PPF panel
      tabSelector = '.tab-button:has-text("Recursos"), button:has-text("Recursos")';
    } else {
      throw new Error(`Invalid role: ${role}. Expected 'Creador' or 'Profesor'`);
    }

    console.log(`🔄 [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: Looking for tab with selector: ${tabSelector}`);
    const tabElement = page.locator(tabSelector).first();
    console.log(`🔄 [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: About to click tab...`);
    await tabElement.click();
    console.log(`✅ [${Date.now() - startTime}ms] navigateToCreatedBlocksTab: Tab clicked, waiting 1.5s for content to load...`);
    await page.waitForTimeout(1500); // Wait for tab content to load after role change
    console.log(`✅ [${Date.now() - startTime}ms] Navigated to ${role === 'Creador' ? 'Contenido' : 'Recursos'} tab`);

  } catch (error) {
    console.log(`❌ [${Date.now() - startTime}ms] Error navigating to tab for ${role}: ${error.message}`);
    throw error;
  }
}

/**
 * Selects a created block and extracts its characteristics
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Title of the block to find
 * @param {string} role - User role ('Creador' or 'Profesor')
 * @param {boolean} [throwOnNotFound=true] - Whether to throw error if block not found
 * @returns {Promise<{blockTitle: string, preguntas: string, temas: string, usuarios: string} | null>}
 */
async function getCreatedBlockCharacteristics(page, blockTitle, role, throwOnNotFound = true) {
  try {
    // Navigate to appropriate tab first
    await navigateToCreatedBlocksTab(page, role);

    // Wait for the container to load - use class selector directly
    let container;
    await page.waitForSelector('.bloques-creados-section', { timeout: 10000 });
    console.log(`✅ Found container by class: bloques-creados-section`);
    container = page.locator('.bloques-creados-section');

    // Find all block cards within the specific container
    const blockCards = container.locator('.bc-block-card');
    const cardCount = await blockCards.count();

    console.log(`🔍 Found ${cardCount} created block cards, searching for "${blockTitle}"`);

    // Search through each block card
    for (let i = 0; i < cardCount; i++) {
      const card = blockCards.nth(i);

      // Look for the title within this card
      const titleElement = card.locator('.bc-block-title');
      const titleExists = await titleElement.count();

      if (titleExists > 0) {
        const titleText = await titleElement.textContent();
        console.log(`🔍 Checking created block title: "${titleText}"`);

        if (titleText && titleText.includes(blockTitle)) {
          console.log(`✅ Found created block "${blockTitle}"`);

          // Extract characteristics using similar approach to player-blocks-helper
          const preguntas = await extractCreatedBlockStat(card, 'Preguntas');
          const temas = await extractCreatedBlockStat(card, 'Temas');
          const usuarios = await extractCreatedBlockStat(card, 'Usuarios');

          const characteristics = {
            blockTitle: titleText.trim(),
            preguntas: preguntas || '0',
            temas: temas || '0',
            usuarios: usuarios || '0'
          };

          console.log(`✅ Extracted characteristics for "${blockTitle}":`, characteristics);
          return characteristics;
        }
      }
    }

    if (throwOnNotFound) {
      throw new Error(`Created block "${blockTitle}" not found in ${role} panel`);
    } else {
      console.log(`⚠️ Created block "${blockTitle}" not found in ${role} panel (expected)`);
      return null;
    }

  } catch (error) {
    console.log(`❌ Error in getCreatedBlockCharacteristics: ${error.message}`);
    if (throwOnNotFound) {
      throw error;
    } else {
      return null;
    }
  }
}

/**
 * Extracts statistics from a created block card (similar to extractLoadedBlockStat)
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} statName - Name of the statistic (Preguntas/Temas/Usuarios)
 * @returns {Promise<string|null>} Statistic value or null
 */
async function extractCreatedBlockStat(blockCard, statName) {
  try {
    // First try the new inline format (style="margin-bottom")
    const inlineStatsDiv = blockCard.locator('div[style*="margin-bottom"]');
    const inlineExists = await inlineStatsDiv.count();

    if (inlineExists > 0) {
      console.log(`🔍 Found inline stats format, searching for "${statName}"`);

      // Look for span with strong containing the statName with timeout
      try {
        const statSpan = inlineStatsDiv.locator(`span:has(strong:has-text("${statName}:"))`);
        await statSpan.waitFor({ timeout: 500, state: 'visible' });
        const spanText = await statSpan.textContent();
        console.log(`🔍 Found span text: "${spanText}"`);

        // Extract value after the colon
        const value = spanText.split(':')[1]?.trim();
        if (value) {
          console.log(`✅ Found created block ${statName}: "${value}"`);
          return value;
        }
      } catch (waitError) {
        console.log(`⚠️ Stat "${statName}" not found in inline format (timeout)`);
        // Continue to fallback format
      }
    }

    // Fallback to old format (bc-stat-item) for backwards compatibility
    const statItems = blockCard.locator('.bc-stat-item');
    const itemCount = await statItems.count();

    if (itemCount > 0) {
      console.log(`🔍 Found ${itemCount} stat items in old format, searching for "${statName}"`);

      for (let i = 0; i < itemCount; i++) {
        const item = statItems.nth(i);

        // Check the label
        const labelElement = item.locator('.bc-stat-label');
        const labelExists = await labelElement.count();

        if (labelExists > 0) {
          const labelText = await labelElement.textContent();
          console.log(`🔍 Checking created block stat label: "${labelText}"`);

          if (labelText && labelText.toLowerCase().includes(statName.toLowerCase())) {
            // Extract the number
            const numberElement = item.locator('.bc-stat-number');
            const numberExists = await numberElement.count();

            if (numberExists > 0) {
              const value = await numberElement.textContent();
              console.log(`✅ Found created block ${statName}: "${value}"`);
              return value;
            }
          }
        }
      }
    }

    console.log(`⚠️ Created block statistic "${statName}" not found in either format`);
    return null;

  } catch (error) {
    console.log(`❌ Error extracting created block statistic: ${error.message}`);
    return null;
  }
}

/**
 * Gets all created blocks and their characteristics for a user nickname
 * @param {string} nickname - User nickname
 * @param {import('@playwright/test').Page} page - Playwright page object (optional, defaults to new Chrome browser)
 * @returns {Promise<{creators: Array<{nickname: string, blocks: string, topics: string, questions: string, users: string}>, professors: Array<{nickname: string, blocks: string, topics: string, questions: string, users: string}>}>}
 */
async function getAllCreatedBlocksCharacteristics(nickname, page = null) {
  const { login } = require('./login-helper');
  const globalStartTime = Date.now();
  let browser = null;
  let createdPage = false;
  // Result object matching AdminPrincipal format
  const result = {
    creators: [],
    professors: []
  };

  try {
    console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Getting all created blocks characteristics for user: ${nickname}`);

    // Create browser and page if not provided
    if (!page) {
      const { chromium } = require('@playwright/test');
      browser = await chromium.launch();
      page = await browser.newPage();
      createdPage = true;
      console.log(`🌐 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Created new Chrome browser for ${nickname}`);

      // Only login if we created a new page
      console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: About to login...`);
      await login(page, nickname);
      console.log(`✅ [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Logged in as ${nickname}`);
    } else {
      // Check if already logged in to a panel
      const currentUrl = page.url();
      console.log(`📍 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Using existing page with URL: ${currentUrl}`);

      if (!currentUrl.includes('panel')) {
        console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Page not in panel, performing login...`);
        await login(page, nickname);
        console.log(`✅ [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Logged in as ${nickname}`);
      } else {
        console.log(`✅ [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Already in panel, skipping login for ${nickname}`);
      }
    }

    // Extract blocks from both roles: Profesor first, then Creador
    const roles = ['Profesor', 'Creador'];

    for (const role of roles) {
      try {
        console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Extracting blocks for role: ${role}`);

        // Navigate to the appropriate tab
        console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: About to call navigateToCreatedBlocksTab...`);
        await navigateToCreatedBlocksTab(page, role);
        console.log(`✅ [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: navigateToCreatedBlocksTab completed`);

        // Wait for the container to load - use class selector directly
        console.log(`🔄 [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Waiting for container .bloques-creados-section...`);
        let container;
        await page.waitForSelector('.bloques-creados-section', { timeout: 10000 });
        console.log(`✅ [${Date.now() - globalStartTime}ms] getAllCreatedBlocksCharacteristics: Found container by class: bloques-creados-section`);
        container = page.locator('.bloques-creados-section');

        // Find all block cards within the specific container
        const blockCards = container.locator('.bc-block-card');
        const cardCount = await blockCards.count();

        console.log(`🔍 Found ${cardCount} created block cards in ${role} role`);

        // Calculate totals for this role
        let totalBlocks = cardCount;
        let totalQuestions = 0;
        let totalTopics = 0;
        let totalUsers = 0;

        // Extract characteristics from each block card for totals
        for (let i = 0; i < cardCount; i++) {
          const card = blockCards.nth(i);

          try {
            // Extract characteristics using existing helper function
            const preguntas = await extractCreatedBlockStat(card, 'Preguntas');
            const temas = await extractCreatedBlockStat(card, 'Temas');
            const usuarios = await extractCreatedBlockStat(card, 'Usuarios');

            totalQuestions += parseInt(preguntas || '0');
            totalTopics += parseInt(temas || '0');
            totalUsers += parseInt(usuarios || '0');

          } catch (cardError) {
            console.log(`⚠️ Error processing card ${i} in ${role}: ${cardError.message}`);
            continue;
          }
        }

        // Create user summary object matching AdminPrincipal format
        const userSummary = {
          nickname: nickname,
          blocks: totalBlocks.toString(),
          topics: totalTopics.toString(),
          questions: totalQuestions.toString(),
          users: totalUsers.toString()
        };

        // Add to appropriate array
        if (role === 'Creador') {
          result.creators.push(userSummary);
          console.log(`✅ Added creator summary for ${nickname}:`, userSummary);
        } else if (role === 'Profesor') {
          result.professors.push(userSummary);
          console.log(`✅ Added professor summary for ${nickname}:`, userSummary);
        }

      } catch (roleError) {
        console.log(`⚠️ Error processing role ${role}: ${roleError.message}`);
        // Add empty entry for failed role
        const emptyEntry = {
          nickname: nickname,
          blocks: '0',
          topics: '0',
          questions: '0',
          users: '0'
        };

        if (role === 'Creador') {
          result.creators.push(emptyEntry);
        } else if (role === 'Profesor') {
          result.professors.push(emptyEntry);
        }
        continue;
      }
    }

    console.log(`✅ Extracted data for ${nickname} in AdminPrincipal format:`, result);
    return result;

  } catch (error) {
    console.log(`❌ Error in getAllCreatedBlocksCharacteristics: ${error.message}`);
    throw error;
  } finally {
    // Close browser if we created it
    if (createdPage && browser) {
      await browser.close();
      console.log(`🔒 Closed Chrome browser for ${nickname}`);
    }
  }
}

/**
 * Creates a test step for getting all created blocks characteristics within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname who created the blocks
 * @param {string} role - User role ('Creador' or 'Profesor')
 * @returns {Promise<Array<{blockTitle: string, preguntas: string, temas: string, usuarios: string}>>}
 */
async function createGetAllCreatedBlocksStep(test, page, nickname, role) {
  return await test.step(`Get all blocks created by ${nickname} (${role})`, async () => {
    return await getAllCreatedBlocksCharacteristics(page, role);
  });
}

/**
 * Creates a test step for created block characteristics extraction within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} nickname - User nickname who created the block
 * @param {string} role - User role ('Creador' or 'Profesor')
 * @param {string} blockTitle - Block title
 * @param {boolean} [throwOnNotFound=true] - Whether to throw error if block not found
 * @returns {Promise<{blockTitle: string, preguntas: string, temas: string, usuarios: string} | null>}
 */
async function createCreatedBlockCharacteristicsStep(test, page, nickname, role, blockTitle, throwOnNotFound = true) {
  return await test.step(`Get characteristics of block "${blockTitle}" created by ${nickname} (${role})`, async () => {
    return await getCreatedBlockCharacteristics(page, blockTitle, role, throwOnNotFound);
  });
}

/**
 * Calculates totals from blocks characteristics for a specific role
 * @param {Array<{blockTitle: string, preguntas: string, temas: string, usuarios: string}>} blocksArray - Array of blocks from getAllCreatedBlocksCharacteristics
 * @param {string} role - User role ('Creador' or 'Profesor') - used for labeling purposes
 * @returns {{role: string, totalBloques: number, totalTemas: number, totalPreguntas: number, totalUsuarios: number}}
 */
function calculateBlocksTotals(blocksArray, role) {
  if (!Array.isArray(blocksArray) || blocksArray.length === 0) {
    return {
      role: role,
      totalBloques: 0,
      totalTemas: 0,
      totalPreguntas: 0,
      totalUsuarios: 0
    };
  }

  const totals = {
    role: role,
    totalBloques: blocksArray.length,
    totalTemas: 0,
    totalPreguntas: 0,
    totalUsuarios: 0
  };

  blocksArray.forEach(block => {
    // Convert strings to numbers, defaulting to 0 if invalid
    const preguntas = parseInt(block.preguntas) || 0;
    const temas = parseInt(block.temas) || 0;
    const usuarios = parseInt(block.usuarios) || 0;

    totals.totalPreguntas += preguntas;
    totals.totalTemas += temas;
    totals.totalUsuarios += usuarios;
  });

  return totals;
}

/**
 * Gets comprehensive totals for a user nickname
 * @param {string} nickname - User nickname
 * @param {import('@playwright/test').Page} page - Playwright page object (optional, defaults to new Chrome browser)
 * @returns {Promise<{totalBloques: number, totalTemas: number, totalPreguntas: number, totalUsuarios: number}>}
 */
async function getAllRolesTotals(nickname, page = null) {
  let browser = null;
  let createdPage = false;

  try {
    console.log(`🔄 Getting blocks totals for user: ${nickname}`);

    // Create browser and page if not provided
    if (!page) {
      const { chromium } = require('@playwright/test');
      browser = await chromium.launch();
      page = await browser.newPage();
      createdPage = true;
      console.log(`🌐 Created new Chrome browser for ${nickname}`);
    }

    // Get all blocks for this user (now returns AdminPrincipal format)
    const data = await getAllCreatedBlocksCharacteristics(nickname, page);

    // Calculate totals from both creators and professors arrays
    let totalBloques = 0;
    let totalTemas = 0;
    let totalPreguntas = 0;
    let totalUsuarios = 0;

    // Sum up creators data
    data.creators.forEach(creator => {
      totalBloques += parseInt(creator.blocks || 0);
      totalTemas += parseInt(creator.topics || 0);
      totalPreguntas += parseInt(creator.questions || 0);
      totalUsuarios += parseInt(creator.users || 0);
    });

    // Sum up professors data
    data.professors.forEach(professor => {
      totalBloques += parseInt(professor.blocks || 0);
      totalTemas += parseInt(professor.topics || 0);
      totalPreguntas += parseInt(professor.questions || 0);
      totalUsuarios += parseInt(professor.users || 0);
    });

    const totals = {
      totalBloques,
      totalTemas,
      totalPreguntas,
      totalUsuarios
    };

    console.log(`✅ Totals for ${nickname}:`, totals);
    return totals;

  } catch (error) {
    console.log(`❌ Error getting totals for ${nickname}: ${error.message}`);

    // Return empty totals for failed user
    return {
      totalBloques: 0,
      totalTemas: 0,
      totalPreguntas: 0,
      totalUsuarios: 0,
      error: error.message
    };
  } finally {
    // Close browser if we created it
    if (createdPage && browser) {
      await browser.close();
      console.log(`🔒 Closed Chrome browser for ${nickname}`);
    }
  }
}

module.exports = {
  getCreatedBlockCharacteristics,
  getAllCreatedBlocksCharacteristics,
  createCreatedBlockCharacteristicsStep,
  createGetAllCreatedBlocksStep,
  navigateToCreatedBlocksTab,
  extractCreatedBlockStat,
  selectRole,
  calculateBlocksTotals,
  getAllRolesTotals
};