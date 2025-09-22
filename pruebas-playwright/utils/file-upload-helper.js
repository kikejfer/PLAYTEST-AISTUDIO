/**
 * Utility module for handling file uploads in the "Añadir Preguntas" > "Subir Fichero" section
 * Provides functions for both multiple directory upload and individual file upload
 */

/**
 * Navigates to the "Añadir Preguntas" > "Subir Fichero" section
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function navigateToUploadSection(page) {
  try {
    // Navigate to "Añadir Preguntas" tab
    const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas"), button:has-text("Añadir Preguntas")').first();
    await addQuestionsTab.click();
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Add Questions tab');

    // Navigate to "Subir Fichero" subtab
    const uploadFileSubTab = page.locator('button:has-text("📁 Subir Fichero"), button:has-text("Subir Fichero"), .sub-tab:has-text("Subir Fichero")').first();
    await uploadFileSubTab.click();
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Upload File subtab');

  } catch (error) {
    console.log(`❌ Error navigating to upload section: ${error.message}`);
    throw error;
  }
}

/**
 * Uploads multiple files from a directory and processes them
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} directoryPath - Path to the directory containing files
 * @param {number} fileCount - Expected number of files to be selected
 * @param {string[]} fileNames - Array of file names to select (without extension)
 * @returns {Promise<boolean>} Success status
 */
async function uploadMultipleFiles(page, directoryPath, fileCount, fileNames) {
  try {
    console.log(`🔄 Starting multiple file upload from: ${directoryPath}`);
    console.log(`📁 Expected files: ${fileNames.join(', ')}`);

    // Step 1: Select directory using webkitdirectory input
    const directoryInput = page.locator('input[type="file"][webkitdirectory]').first();
    await directoryInput.setInputFiles(directoryPath);
    await page.waitForTimeout(2000);
    console.log('✅ Directory selected with files');

    // Step 2: Click first "Subir" button
    const uploadButton = page.locator('button:has-text("Subir")').first();
    await uploadButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first "Subir" button');

    // Step 3: Handle modal "Subir" button
    await page.waitForTimeout(2000);
    const modalSelectors = [
      '.modal button:has-text("Subir")',
      '.popup button:has-text("Subir")',
      '.dialog button:has-text("Subir")',
      'button:has-text("Subir")',
      '[class*="modal"] button:has-text("Subir")',
      '[class*="popup"] button:has-text("Subir")',
      '[class*="overlay"] button:has-text("Subir")'
    ];

    let modalButton = null;
    for (const selector of modalSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        modalButton = button;
        console.log(`✅ Found modal button with selector: ${selector}`);
        break;
      }
    }

    if (modalButton) {
      await modalButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Clicked modal "Subir" button');
    } else {
      console.log('⚠️ No modal "Subir" button found, continuing...');
    }

    // Step 4: Select checkboxes for specific files
    await page.waitForTimeout(3000);

    for (const fileName of fileNames) {
      // Try different checkbox selectors
      const checkboxSelectors = [
        `input[type="checkbox"][value*="${fileName}"]`,
        `label:has-text("${fileName}") input[type="checkbox"]`,
        `input[type="checkbox"] + label:has-text("${fileName}")`,
        `text="${fileName}" >> .. >> input[type="checkbox"]`
      ];

      let checkboxFound = false;
      for (const selector of checkboxSelectors) {
        const checkbox = page.locator(selector).first();
        if (await checkbox.count() > 0) {
          await checkbox.check();
          console.log(`✅ Selected checkbox for: ${fileName}`);
          checkboxFound = true;
          break;
        }
      }

      if (!checkboxFound) {
        console.log(`⚠️ WARNING: Checkbox not found for file: ${fileName}`);
      }
    }

    // Step 5: Click "Cargar N archivos para revisar" button
    const loadFilesButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
    await loadFilesButton.click();
    console.log('✅ Clicked "Cargar N archivos para revisar" button');

    // Step 6: Click "Guardar todas las preguntas" button
    const saveAllQuestionsBtn = page.locator('button:has-text("Guardar todas las preguntas")').first();
    await saveAllQuestionsBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveAllQuestionsBtn.click();
    console.log('✅ Clicked "Guardar todas las preguntas" button');

    // Wait for processing
    await page.waitForTimeout(5000);
    console.log(`🎉 Multiple file upload completed successfully for ${fileCount} files`);

    return true;

  } catch (error) {
    console.log(`❌ Error in multiple file upload: ${error.message}`);
    throw error;
  }
}

/**
 * Uploads a single file and processes it
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} filePath - Full path to the file to upload
 * @param {string} fileName - Name of the file (for logging)
 * @returns {Promise<boolean>} Success status
 */
async function uploadSingleFile(page, filePath, fileName) {
  try {
    console.log(`🔄 Starting single file upload: ${fileName}`);
    console.log(`📁 File path: ${filePath}`);

    // Step 1: Find the individual file input (not webkitdirectory)
    let browseButton = null;

    // Try to find individual file input
    const browseButtonSelectors = [
      'input[type="file"]:not([webkitdirectory]):not(#folder-upload)',
      'input[type="file"]:not([id="folder-upload"]):not([webkitdirectory])',
      'input[type="file"]:not([directory]):not([webkitdirectory])',
      'input[type="file"][accept=".txt"][multiple]',
      'input[type="file"][accept=".txt"]',
      '#add-questions-content > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > input:nth-child(2)'
    ];

    // First try to get individual file input (without webkitdirectory)
    const individualInputs = page.locator('input[type="file"]:not([webkitdirectory])');
    const individualCount = await individualInputs.count();

    if (individualCount > 0) {
      browseButton = individualInputs.first();
      console.log('✅ Found individual file input (no webkitdirectory)');
    }

    // If not found, try other selectors
    if (!browseButton) {
      for (const selector of browseButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          try {
            const isVisible = await button.isVisible();
            const isAttached = await button.isAttached();

            if (isAttached) {
              browseButton = button;
              console.log(`✅ Found file input with selector: ${selector} (visible: ${isVisible})`);
              break;
            }
          } catch (error) {
            console.log(`⚠️ Error checking selector "${selector}": ${error.message}`);
          }
        }
      }
    }

    // If still not found, search in content area
    if (!browseButton) {
      const parentContainer = page.locator('#add-questions-content');
      const parentExists = await parentContainer.count();

      if (parentExists > 0) {
        const individualFileInputs = await parentContainer.locator('input[type="file"]:not([webkitdirectory])').count();

        if (individualFileInputs > 0) {
          browseButton = parentContainer.locator('input[type="file"]:not([webkitdirectory])').first();
          console.log('✅ Using individual file input from #add-questions-content');
        }
      }
    }

    if (!browseButton) {
      throw new Error('No individual file input found for single file upload');
    }

    // Step 2: Upload the file
    await browseButton.setInputFiles(filePath);
    console.log(`✅ Selected file: ${fileName}`);

    // Step 3: Click "Subir" button
    const uploadButton = page.locator('button:has-text("Subir")').first();
    await uploadButton.waitFor({ state: 'visible', timeout: 5000 });
    await uploadButton.click();
    console.log('✅ Clicked "Subir" button');

    // Step 4: Handle modal "Subir" button
    const modalSelectors = [
      '.modal button:has-text("Subir")',
      '.popup button:has-text("Subir")',
      '.dialog button:has-text("Subir")',
      'button:has-text("Subir")'
    ];

    let modalButton = null;
    for (const selector of modalSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        modalButton = button;
        console.log(`✅ Found modal button with selector: ${selector}`);
        break;
      }
    }

    if (modalButton) {
      await modalButton.click();
      console.log('✅ Clicked modal "Subir" button');
    }

    // Step 5: Click "Cargar archivo para revisar" button
    const loadFileButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
    await loadFileButton.waitFor({ state: 'visible', timeout: 10000 });
    await loadFileButton.click();
    console.log('✅ Clicked "Cargar archivo para revisar" button');

    // Step 6: Click "Guardar todas las preguntas" button
    const saveAllQuestionsBtn = page.locator('button:has-text("Guardar todas las preguntas")').first();
    await saveAllQuestionsBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveAllQuestionsBtn.click();
    console.log('✅ Clicked "Guardar todas las preguntas" button');

    console.log(`🎉 Single file upload completed successfully for: ${fileName}`);
    return true;

  } catch (error) {
    console.log(`❌ Error in single file upload: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a test step for multiple file upload within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} directoryPath - Path to the directory containing files
 * @param {number} fileCount - Expected number of files to be selected
 * @param {string[]} fileNames - Array of file names to select
 * @returns {Promise<boolean>} Success status
 */
async function createMultipleUploadStep(test, page, directoryPath, fileCount, fileNames) {
  return await test.step(`Upload ${fileCount} files from directory: ${fileNames.join(', ')}`, async () => {
    return await uploadMultipleFiles(page, directoryPath, fileCount, fileNames);
  });
}

/**
 * Creates a test step for single file upload within a Playwright test
 * @param {import('@playwright/test').TestInfo} test - Playwright test object
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} filePath - Full path to the file to upload
 * @param {string} fileName - Name of the file (for logging)
 * @returns {Promise<boolean>} Success status
 */
async function createSingleUploadStep(test, page, filePath, fileName) {
  return await test.step(`Upload single file: ${fileName}`, async () => {
    return await uploadSingleFile(page, filePath, fileName);
  });
}

module.exports = {
  navigateToUploadSection,
  uploadMultipleFiles,
  uploadSingleFile,
  createMultipleUploadStep,
  createSingleUploadStep
};