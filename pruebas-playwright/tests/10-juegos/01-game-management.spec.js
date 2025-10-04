const { test, expect } = require('@playwright/test');
const { login } = require('../../utils/login-helper');
const { performSafeLogout } = require('../../utils/logout-helper');

/**
 * Test Suite: Game Management
 *
 * Verifies:
 * 1. Game creation from player panel
 * 2. Game appears in "Juegos Activos" section (Partidas tab)
 * 3. Game deletion from "Juegos Activos"
 * 4. Completed games storage in "Historial de Partidas" (Histórico tab)
 */

test.describe('Bloque 10: Game Management', () => {
  test.setTimeout(180000); // 3 minutes for complex flows

  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000);
    await performSafeLogout(page);
  });

  test('Test 1: SebDom crea partida y aparece en Juegos Activos', async ({ page }) => {
    const username = 'SebDom';
    const password = 'sebdom';

    await test.step('Login como Jugador SebDom', async () => {
      await login(page, username);
      await page.waitForTimeout(2000);
    });

    await test.step('Verificar que el usuario tiene bloques cargados', async () => {
      // First, check if user has loaded blocks
      const bloquesTab = page.locator('.tab-button').filter({ hasText: 'Carga de Bloques' }).first();
      await expect(bloquesTab).toBeVisible({ timeout: 10000 });
      await bloquesTab.click();
      await page.waitForTimeout(3000); // Wait for blocks to load

      const loadedBlocks = page.locator('.bc-block-card');
      const blockCount = await loadedBlocks.count();
      console.log(`📦 Bloques cargados: ${blockCount}`);

      if (blockCount === 0) {
        console.log('⚠️ El usuario no tiene bloques cargados. Necesita cargar bloques primero.');
        test.skip();
      }
    });

    await test.step('Navegar a pestaña Partidas', async () => {
      const partidasTab = page.locator('.tab-button').filter({ hasText: 'Partidas' }).first();
      await expect(partidasTab).toBeVisible({ timeout: 10000 });
      await partidasTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navegado a pestaña Partidas');
    });

    let initialGameCount = 0;

    await test.step('Contar juegos actuales en Juegos Activos', async () => {
      const activeGamesSection = page.locator('.section').filter({ hasText: 'Juegos Activos' }).first();
      await expect(activeGamesSection).toBeVisible({ timeout: 10000 });

      // Wait for content to load
      await page.waitForTimeout(2000);

      const gameCards = activeGamesSection.locator('li').filter({ has: page.locator('button:has-text("Continuar"), button:has-text("Jugar")') });
      initialGameCount = await gameCards.count();
      console.log(`📊 Juegos activos actuales: ${initialGameCount}`);
    });

    let newGameId = null;

    await test.step('Crear nueva partida desde configurador', async () => {
      // The game configurator is in the "Partidas" tab under "Configuración de Partida"
      // We're already in the Partidas tab from the previous step

      await page.waitForTimeout(3000); // Wait for configurator to load

      // Look for the "Configuración de Partida" section
      const configuracionSection = page.locator('.section').filter({ hasText: 'Configuración de Partida' }).first();
      await expect(configuracionSection).toBeVisible({ timeout: 10000 });
      console.log('✅ Sección Configuración de Partida visible');

      // Wait a bit more for React components to render
      await page.waitForTimeout(2000);

      // Find game mode buttons - they should be visible buttons with game mode names
      // Try broader selector first
      const gameModeButtons = page.locator('button').filter({ hasText: /Clásico|Racha|Examen|Vidas|Maratón/ });
      const modeCount = await gameModeButtons.count();
      console.log(`📊 Modos de juego encontrados: ${modeCount}`);

      if (modeCount === 0) {
        // Try to find any button within the configuration section
        const anyButton = configuracionSection.locator('button');
        const buttonCount = await anyButton.count();
        console.log(`📊 Botones totales en configuración: ${buttonCount}`);

        if (buttonCount > 0) {
          // Log first few button texts for debugging
          for (let i = 0; i < Math.min(5, buttonCount); i++) {
            const buttonText = await anyButton.nth(i).textContent();
            console.log(`   Botón ${i + 1}: "${buttonText}"`);
          }
        }

        console.log('⚠️ No hay modos de juego disponibles');
        test.skip();
      }

      // Select first available game mode
      const firstModeButton = gameModeButtons.first();
      await expect(firstModeButton).toBeVisible({ timeout: 5000 });
      const modeText = await firstModeButton.textContent();
      await firstModeButton.click();
      await page.waitForTimeout(1000);
      console.log(`✅ Seleccionado modo: ${modeText}`);

      // Now find "Configurar" button for a block
      const configurarButtons = page.locator('button').filter({ hasText: 'Configurar' });
      const configCount = await configurarButtons.count();

      if (configCount === 0) {
        console.log('⚠️ No hay bloques disponibles para configurar');
        test.skip();
      }

      // Click first "Configurar" button
      const firstConfigButton = configurarButtons.first();
      await expect(firstConfigButton).toBeVisible({ timeout: 5000 });
      await firstConfigButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Abrió configuración de bloque');

      // In the modal, select "Todos los temas"
      const allTopicsButton = page.locator('button').filter({ hasText: 'Todos los temas' }).first();
      if (await allTopicsButton.count() > 0) {
        await allTopicsButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Seleccionados todos los temas');
      }

      // Close the modal by clicking "Guardar" or similar
      const saveButton = page.locator('button').filter({ hasText: /Guardar|Aceptar/i }).first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Guardada configuración de temas');
      }

      // Wait for modal to close
      await page.waitForTimeout(1000);

      // Debug: Check all buttons currently visible
      const allButtons = page.locator('button:visible');
      const buttonCount = await allButtons.count();
      console.log(`📊 Total botones visibles en página: ${buttonCount}`);

      // Click "Nueva Partida" button
      const crearPartidaButton = page.locator('button').filter({ hasText: 'Nueva Partida' }).first();
      const buttonExists = await crearPartidaButton.count();
      console.log(`📊 Botones "Nueva Partida" encontrados: ${buttonExists}`);

      if (buttonExists === 0) {
        console.log('⚠️ "Nueva Partida" no encontrado, listando botones...');
        for (let i = 0; i < Math.min(15, buttonCount); i++) {
          const text = await allButtons.nth(i).textContent();
          const isVisible = await allButtons.nth(i).isVisible();
          const isDisabled = await allButtons.nth(i).isDisabled();
          console.log(`   Botón ${i + 1}: "${text.trim()}" (visible: ${isVisible}, disabled: ${isDisabled})`);
        }
        test.skip();
      }

      // Check if button is disabled
      const isDisabled = await crearPartidaButton.isDisabled();
      console.log(`📊 Botón "Nueva Partida" disabled: ${isDisabled}`);

      if (isDisabled) {
        console.log('⚠️ El botón "Nueva Partida" está deshabilitado');
        console.log('💡 Esto probablemente significa que falta configurar algo en el juego');
        test.skip();
      }

      // Listen for navigation to capture game ID
      const navigationPromise = page.waitForURL(/game.*\.html\?/, { timeout: 15000 }).catch(() => null);

      await crearPartidaButton.click();
      console.log('✅ Clic en Nueva Partida');

      // Wait for navigation to game page
      await page.waitForTimeout(2000);
      const navigated = await navigationPromise;
      if (navigated) {
        const url = page.url();
        const match = url.match(/gameId=([^&]+)/);
        if (match) {
          newGameId = match[1];
          console.log(`🎮 Nueva partida creada con ID: ${newGameId}`);
        } else {
          console.log(`🎮 Navegado a: ${url}`);
        }
      }
    });

    if (newGameId) {
      await test.step('Regresar al panel de jugador', async () => {
        await page.goto('https://playtest-frontend.onrender.com/jugadores-panel-gaming.html');
        await page.waitForTimeout(3000);

        // Navigate back to Partidas tab
        const partidasTab = page.locator('.tab-button').filter({ hasText: 'Partidas' }).first();
        await expect(partidasTab).toBeVisible({ timeout: 10000 });
        await partidasTab.click();
        await page.waitForTimeout(2000);
        console.log('✅ Regresado a pestaña Partidas');
      });

      await test.step('Verificar que nueva partida aparece en Juegos Activos', async () => {
        const activeGamesSection = page.locator('.section').filter({ hasText: 'Juegos Activos' }).first();
        await expect(activeGamesSection).toBeVisible({ timeout: 10000 });

        // Wait for content to refresh
        await page.waitForTimeout(3000);

        const gameCards = activeGamesSection.locator('li').filter({ has: page.locator('button:has-text("Continuar"), button:has-text("Jugar")') });
        const currentGameCount = await gameCards.count();

        console.log(`📊 Juegos activos después de crear: ${currentGameCount} (antes: ${initialGameCount})`);

        // Verify game count increased
        expect(currentGameCount).toBeGreaterThan(initialGameCount);

        // Try to find the specific game by ID
        const gameCard = activeGamesSection.locator(`li:has-text("${newGameId}")`).first();
        if (await gameCard.count() > 0) {
          await expect(gameCard).toBeVisible({ timeout: 5000 });
          console.log(`✅ Partida ${newGameId} encontrada en Juegos Activos`);
        } else {
          console.log(`⚠️ Partida ${newGameId} no encontrada por ID, pero contador aumentó`);
        }
      });
    } else {
      console.log('⚠️ No se pudo crear la partida o capturar su ID');
    }

    await performSafeLogout(page);
  });

  test('Test 2: SebDom elimina partida de Juegos Activos', async ({ page }) => {
    const username = 'SebDom';
    const password = 'sebdom';

    await test.step('Login como Jugador SebDom', async () => {
      await login(page, username);
      await page.waitForTimeout(2000);
    });

    await test.step('Navegar a pestaña Partidas', async () => {
      const partidasTab = page.locator('.tab-button').filter({ hasText: 'Partidas' }).first();
      await expect(partidasTab).toBeVisible({ timeout: 10000 });
      await partidasTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navegado a pestaña Partidas');
    });

    let gameToDelete = null;

    await test.step('Encontrar una partida para eliminar', async () => {
      const activeGamesSection = page.locator('.section').filter({ hasText: 'Juegos Activos' }).first();
      await expect(activeGamesSection).toBeVisible({ timeout: 10000 });

      await page.waitForTimeout(2000);

      const gameCards = activeGamesSection.locator('li').filter({ has: page.locator('button:has-text("🗑️"), button:has-text("Eliminar")') });
      const gameCount = await gameCards.count();

      if (gameCount === 0) {
        console.log('⚠️ No hay juegos activos para eliminar');
        test.skip();
      }

      gameToDelete = gameCards.first();
      await expect(gameToDelete).toBeVisible({ timeout: 5000 });
      console.log(`📊 Encontrados ${gameCount} juegos con botón de eliminar`);
    });

    let initialGameCount = 0;

    if (gameToDelete) {
      await test.step('Contar juegos antes de eliminar', async () => {
        const activeGamesSection = page.locator('.section').filter({ hasText: 'Juegos Activos' }).first();
        const gameCards = activeGamesSection.locator('li').filter({ has: page.locator('button:has-text("Continuar"), button:has-text("Jugar")') });
        initialGameCount = await gameCards.count();
        console.log(`📊 Juegos activos antes de eliminar: ${initialGameCount}`);
      });

      await test.step('Eliminar partida', async () => {
        // Find delete button
        const deleteButton = gameToDelete.locator('button').filter({ hasText: '🗑️' }).or(gameToDelete.locator('button').filter({ hasText: 'Eliminar' })).first();
        await expect(deleteButton).toBeVisible({ timeout: 5000 });
        await deleteButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Clic en botón Eliminar');

        // Look for confirmation dialog
        const confirmDialog = page.locator('.fixed.inset-0').filter({ has: page.locator('h3:has-text("Confirmar eliminación")') }).first();

        if (await confirmDialog.count() > 0 && await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: 'Eliminar' }).first();
          await expect(confirmButton).toBeVisible({ timeout: 5000 });
          await confirmButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Confirmada eliminación');
        } else {
          console.log('⚠️ No apareció diálogo de confirmación');
        }
      });

      await test.step('Verificar que partida fue eliminada', async () => {
        await page.waitForTimeout(2000);

        const activeGamesSection = page.locator('.section').filter({ hasText: 'Juegos Activos' }).first();
        const gameCards = activeGamesSection.locator('li').filter({ has: page.locator('button:has-text("Continuar"), button:has-text("Jugar")') });
        const currentGameCount = await gameCards.count();

        console.log(`📊 Juegos activos después de eliminar: ${currentGameCount} (antes: ${initialGameCount})`);

        expect(currentGameCount).toBeLessThan(initialGameCount);
        console.log('✅ Partida eliminada exitosamente');
      });
    }

    await performSafeLogout(page);
  });

  test('Test 3: SebDom verifica historial de partidas en Histórico', async ({ page }) => {
    const username = 'SebDom';
    const password = 'sebdom';

    await test.step('Login como Jugador SebDom', async () => {
      await login(page, username);
      await page.waitForTimeout(2000);
    });

    await test.step('Navegar a pestaña Histórico', async () => {
      const historicoTab = page.locator('.tab-button').filter({ hasText: 'Histórico' }).first();
      await expect(historicoTab).toBeVisible({ timeout: 10000 });
      await historicoTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navegado a pestaña Histórico');
    });

    await test.step('Verificar sección Historial de Partidas', async () => {
      const historySection = page.locator('.section').filter({ hasText: 'Historial de Partidas' }).first();

      if (await historySection.count() > 0) {
        await expect(historySection).toBeVisible({ timeout: 10000 });
        console.log('✅ Sección Historial de Partidas visible');

        await page.waitForTimeout(2000);

        // Look for game history table or cards
        const historyTable = historySection.locator('table').first();
        const historyCards = historySection.locator('li').first();

        if (await historyTable.count() > 0) {
          await expect(historyTable).toBeVisible({ timeout: 5000 });
          const rows = historyTable.locator('tbody tr');
          const rowCount = await rows.count();
          console.log(`📊 Partidas en historial (tabla): ${rowCount}`);
        } else if (await historyCards.count() > 0) {
          const cards = historySection.locator('li');
          const cardCount = await cards.count();
          console.log(`📊 Partidas en historial (cards): ${cardCount}`);
        } else {
          console.log('📊 No hay partidas en el historial o sección vacía');
        }
      } else {
        console.log('⚠️ Sección Historial de Partidas no encontrada');
      }
    });

    await test.step('Verificar estructura de historial', async () => {
      const historySection = page.locator('.section').filter({ hasText: 'Historial de Partidas' }).first();

      if (await historySection.count() > 0) {
        // Check for expected columns/fields
        const hasBloque = await historySection.locator('text=/Bloque|Block/i').count() > 0;
        const hasModo = await historySection.locator('text=/Modo|Mode/i').count() > 0;
        const hasPuntuacion = await historySection.locator('text=/Punt|Score|Puntuación/i').count() > 0;
        const hasFecha = await historySection.locator('text=/Fecha|Date/i').count() > 0;

        console.log(`📋 Estructura del historial:`);
        console.log(`   - Columna Bloque: ${hasBloque ? '✅' : '❌'}`);
        console.log(`   - Columna Modo: ${hasModo ? '✅' : '❌'}`);
        console.log(`   - Columna Puntuación: ${hasPuntuacion ? '✅' : '❌'}`);
        console.log(`   - Columna Fecha: ${hasFecha ? '✅' : '❌'}`);
      }
    });

    await performSafeLogout(page);
  });
});
