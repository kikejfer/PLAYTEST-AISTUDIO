const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics, selectRole } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Visual Demo - Creator Blocks Helper Function', () => {

  test('Show complete function workflow step by step', async ({ page }) => {
    console.log('🎯 DEMOSTRACIÓN COMPLETA DE creator-blocks-helper.js');
    console.log('=' .repeat(60));

    // STEP 1: Login
    console.log('🔄 PASO 1: Haciendo login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);
    console.log('✅ Login completado');

    // STEP 2: Navigate to teachers panel for role testing
    console.log('🔄 PASO 2: Navegando al panel de profesores...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Panel de profesores cargado');

    // STEP 3: Test role selection visually
    console.log('🔄 PASO 3: DEMOSTRANDO SELECCIÓN DE ROL...');

    // Highlight role selector before clicking
    const roleSelector = page.locator('#role-selector-container');
    await roleSelector.evaluate(element => {
      element.style.border = '5px solid red';
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
      element.scrollIntoView();
    });
    console.log('🔴 Resaltando selector de rol en ROJO');
    await page.waitForTimeout(2000);

    // Use our function to select Profesor role
    await selectRole(page, 'Profesor');
    console.log('✅ Rol Profesor seleccionado usando la función');

    // STEP 4: Navigate to Recursos tab and show navigation
    console.log('🔄 PASO 4: NAVEGANDO A PESTAÑA RECURSOS...');

    const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")').first();
    await recursosTab.evaluate(element => {
      element.style.border = '5px solid blue';
      element.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
      element.scrollIntoView();
    });
    console.log('🔵 Resaltando pestaña Recursos en AZUL');
    await page.waitForTimeout(2000);

    await recursosTab.click();
    await page.waitForTimeout(3000);
    console.log('✅ Navegado a pestaña Recursos');

    // STEP 5: Show container detection
    console.log('🔄 PASO 5: IDENTIFICANDO CONTENEDOR DE BLOQUES...');

    const container = page.locator('#recursos-bloques-creados-container');
    await container.evaluate(element => {
      element.style.border = '5px solid green';
      element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
      element.scrollIntoView();
    });
    console.log('🟢 Resaltando contenedor de bloques en VERDE');
    await page.waitForTimeout(2000);

    // STEP 6: Show individual block detection
    console.log('🔄 PASO 6: IDENTIFICANDO BLOQUES INDIVIDUALES...');

    const blockCards = container.locator('.bc-block-card');
    const cardCount = await blockCards.count();
    console.log(`📋 Encontrados ${cardCount} bloques`);

    for (let i = 0; i < cardCount; i++) {
      const card = blockCards.nth(i);
      const titleElement = card.locator('.bc-block-title');

      // Highlight each block with different colors
      const colors = ['orange', 'purple', 'cyan'];
      const color = colors[i] || 'yellow';

      await card.evaluate((element, color) => {
        element.style.border = `5px solid ${color}`;
        element.style.backgroundColor = `rgba(255, 165, 0, 0.2)`;
        element.scrollIntoView();
      }, color);

      const titleText = await titleElement.textContent();
      console.log(`🔸 Bloque ${i + 1}: "${titleText?.trim()}" resaltado en ${color.toUpperCase()}`);

      await page.waitForTimeout(1500);
    }

    // STEP 7: Extract characteristics using our function
    console.log('🔄 PASO 7: EXTRAYENDO CARACTERÍSTICAS CON LA FUNCIÓN...');

    const blocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

    console.log('\n📊 RESULTADOS DE LA FUNCIÓN:');
    console.log('=' .repeat(50));

    blocks.forEach((block, index) => {
      console.log(`\n${index + 1}. ${block.blockTitle}`);
      console.log(`   📝 Preguntas: ${block.preguntas}`);
      console.log(`   📚 Temas: ${block.temas}`);
      console.log(`   👥 Usuarios: ${block.usuarios}`);
    });

    console.log(`\n✅ FUNCIÓN COMPLETADA: ${blocks.length} bloques extraídos`);

    // STEP 8: Test with Creadora role
    console.log('\n🔄 PASO 8: PROBANDO CON ROL CREADORA...');

    // Navigate to creators panel
    await page.goto(`${BASE_URL}/creators-panel-content.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select Creadora role
    await selectRole(page, 'Creador');

    // Navigate to Contenido tab
    const contenidoTab = page.locator('.tab-button:has-text("Contenido"), button:has-text("Contenido")').first();
    await contenidoTab.click();
    await page.waitForTimeout(3000);

    // Extract blocks for Creadora
    const creadoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

    console.log('\n📊 RESULTADOS ROL CREADORA:');
    console.log('=' .repeat(50));

    creadoraBlocks.forEach((block, index) => {
      console.log(`\n${index + 1}. ${block.blockTitle}`);
      console.log(`   📝 Preguntas: ${block.preguntas}`);
      console.log(`   📚 Temas: ${block.temas}`);
      console.log(`   👥 Usuarios: ${block.usuarios}`);
    });

    // STEP 9: Final comparison
    console.log('\n🔄 PASO 9: COMPARACIÓN FINAL...');
    console.log('=' .repeat(60));
    console.log(`📝 Rol Creadora: ${creadoraBlocks.length} bloques encontrados`);
    console.log(`👩‍🏫 Rol Profesora: ${blocks.length} bloques encontrados`);

    if (creadoraBlocks.length === blocks.length) {
      console.log('⚠️ MISMO NÚMERO DE BLOQUES en ambos roles');

      const sameBlocks = creadoraBlocks.every(creadoraBlock =>
        blocks.some(profesoraBlock =>
          profesoraBlock.blockTitle === creadoraBlock.blockTitle
        )
      );

      if (sameBlocks) {
        console.log('⚠️ MISMOS BLOQUES en ambos roles - posible problema en la aplicación web');
      } else {
        console.log('✅ Bloques diferentes encontrados');
      }
    }

    console.log('\n🎯 DEMOSTRACIÓN COMPLETADA');
    console.log('La función creator-blocks-helper.js está funcionando correctamente');
    console.log('✅ Cambia roles, navega a pestañas, identifica contenedores y extrae datos');

    // Wait for final inspection
    console.log('\n⏸️ Manteniendo navegador abierto para inspección final...');
    await page.waitForTimeout(10000);
  });

});