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
    const sectionResult = await findSectionWithContainer(page, section);
    if (!sectionResult) {
      throw new Error(`Section "${section}" not found in PAP`);
    }

    // Step 2: Get user ID from database (simulated - in real implementation would query user table)
    const userId = await getUserIdFromNickname(nickname);

    // Step 3: Find user row by data-user-id in table-container WITHIN the specific section
    const userRow = await findUserRowByIdInSection(sectionResult.container, userId, section);
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
    const sectionResult = await findSectionWithContainer(page, section);
    if (!sectionResult) {
      throw new Error(`Section "${section}" not found in PAS`);
    }

    // Step 2: Get user ID from database (simulated - in real implementation would query user table)
    const userId = await getUserIdFromNickname(nickname);

    // Step 3: Find user row by data-user-id in table-container WITHIN the specific section
    const userRow = await findUserRowByIdInSection(sectionResult.container, userId, section);
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
 * Finds section header and its container within containers
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name to find
 * @returns {Promise<{header: import('@playwright/test').Locator, container: import('@playwright/test').Locator}|null>} Section header and container locators or null
 */
async function findSectionWithContainer(page, section) {
  try {
    // Look for section-header within containers
    const containers = page.locator('.container');
    const containerCount = await containers.count();

    console.log(`\n🔍 DETAILED ANALYSIS - Found ${containerCount} containers, searching for section "${section}"`);

    // Debug: Show all containers and their content
    for (let i = 0; i < containerCount; i++) {
      const container = containers.nth(i);
      console.log(`\n📦 CONTAINER ${i + 1}:`);

      // Check if this container has section headers
      const allSectionHeaders = container.locator('.section-header');
      const headerCount = await allSectionHeaders.count();
      console.log(`   📋 Section headers in container ${i + 1}: ${headerCount}`);

      if (headerCount > 0) {
        for (let j = 0; j < headerCount; j++) {
          const headerElement = allSectionHeaders.nth(j);
          const headerText = await headerElement.textContent();
          console.log(`   📝 Header ${j + 1}: "${headerText?.trim()}"`);

          // Check if this header contains our target section
          const targetSpan = headerElement.locator('span').filter({ hasText: section });
          const hasTargetSection = await targetSpan.count() > 0;
          console.log(`   🎯 Contains "${section}": ${hasTargetSection ? 'YES' : 'NO'}`);
        }
      }

      // Check for table containers in this container
      const tableContainers = container.locator('.table-container');
      const tableCount = await tableContainers.count();
      console.log(`   📊 Table containers in container ${i + 1}: ${tableCount}`);

      if (tableCount > 0) {
        for (let k = 0; k < tableCount; k++) {
          const tableContainer = tableContainers.nth(k);
          const rows = tableContainer.locator('tr[data-user-id]');
          const rowCount = await rows.count();
          console.log(`   📈 Table ${k + 1} has ${rowCount} user rows`);

          // Show some user IDs in this table
          if (rowCount > 0) {
            console.log(`   👥 User IDs in table ${k + 1}:`);
            for (let r = 0; r < Math.min(rowCount, 5); r++) {
              const row = rows.nth(r);
              const userId = await row.getAttribute('data-user-id');
              const firstCell = row.locator('td').first();
              const firstCellText = await firstCell.textContent();
              console.log(`      - ID: ${userId}, First cell: "${firstCellText?.trim()}"`);
            }
          }
        }
      }
    }

    // Now find the target section
    for (let i = 0; i < containerCount; i++) {
      const container = containers.nth(i);
      const sectionHeader = container.locator('.section-header span').filter({ hasText: section });

      if (await sectionHeader.count() > 0) {
        console.log(`\n✅ FOUND TARGET SECTION "${section}" in container ${i + 1}`);
        console.log(`   🔍 This container will be used for user searches`);
        return {
          header: sectionHeader,
          container: container
        };
      }
    }

    console.log(`\n⚠️ Section "${section}" not found in any container`);
    return null;

  } catch (error) {
    console.log(`❌ Error finding section header: ${error.message}`);
    return null;
  }
}

/**
 * Finds section header within containers (legacy function for compatibility)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} section - Section name to find
 * @returns {Promise<import('@playwright/test').Locator|null>} Section header locator or null
 */
async function findSectionHeader(page, section) {
  const result = await findSectionWithContainer(page, section);
  return result ? result.header : null;
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
 * Finds user row by data-user-id attribute within a specific section using correct table mapping
 * @param {import('@playwright/test').Locator} sectionContainer - Section container locator
 * @param {string} userId - User ID to find
 * @param {string} sectionName - Section name for correct table mapping
 * @returns {Promise<import('@playwright/test').Locator|null>} User row locator or null
 */
async function findUserRowByIdInSection(sectionContainer, userId, sectionName) {
  try {
    console.log(`\n🔍 SEARCHING FOR USER ID ${userId} within section "${sectionName}"`);

    // Mapeo correcto de secciones a índices de tabla (0-based)
    const sectionTableMapping = {
      "Administradores Secundarios": 1,  // Tabla 2 (índice 1)
      "Soporte Técnico": 2,              // Tabla 3 (índice 2)
      "Profesores": 2,                   // Tabla 3 (índice 2) - Profesores: 9 usuarios
      "Creadores": 3,                    // Tabla 4 (índice 3) - Creadores: 8 usuarios con 3 bloques cada uno
      "Jugadores - Administrador Principal": 5,  // Tabla 6 (índice 5)
      "Jugadores - Otros Administradores": 6     // Tabla 7 (índice 6)
    };

    const correctTableIndex = sectionTableMapping[sectionName];

    if (correctTableIndex === undefined) {
      console.log(`   ⚠️ No table mapping found for section "${sectionName}"`);
      console.log(`   📋 Available sections: ${Object.keys(sectionTableMapping).join(', ')}`);
      return null;
    }

    console.log(`   🎯 Using table index ${correctTableIndex} (Table ${correctTableIndex + 1}) for section "${sectionName}"`);

    // Get all table containers
    const tableContainers = sectionContainer.locator('.table-container');
    const tableCount = await tableContainers.count();
    console.log(`   📊 Total table containers found: ${tableCount}`);

    if (correctTableIndex >= tableCount) {
      console.log(`   ❌ Table index ${correctTableIndex} out of range. Available tables: 0-${tableCount - 1}`);
      return null;
    }

    // Get the specific table for this section
    const targetTable = tableContainers.nth(correctTableIndex);
    console.log(`   🔍 Searching in table ${correctTableIndex + 1} for section "${sectionName}"`);

    // Get all user rows in the target table
    const allUserRows = targetTable.locator('tr[data-user-id]');
    const rowCount = await allUserRows.count();
    console.log(`   📈 User rows in target table: ${rowCount}`);

    if (rowCount === 0) {
      console.log(`   ⚠️ No user rows found in table ${correctTableIndex + 1}`);
      return null;
    }

    // Show all users in this specific table
    console.log(`   👥 All user IDs in table ${correctTableIndex + 1} (${sectionName}):`);
    for (let j = 0; j < Math.min(rowCount, 10); j++) {  // Limit to first 10 for readability
      const row = allUserRows.nth(j);
      const rowUserId = await row.getAttribute('data-user-id');
      const firstCell = row.locator('td').first();
      const firstCellText = await firstCell.textContent();
      const fourthCell = row.locator('td').nth(3);
      const fourthCellText = await fourthCell.textContent();
      console.log(`      - Row ${j + 1}: ID=${rowUserId}, Name="${firstCellText?.trim()}", 4th col="${fourthCellText?.trim()}"`);
    }

    // Look for our specific user ID in this table
    const userRow = targetTable.locator(`tr[data-user-id="${userId}"]`);
    const userRowCount = await userRow.count();

    if (userRowCount > 0) {
      console.log(`   ✅ FOUND user row with ID: ${userId} in table ${correctTableIndex + 1} (${sectionName})`);

      // Show data from this specific row
      const tds = userRow.locator('td');
      const tdCount = await tds.count();
      console.log(`   📋 Data from user row (${tdCount} columns):`);
      for (let k = 0; k < Math.min(tdCount, 8); k++) {
        const cellText = await tds.nth(k).textContent();
        console.log(`      Column ${k + 1}: "${cellText?.trim()}"`);
      }

      return userRow;
    } else {
      console.log(`   ⚠️ User ID ${userId} not found in table ${correctTableIndex + 1} (${sectionName})`);
      return null;
    }

  } catch (error) {
    console.log(`❌ Error finding user row in section "${sectionName}": ${error.message}`);
    return null;
  }
}

/**
 * Finds user row by data-user-id attribute (legacy function - searches entire page)
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
  findSectionWithContainer,
  getUserIdFromNickname,
  findUserRowById,
  findUserRowByIdInSection,
  clickExpandButton,
  getAdministratorValue,
  getUserStats
};