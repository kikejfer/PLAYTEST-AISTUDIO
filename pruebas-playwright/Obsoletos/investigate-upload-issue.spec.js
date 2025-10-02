const { test, expect } = require('@playwright/test');
const { chromium } = require('@playwright/test');
const { login } = require('./utils/login-helper');
const { navigateToUploadSection } = require('./utils/file-upload-helper');

test.describe('Investigate Upload Issue', () => {
  test('Monitor what happens during upload process', async () => {
    console.log('\n🔍 === INVESTIGATING UPLOAD ISSUE ===');

    let browser, context, page;

    try {
      // Create browser and page
      browser = await chromium.launch({ headless: false });
      context = await browser.newContext();
      page = await context.newPage();

      // Monitor page events
      page.on('load', () => {
        console.log(`🔄 Page loaded: ${page.url()}`);
      });

      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          console.log(`🔄 Main frame navigated to: ${frame.url()}`);
        }
      });

      page.on('close', () => {
        console.log('❌ Page closed event triggered');
      });

      // Monitor context events
      context.on('close', () => {
        console.log('❌ Context closed event triggered');
      });

      // Login
      await login(page, 'AndGar');
      console.log('✅ AndGar logged in');

      // Navigate to upload section
      await navigateToUploadSection(page);
      console.log('✅ Navigated to upload section');

      console.log(`📋 Page URL before upload: ${page.url()}`);
      console.log(`📋 Page title before upload: ${await page.title()}`);

      // Start monitoring upload process step by step
      console.log('\n🔍 === STEP-BY-STEP UPLOAD MONITORING ===');

      // Step 1: Find file input
      console.log('\n📋 STEP 1: Finding file input...');
      const fileInput = page.locator('input[type="file"]:not([webkitdirectory])').first();
      const inputExists = await fileInput.count();
      console.log(`   File input exists: ${inputExists > 0}`);

      if (inputExists === 0) {
        console.log('❌ No file input found, stopping investigation');
        return;
      }

      // Step 2: Select file
      console.log('\n📋 STEP 2: Selecting file...');
      const filePath = 'C:\\Users\\kikej\\OneDrive - UNED\\Informatica\\APPTest\\PLAYTEST\\PLAYTEST_AISTUDIO\\pruebas-playwright\\tests\\CE1978_Título III Cortes Generales.txt';

      await fileInput.setInputFiles(filePath);
      console.log('✅ File selected');
      console.log(`   Page URL after file selection: ${page.url()}`);
      console.log(`   Page still responsive: ${!page.isClosed()}`);

      await page.waitForTimeout(2000);

      // Step 3: Click first "Subir" button
      console.log('\n📋 STEP 3: Clicking first "Subir" button...');
      const uploadButton = page.locator('button:has-text("Subir")').first();
      const uploadBtnExists = await uploadButton.count();
      console.log(`   Upload button exists: ${uploadBtnExists > 0}`);

      if (uploadBtnExists > 0) {
        await uploadButton.click();
        console.log('✅ Clicked first "Subir" button');
        console.log(`   Page URL after first click: ${page.url()}`);
        console.log(`   Page still responsive: ${!page.isClosed()}`);

        await page.waitForTimeout(2000);
      }

      // Step 4: Look for modal "Subir" button
      console.log('\n📋 STEP 4: Looking for modal "Subir" button...');
      await page.waitForTimeout(1000);

      const modalButton = page.locator('button:has-text("Subir")').nth(1); // Second "Subir" button
      const modalExists = await modalButton.count();
      console.log(`   Modal button exists: ${modalExists > 0}`);

      if (modalExists > 0) {
        const isVisible = await modalButton.isVisible();
        console.log(`   Modal button visible: ${isVisible}`);

        if (isVisible) {
          await modalButton.click();
          console.log('✅ Clicked modal "Subir" button');
          console.log(`   Page URL after modal click: ${page.url()}`);
          console.log(`   Page still responsive: ${!page.isClosed()}`);

          await page.waitForTimeout(3000);
        }
      }

      // Step 5: Click "Cargar archivo para revisar"
      console.log('\n📋 STEP 5: Looking for "Cargar archivo para revisar" button...');
      const loadButton = page.locator('button:has-text("Cargar"), button:has-text("archivos para revisar")').first();
      const loadExists = await loadButton.count();
      console.log(`   Load button exists: ${loadExists > 0}`);

      if (loadExists > 0) {
        const isVisible = await loadButton.isVisible();
        console.log(`   Load button visible: ${isVisible}`);

        if (isVisible) {
          await loadButton.click();
          console.log('✅ Clicked "Cargar archivo para revisar" button');
          console.log(`   Page URL after load click: ${page.url()}`);
          console.log(`   Page still responsive: ${!page.isClosed()}`);

          await page.waitForTimeout(5000); // Wait longer to see what happens
        }
      }

      // Step 6: Click "Guardar todas las preguntas"
      console.log('\n📋 STEP 6: Looking for "Guardar todas las preguntas" button...');
      const saveButton = page.locator('button:has-text("Guardar todas las preguntas")').first();
      const saveExists = await saveButton.count();
      console.log(`   Save button exists: ${saveExists > 0}`);

      if (saveExists > 0) {
        const isVisible = await saveButton.isVisible();
        console.log(`   Save button visible: ${isVisible}`);

        if (isVisible) {
          console.log('⚠️ About to click "Guardar todas las preguntas" - this might cause navigation...');

          await saveButton.click();
          console.log('✅ Clicked "Guardar todas las preguntas" button');

          // Monitor what happens after this click
          await page.waitForTimeout(2000);

          console.log(`   Page URL after save click: ${page.url()}`);
          console.log(`   Page still responsive: ${!page.isClosed()}`);
          console.log(`   Context still open: ${!context.isClosed()}`);

          // Wait longer to see if anything changes
          await page.waitForTimeout(5000);

          console.log(`   Final page URL: ${page.url()}`);
          console.log(`   Final page responsive: ${!page.isClosed()}`);
          console.log(`   Final context open: true`);
        }
      }

      console.log('\n📋 === UPLOAD INVESTIGATION COMPLETE ===');
      console.log('🎉 Upload process completed without closing page/context');

    } catch (error) {
      console.log(`❌ Error during investigation: ${error.message}`);
      console.log(`   Page state: ${page ? (page.isClosed() ? 'CLOSED' : 'OPEN') : 'NULL'}`);
      console.log(`   Context state: ${context ? 'OPEN' : 'NULL'}`);
      console.log(`   Browser state: ${browser ? (!browser.isClosed() ? 'OPEN' : 'CLOSED') : 'NULL'}`);
    } finally {
      // Cleanup
      try {
        if (context) {
          await context.close();
          console.log('✅ Context closed in cleanup');
        }
        if (browser && !browser.isClosed()) {
          await browser.close();
          console.log('✅ Browser closed in cleanup');
        }
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup error: ${cleanupError.message}`);
      }
    }
  });
});