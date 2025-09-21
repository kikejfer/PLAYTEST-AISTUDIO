/**
 * Utility module for handling blocks in the "Carga de Bloques" tab of player panel
 * Provides functions for both "Bloques Cargados" and "Bloques Disponibles" sections
 */

/**
 * Selects and interacts with blocks in the "Bloques Cargados" section
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Title of the block to find (bc-block-title)
 * @param {string} authorNickname - Nickname of the author (AndGar, AntLop, etc.)
 * @param {string} action - Action to perform: Temas/Preguntas/Estudiantes/Carácter/Autor/Eliminar
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string, button?: import('@playwright/test').Locator}>}
 */
async function selectLoadedBlock(page, blockTitle, authorNickname, action) {
  try {
    // Navigate to "Carga de Bloques" tab if not already there
    await navigateToLoadBlocksTab(page);

    // Make sure we're in the "Bloques Cargados" section
    await page.waitForTimeout(2000);

    // Find all bc-block-card elements
    const blockCards = page.locator('.bc-block-card');
    const cardCount = await blockCards.count();

    console.log(`🔍 Found ${cardCount} loaded block cards, searching for "${blockTitle}" by "${authorNickname}"`);

    // Search through each block card
    for (let i = 0; i < cardCount; i++) {
      const card = blockCards.nth(i);

      // Look for the title within this card
      const titleElement = card.locator('.bc-block-title');
      const titleExists = await titleElement.count();

      if (titleExists > 0) {
        const titleText = await titleElement.textContent();
        console.log(`🔍 Checking loaded block title: "${titleText}"`);

        if (titleText && titleText.includes(blockTitle)) {
          // Check for author nickname using stat extraction function
          const authorInfo = await extractLoadedBlockStat(card, 'Autor');

          if (authorInfo && authorInfo.includes(authorNickname)) {
            console.log(`✅ Found loaded block "${blockTitle}" by "${authorNickname}"`);

            // Handle the action
          if (action === 'Eliminar') {
            // Find and click the delete button
            const deleteButton = card.locator('.bc-action-btn.bc-btn-delete, button.bc-action-btn.bc-btn-delete');
            const deleteExists = await deleteButton.count();

            if (deleteExists > 0) {
              console.log(`✅ Found delete button for block: "${blockTitle}"`);
              console.log(`🔄 Clicking delete button...`);
              await deleteButton.click();
              await page.waitForTimeout(1000); // Wait for action to complete
              console.log(`✅ Delete button clicked successfully`);
              return {
                block: card,
                action: 'deleted'
              };
            } else {
              throw new Error(`Delete button not found for block: "${blockTitle}"`);
            }
          } else {
            // Extract statistic from bc-stat-item
            const statValue = await extractLoadedBlockStat(card, action);
            return {
              block: card,
              value: statValue
            };
          }
        }
      }
    }

    throw new Error(`Loaded block "${blockTitle}" by "${authorNickname}" not found`);

  } catch (error) {
    console.log(`❌ Error in selectLoadedBlock: ${error.message}`);
    throw error;
  }
}

/**
 * Selects and interacts with blocks in the "Bloques Disponibles" section
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Title of the block to find (from onclick="viewAvailableBlockContent")
 * @param {string} authorNickname - Nickname of the author (AndGar, AntLop, etc.)
 * @param {string} action - Action to perform: Preguntas/Temas/Usuarios/Autor/Cargar/Descargar
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string, button?: import('@playwright/test').Locator}>}
 */
async function selectAvailableBlock(page, blockTitle, authorNickname, action) {
  try {
    // Navigate to "Carga de Bloques" tab if not already there
    await navigateToLoadBlocksTab(page);

    // Make sure we're in the "Bloques Disponibles" section
    await page.waitForTimeout(2000);

    // Find all elements with style="background #0F172A" or similar dark background
    const availableBlocks = page.locator('[style*="background"][style*="#0F172A"], [style*="background"][style*="#0f172a"], [style*="background-color"][style*="#0F172A"], [style*="background-color"][style*="#0f172a"]');
    const blockCount = await availableBlocks.count();

    console.log(`🔍 Found ${blockCount} available block elements, searching for "${blockTitle}" by "${authorNickname}"`);

    // Search through each available block
    for (let i = 0; i < blockCount; i++) {
      const block = availableBlocks.nth(i);

      // Look for onclick="viewAvailableBlockContent" element with the title
      const titleElement = block.locator('[onclick*="viewAvailableBlockContent"]');
      const titleExists = await titleElement.count();

      if (titleExists > 0) {
        const titleText = await titleElement.textContent();
        console.log(`🔍 Checking available block title: "${titleText}"`);

        if (titleText && titleText.includes(blockTitle)) {
          // Verify this block belongs to the specified author
          const authorInfo = await extractAvailableBlockCharacteristic(block, 'Autor');

          if (authorInfo && authorInfo.includes(authorNickname)) {
            console.log(`✅ Found available block "${blockTitle}" by "${authorNickname}"`);

            // Handle the action
          if (action === 'Cargar' || action === 'Descargar') {
            // Find and click the button with onclick="handleBlockAction"
            const actionButton = block.locator('button[onclick*="handleBlockAction"]');
            const buttonExists = await actionButton.count();

            if (buttonExists > 0) {
              // Check if it's a download button (true) or load button (false)
              const buttonText = await actionButton.textContent();
              const isDownload = buttonText && buttonText.toLowerCase().includes('descargar');

              if ((action === 'Descargar' && isDownload) || (action === 'Cargar' && !isDownload)) {
                console.log(`✅ Found ${action} button for block: "${blockTitle}"`);
                console.log(`🔄 Clicking ${action} button...`);
                await actionButton.click();
                await page.waitForTimeout(2000); // Wait for action to complete
                console.log(`✅ ${action} button clicked successfully`);
                return {
                  block: block,
                  action: action.toLowerCase() + 'ed'
                };
              } else {
                throw new Error(`Expected "${action}" button but found "${buttonText}" for block: "${blockTitle}"`);
              }
            } else {
              throw new Error(`Action button not found for block: "${blockTitle}"`);
            }
          } else {
            // Extract characteristic from style="margin-bottom" element
            const charValue = await extractAvailableBlockCharacteristic(block, action);
            return {
              block: block,
              value: charValue
            };
          }
        }
      }
    }

    throw new Error(`Available block "${blockTitle}" by "${authorNickname}" not found`);

  } catch (error) {
    console.log(`❌ Error in selectAvailableBlock: ${error.message}`);
    throw error;
  }
}

/**
 * Navigates to the "Carga de Bloques" tab
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function navigateToLoadBlocksTab(page) {
  const tabSelectors = [
    '.tab-button:has-text("Carga de Bloques")',
    'button:has-text("Carga de Bloques")',
    '.nav-tab:has-text("Carga de Bloques")',
    '[data-tab="load-blocks"]',
    '.tab:has-text("Carga de Bloques")'
  ];

  for (const selector of tabSelectors) {
    const tabElement = page.locator(selector).first();
    const tabExists = await tabElement.count();

    if (tabExists > 0 && await tabElement.isVisible()) {
      await tabElement.click();
      await page.waitForTimeout(2000); // Wait for tab content to load
      console.log(`✅ Navigated to "Carga de Bloques" tab`);
      return;
    }
  }

  throw new Error(`"Carga de Bloques" tab not found or not clickable`);
}

/**
 * Extracts statistics from a loaded block (bc-stat-item)
 * @param {import('@playwright/test').Locator} blockCard - Block card locator
 * @param {string} statName - Name of the statistic (Temas/Preguntas/Estudiantes/Cargado)
 * @returns {Promise<string|null>} Statistic value or null
 */
async function extractLoadedBlockStat(blockCard, statName) {
  try {
    // Find all stat items within the block
    const statItems = blockCard.locator('.bc-stat-item');
    const itemCount = await statItems.count();

    console.log(`🔍 Found ${itemCount} stat items in loaded block, searching for "${statName}"`);

    for (let i = 0; i < itemCount; i++) {
      const item = statItems.nth(i);

      // Check the label
      const labelElement = item.locator('.bc-stat-label');
      const labelExists = await labelElement.count();

      if (labelExists > 0) {
        const labelText = await labelElement.textContent();
        console.log(`🔍 Checking loaded block stat label: "${labelText}"`);

        if (labelText && labelText.toLowerCase().includes(statName.toLowerCase())) {
          // Extract the number
          const numberElement = item.locator('.bc-stat-number');
          const numberExists = await numberElement.count();

          if (numberExists > 0) {
            const value = await numberElement.textContent();
            console.log(`✅ Found loaded block ${statName}: "${value}"`);
            return value;
          }
        }
      }
    }

    console.log(`⚠️ Loaded block statistic "${statName}" not found`);
    return null;

  } catch (error) {
    console.log(`❌ Error extracting loaded block statistic: ${error.message}`);
    return null;
  }
}


/**
 * Extracts characteristics from an available block (style="margin-bottom" elements)
 * @param {import('@playwright/test').Locator} block - Block locator
 * @param {string} characteristic - Characteristic name (Preguntas/Temas/Usuarios/Creador)
 * @returns {Promise<string|null>} Characteristic value or null
 */
async function extractAvailableBlockCharacteristic(block, characteristic) {
  try {
    // Find all elements with style="margin-bottom" or similar
    const marginElements = block.locator('[style*="margin-bottom"]');
    const elementCount = await marginElements.count();

    console.log(`🔍 Found ${elementCount} margin-bottom elements in available block, searching for "${characteristic}"`);

    for (let i = 0; i < elementCount; i++) {
      const element = marginElements.nth(i);
      const elementText = await element.textContent();

      if (elementText && elementText.toLowerCase().includes(characteristic.toLowerCase())) {
        // Extract the value from the strong tag
        const strongElement = element.locator('strong');
        const strongExists = await strongElement.count();

        if (strongExists > 0) {
          const value = await strongElement.textContent();
          console.log(`✅ Found available block ${characteristic}: "${value}"`);
          return value;
        } else {
          // If no strong tag, try to extract the value after the characteristic name
          const cleanText = elementText.replace(characteristic, '').replace(':', '').trim();
          if (cleanText) {
            console.log(`✅ Found available block ${characteristic}: "${cleanText}"`);
            return cleanText;
          }
        }
      }
    }

    console.log(`⚠️ Available block characteristic "${characteristic}" not found`);
    return null;

  } catch (error) {
    console.log(`❌ Error extracting available block characteristic: ${error.message}`);
    return null;
  }
}

/**
 * Creates a test step for loaded block selection within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Block title
 * @param {string} authorNickname - Author nickname
 * @param {string} action - Action to perform
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string, button?: import('@playwright/test').Locator}>}
 */
async function createLoadedBlockStep(test, page, blockTitle, authorNickname, action) {
  return await test.step(`Select loaded block "${blockTitle}" by ${authorNickname} - ${action}`, async () => {
    return await selectLoadedBlock(page, blockTitle, authorNickname, action);
  });
}

/**
 * Creates a test step for available block selection within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} blockTitle - Block title
 * @param {string} authorNickname - Author nickname
 * @param {string} action - Action to perform
 * @returns {Promise<{block: import('@playwright/test').Locator, value?: string, button?: import('@playwright/test').Locator}>}
 */
async function createAvailableBlockStep(test, page, blockTitle, authorNickname, action) {
  return await test.step(`Select available block "${blockTitle}" by ${authorNickname} - ${action}`, async () => {
    return await selectAvailableBlock(page, blockTitle, authorNickname, action);
  });
}

module.exports = {
  selectLoadedBlock,
  selectAvailableBlock,
  createLoadedBlockStep,
  createAvailableBlockStep,
  navigateToLoadBlocksTab,
  extractLoadedBlockStat,
  extractAvailableBlockCharacteristic
};