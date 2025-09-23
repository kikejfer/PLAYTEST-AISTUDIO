/**
 * Utility module for handling created blocks in PCC (Creator) and PPF (Professor) panels
 * Provides functions for extracting block characteristics from their respective panels
 */

/**
 * Navigates to the appropriate tab based on user role
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} role - User role ('Creador' or 'Profesor')
 */
async function navigateToCreatedBlocksTab(page, role) {
  try {
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

    const tabElement = page.locator(tabSelector).first();
    await tabElement.click();
    await page.waitForTimeout(2000); // Wait for tab content to load
    console.log(`✅ Navigated to ${role === 'Creador' ? 'Contenido' : 'Recursos'} tab`);

  } catch (error) {
    console.log(`❌ Error navigating to tab for ${role}: ${error.message}`);
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

    // Determine container ID based on role
    const containerId = role === 'Creador' ? 'bloques-creados-container' : 'recursos-bloques-creados-container';

    // Wait for the container to load
    await page.waitForSelector(`#${containerId}`, { timeout: 10000 });
    console.log(`✅ Found container: ${containerId}`);

    // Find all block cards within the specific container
    const container = page.locator(`#${containerId}`);
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

      // Look for span with strong containing the statName
      const statSpan = inlineStatsDiv.locator(`span:has(strong:has-text("${statName}:"))`);
      const spanExists = await statSpan.count();

      if (spanExists > 0) {
        const spanText = await statSpan.textContent();
        console.log(`🔍 Found span text: "${spanText}"`);

        // Extract value after the colon
        const value = spanText.split(':')[1]?.trim();
        if (value) {
          console.log(`✅ Found created block ${statName}: "${value}"`);
          return value;
        }
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
 * Gets all created blocks and their characteristics for a user with a given role
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} role - User role ('Creador' or 'Profesor')
 * @returns {Promise<Array<{blockTitle: string, preguntas: string, temas: string, usuarios: string}>>}
 */
async function getAllCreatedBlocksCharacteristics(page, role) {
  try {
    // Navigate to appropriate tab first
    await navigateToCreatedBlocksTab(page, role);

    // Determine container ID based on role
    const containerId = role === 'Creador' ? 'bloques-creados-container' : 'recursos-bloques-creados-container';

    // Wait for the container to load
    await page.waitForSelector(`#${containerId}`, { timeout: 10000 });
    console.log(`✅ Found container: ${containerId}`);

    // Find all block cards within the specific container
    const container = page.locator(`#${containerId}`);
    const blockCards = container.locator('.bc-block-card');
    const cardCount = await blockCards.count();

    console.log(`🔍 Found ${cardCount} created block cards for ${role}`);

    const allBlocks = [];

    // Search through each block card
    for (let i = 0; i < cardCount; i++) {
      const card = blockCards.nth(i);

      // Look for the title within this card
      const titleElement = card.locator('.bc-block-title');
      const titleExists = await titleElement.count();

      if (titleExists > 0) {
        const titleText = await titleElement.textContent();
        const cleanTitle = titleText ? titleText.trim() : 'Unknown Block';
        console.log(`🔍 Processing block: "${cleanTitle}"`);

        // Extract characteristics for this block
        const preguntas = await extractCreatedBlockStat(card, 'Preguntas');
        const temas = await extractCreatedBlockStat(card, 'Temas');
        const usuarios = await extractCreatedBlockStat(card, 'Usuarios');

        const characteristics = {
          blockTitle: cleanTitle,
          preguntas: preguntas || '0',
          temas: temas || '0',
          usuarios: usuarios || '0'
        };

        console.log(`✅ Block "${cleanTitle}" characteristics:`, characteristics);
        allBlocks.push(characteristics);
      }
    }

    console.log(`✅ Extracted ${allBlocks.length} blocks for ${role} role`);
    return allBlocks;

  } catch (error) {
    console.log(`❌ Error in getAllCreatedBlocksCharacteristics: ${error.message}`);
    throw error;
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

module.exports = {
  getCreatedBlockCharacteristics,
  getAllCreatedBlocksCharacteristics,
  createCreatedBlockCharacteristicsStep,
  createGetAllCreatedBlocksStep,
  navigateToCreatedBlocksTab,
  extractCreatedBlockStat
};