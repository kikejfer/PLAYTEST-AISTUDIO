const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const {
  getCreatedBlockCharacteristics,
  getAllCreatedBlocksCharacteristics,
  createGetAllCreatedBlocksStep
} = require('./utils/creator-blocks-helper');

// Configuration
const BASE_URL = 'https://playtest-frontend.onrender.com';

/**
 * Test to extract Toñi's created blocks characteristics as Creadora and Profesora
 */
test.describe('Toñi Blocks Characteristics Extraction', () => {

  test('Extract Toñi created blocks as Creadora', async ({ page }) => {
    // Login as Toñi
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Navigate to PCC (Creadora) panel
    console.log('🔄 Navigating to PCC panel...');
    await page.goto(`${BASE_URL}/creators-panel-content.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    try {
      // Get all created blocks characteristics
      const allBlocks = await createGetAllCreatedBlocksStep(test, page, 'Toñi', 'Creador');

      console.log('\n📊 TOÑI - BLOQUES CREADOS (CREADORA):');
      console.log('=' .repeat(50));

      if (allBlocks.length === 0) {
        console.log('❌ No se encontraron bloques creados por Toñi como Creadora');
      } else {
        allBlocks.forEach((block, index) => {
          console.log(`\n${index + 1}. ${block.blockTitle}`);
          console.log(`   📝 Preguntas: ${block.preguntas}`);
          console.log(`   📚 Temas: ${block.temas}`);
          console.log(`   👥 Usuarios: ${block.usuarios}`);
        });

        console.log(`\n✅ Total de bloques encontrados como Creadora: ${allBlocks.length}`);
      }

    } catch (error) {
      console.log(`❌ Error extracting Toñi's blocks as Creadora: ${error.message}`);
      // Take screenshot for debugging
      await page.screenshot({
        path: `debug-toni-creadora-${Date.now()}.png`,
        fullPage: true
      });
      throw error;
    }
  });

  test('Extract Toñi created blocks as Profesora', async ({ page }) => {
    // Login as Toñi
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Navigate to PPF (Profesora) panel
    console.log('🔄 Navigating to PPF panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    try {
      // Get all created blocks characteristics
      const allBlocks = await createGetAllCreatedBlocksStep(test, page, 'Toñi', 'Profesor');

      console.log('\n📊 TOÑI - BLOQUES CREADOS (PROFESORA):');
      console.log('=' .repeat(50));

      if (allBlocks.length === 0) {
        console.log('❌ No se encontraron bloques creados por Toñi como Profesora');
      } else {
        allBlocks.forEach((block, index) => {
          console.log(`\n${index + 1}. ${block.blockTitle}`);
          console.log(`   📝 Preguntas: ${block.preguntas}`);
          console.log(`   📚 Temas: ${block.temas}`);
          console.log(`   👥 Usuarios: ${block.usuarios}`);
        });

        console.log(`\n✅ Total de bloques encontrados como Profesora: ${allBlocks.length}`);
      }

    } catch (error) {
      console.log(`❌ Error extracting Toñi's blocks as Profesora: ${error.message}`);
      // Take screenshot for debugging
      await page.screenshot({
        path: `debug-toni-profesora-${Date.now()}.png`,
        fullPage: true
      });
      throw error;
    }
  });

  test('Compare Toñi blocks between Creadora and Profesora roles', async ({ page }) => {
    let creadoraBlocks = [];
    let profesoraBlocks = [];

    // === EXTRACT AS CREADORA ===
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(2000);

    await page.goto(`${BASE_URL}/creators-panel-content.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    try {
      creadoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');
      console.log(`✅ Creadora blocks extracted: ${creadoraBlocks.length}`);
    } catch (error) {
      console.log(`⚠️ Error extracting Creadora blocks: ${error.message}`);
    }

    // === EXTRACT AS PROFESORA ===
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    try {
      profesoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');
      console.log(`✅ Profesora blocks extracted: ${profesoraBlocks.length}`);
    } catch (error) {
      console.log(`⚠️ Error extracting Profesora blocks: ${error.message}`);
    }

    // === COMPARISON ===
    console.log('\n🔄 COMPARACIÓN DE BLOQUES DE TOÑI:');
    console.log('=' .repeat(60));
    console.log(`📝 Como Creadora: ${creadoraBlocks.length} bloques`);
    console.log(`👩‍🏫 Como Profesora: ${profesoraBlocks.length} bloques`);

    // Find common blocks
    const commonBlocks = creadoraBlocks.filter(creadoraBlock =>
      profesoraBlocks.some(profesoraBlock =>
        profesoraBlock.blockTitle === creadoraBlock.blockTitle
      )
    );

    console.log(`🔗 Bloques comunes: ${commonBlocks.length}`);

    if (commonBlocks.length > 0) {
      console.log('\n📊 BLOQUES COMUNES:');
      commonBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. ${block.blockTitle}`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });
    }

    // Find unique blocks
    const uniqueCreadora = creadoraBlocks.filter(creadoraBlock =>
      !profesoraBlocks.some(profesoraBlock =>
        profesoraBlock.blockTitle === creadoraBlock.blockTitle
      )
    );

    const uniqueProfesora = profesoraBlocks.filter(profesoraBlock =>
      !creadoraBlocks.some(creadoraBlock =>
        creadoraBlock.blockTitle === profesoraBlock.blockTitle
      )
    );

    if (uniqueCreadora.length > 0) {
      console.log('\n🎨 BLOQUES ÚNICOS COMO CREADORA:');
      uniqueCreadora.forEach((block, index) => {
        console.log(`${index + 1}. ${block.blockTitle} (${block.preguntas} preguntas)`);
      });
    }

    if (uniqueProfesora.length > 0) {
      console.log('\n👩‍🏫 BLOQUES ÚNICOS COMO PROFESORA:');
      uniqueProfesora.forEach((block, index) => {
        console.log(`${index + 1}. ${block.blockTitle} (${block.preguntas} preguntas)`);
      });
    }
  });

});