/**
 * Utility module for selecting and extracting information from content blocks
 * Handles navigation through tabs, sections and block content
 */

/**
 * Selects an element within a content block (bc-block-card) and optionally extracts specific information
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} tab - Tab to navigate to (Contenido, Añadir Preguntas, etc.)
 * @param {string} section - Section within the tab (Bloques Creados, Bloques Disponibles, etc.)
 * @param {string} blockTitle - Title of the block to find (bc-block-title)
 * @param {string} [characteristic] - Optional: characteristic to extract (tipo, nivel, estado, or stat name)
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string}>} Block locator and optional extracted value
 */
async function selectBlockElement(page, tab, section, blockTitle, characteristic = null) {
  try {
    // Step 1: Navigate to the specified tab
    await navigateToTab(page, tab);

    // Step 2: Navigate to the specified section (if needed)
    if (section) {
      await navigateToSection(page, section);
    }

    // Step 3: Find the block by title
    const blockCard = await findBlockByTitle(page, blockTitle);

    if (!blockCard) {
      throw new Error(`Block with title "${blockTitle}" not found in section "${section}"`);
    }

    // Step 4: Extract characteristic if specified
    let extractedValue = null;
    if (characteristic) {
      extractedValue = await extractCharacteristic(blockCard, characteristic, page);
    }

    return {
      block: blockCard,
      value: extractedValue
    };

  } catch (error) {
    console.log(`❌ Error in selectBlockElement: ${error.message}`);
    throw error;
  }
}


/**
 * Navigates to the specified tab
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} tab - Tab name to navigate to
 */
async function navigateToTab(page, tab) {
  const tabSelectors = [
    `.tab-button:has-text("${tab}")`,
    `button:has-text("${tab}")`,
    `.nav-tab:has-text("${tab}")`,
    `[data-tab="${tab}"]`
  ];

  for (const selector of tabSelectors) {
    const tabElement = page.locator(selector).first();
    const tabExists = await tabElement.count();

    if (tabExists > 0 && await tabElement.isVisible()) {
      await tabElement.click();
      await page.waitForTimeout(2000); // Wait for tab content to load
      console.log(`✅ Navigated to tab: ${tab}`);
      return;
    }
  }

  throw new Error(`Tab "${tab}" not found or not clickable`);
}

/**
 * Navigates to the specified section within a tab
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name to navigate to
 */
async function navigateToSection(page, section) {
  // Look for section headers or buttons
  const sectionSelectors = [
    `.section-header:has-text("${section}")`,
    `.section-title:has-text("${section}")`,
    `h3:has-text("${section}")`,
    `h4:has-text("${section}")`,
    `.sub-tab:has-text("${section}")`,
    `button:has-text("${section}")`
  ];

  for (const selector of sectionSelectors) {
    const sectionElement = page.locator(selector).first();
    const sectionExists = await sectionElement.count();

    if (sectionExists > 0) {
      // If it's clickable, click it
      if (await sectionElement.isVisible()) {
        try {
          await sectionElement.click();
          await page.waitForTimeout(1000);
          console.log(`✅ Navigated to section: ${section}`);
        } catch (e) {
          // Section might not be clickable, just a header
          console.log(`✅ Found section: ${section}`);
        }
      }
      return;
    }
  }

  console.log(`⚠️ Section "${section}" not found, continuing with current view`);
}

/**
 * Finds a block by its title within bc-block-card elements
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Title to search for
 * @returns {Promise<import('@playwright/test').Locator|null>} Block card locator or null
 */
async function findBlockByTitle(page, blockTitle) {
  // Wait for block cards to load
  await page.waitForTimeout(2000);

  // Find all block cards
  const blockCards = page.locator('.bc-block-card');
  const cardCount = await blockCards.count();

  console.log(`🔍 Found ${cardCount} block cards, searching for "${blockTitle}"`);

  // Search through each block card
  for (let i = 0; i < cardCount; i++) {
    const card = blockCards.nth(i);

    // Look for the title within this card
    const titleElement = card.locator('.bc-block-title');
    const titleExists = await titleElement.count();

    if (titleExists > 0) {
      const titleText = await titleElement.textContent();
      console.log(`🔍 Checking block title: "${titleText}"`);

      if (titleText && titleText.includes(blockTitle)) {
        console.log(`✅ Found block with title: "${blockTitle}"`);
        return card;
      }
    }
  }

  return null;
}

/**
 * Extracts a characteristic from a block card or performs an action
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} characteristic - Characteristic to extract or action to perform
 * @param {import('@playwright/test').Page} page - Playwright page object (needed for actions)
 * @returns {Promise<string|null>} Extracted value or action result
 */
async function extractCharacteristic(blockCard, characteristic, page = null) {
  const lowerChar = characteristic.toLowerCase();

  // Check if it's an action (eliminar)
  if (lowerChar === 'eliminar') {
    return await performBlockAction(blockCard, 'eliminar', page);
  }

  // Check if it's metadata (tipo, nivel, estado)
  if (['tipo', 'nivel', 'estado'].includes(lowerChar)) {
    return await extractMetadata(blockCard, lowerChar);
  } else {
    // It's a statistic
    return await extractStatistic(blockCard, characteristic);
  }
}

/**
 * Performs an action on a block card (like clicking delete button)
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} action - Action to perform (eliminar)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string>} Action result
 */
async function performBlockAction(blockCard, action, page) {
  if (!page) {
    throw new Error('Page object is required for block actions');
  }

  try {
    if (action === 'eliminar') {
      // Look for delete button with various possible selectors
      const deleteSelectors = [
        'button:has-text("Eliminar")',
        '.delete-btn',
        '.btn-delete',
        'button:has-text("🗑️")',
        '[onclick*="delete"]',
        '[onclick*="eliminar"]',
        'button.danger',
        'button[type="button"]:has-text("Eliminar")'
      ];

      for (const selector of deleteSelectors) {
        const deleteButton = blockCard.locator(selector).first();
        const buttonExists = await deleteButton.count();

        if (buttonExists > 0 && await deleteButton.isVisible()) {
          console.log(`✅ Found delete button with selector: ${selector}`);
          console.log(`🔄 Clicking delete button...`);
          await deleteButton.click();
          await page.waitForTimeout(1000); // Wait for action to complete

          // Handle potential confirmation dialog
          try {
            await page.waitForTimeout(500);
            const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")').first();
            const confirmExists = await confirmButton.count();
            if (confirmExists > 0) {
              await confirmButton.click();
              await page.waitForTimeout(1000);
              console.log(`✅ Confirmed deletion`);
            }
          } catch (e) {
            // No confirmation dialog, continue
          }

          console.log(`✅ Delete action completed successfully`);
          return 'deleted';
        }
      }

      throw new Error('Delete button not found in block');
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.log(`❌ Error performing block action: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts metadata from bc-metadata-item elements
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} metadataType - Type of metadata (tipo, nivel, estado)
 * @returns {Promise<string|null>} Metadata value or null
 */
async function extractMetadata(blockCard, metadataType) {
  try {
    // Find all metadata items within the block
    const metadataItems = blockCard.locator('.bc-metadata-item');
    const itemCount = await metadataItems.count();

    console.log(`🔍 Found ${itemCount} metadata items, searching for "${metadataType}"`);

    for (let i = 0; i < itemCount; i++) {
      const item = metadataItems.nth(i);
      const itemText = await item.textContent();

      if (itemText && itemText.toLowerCase().includes(metadataType)) {
        // Extract the value from the strong tag
        const strongElement = item.locator('strong');
        const strongExists = await strongElement.count();

        if (strongExists > 0) {
          const value = await strongElement.textContent();
          console.log(`✅ Found ${metadataType}: "${value}"`);
          return value;
        }
      }
    }

    console.log(`⚠️ Metadata "${metadataType}" not found`);
    return null;

  } catch (error) {
    console.log(`❌ Error extracting metadata: ${error.message}`);
    return null;
  }
}

/**
 * Extracts statistics from bc-stat-item elements
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} statName - Name of the statistic to find
 * @returns {Promise<string|null>} Statistic value or null
 */
async function extractStatistic(blockCard, statName) {
  try {
    // Find all stat items within the block
    const statItems = blockCard.locator('.bc-stat-item');
    const itemCount = await statItems.count();

    console.log(`🔍 Found ${itemCount} stat items, searching for "${statName}"`);

    for (let i = 0; i < itemCount; i++) {
      const item = statItems.nth(i);

      // Check the label
      const labelElement = item.locator('.bc-stat-label');
      const labelExists = await labelElement.count();

      if (labelExists > 0) {
        const labelText = await labelElement.textContent();
        console.log(`🔍 Checking stat label: "${labelText}"`);

        if (labelText && labelText.toLowerCase().includes(statName.toLowerCase())) {
          // Extract the number
          const numberElement = item.locator('.bc-stat-number');
          const numberExists = await numberElement.count();

          if (numberExists > 0) {
            const value = await numberElement.textContent();
            console.log(`✅ Found ${statName}: "${value}"`);
            return value;
          }
        }
      }
    }

    console.log(`⚠️ Statistic "${statName}" not found`);
    return null;

  } catch (error) {
    console.log(`❌ Error extracting statistic: ${error.message}`);
    return null;
  }
}

/**
 * Creates a test step for block selection within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} tab - Tab name
 * @param {string} section - Section name
 * @param {string} blockTitle - Block title
 * @param {string} [characteristic] - Optional characteristic to extract
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string}>}
 */
async function createBlockSelectionStep(test, page, tab, section, blockTitle, characteristic = null) {
  return await test.step(`Select block "${blockTitle}" in ${section}`, async () => {
    return await selectBlockElement(page, tab, section, blockTitle, characteristic);
  });
}

module.exports = {
  selectBlockElement,
  createBlockSelectionStep,
  findBlockByTitle,
  extractCharacteristic,
  extractMetadata,
  extractStatistic,
  performBlockAction
};