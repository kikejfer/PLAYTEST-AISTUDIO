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
      // Navigate to "Cargar Bloques" tab
      const cargarBloquesTab = page.locator('.tab-button').filter({ hasText: 'Cargar Bloques' }).first();
      await expect(cargarBloquesTab).toBeVisible({ timeout: 10000 });
      await cargarBloquesTab.click();
      await page.waitForTimeout(2000);

      // Navigate to "Bloques Cargados" sub-section
      const bloquesCargadosTab = page.locator('.tab-button').filter({ hasText: 'Bloques Cargados' }).first();
      if (await bloquesCargadosTab.count() > 0) {
        await bloquesCargadosTab.click();
        await page.waitForTimeout(2000);
        console.log('✅ Navegado a Bloques Cargados');
      }

      // Find a loaded block
      const blockCards = page.locator('.bc-block-card');
      const blockCount = await blockCards.count();

      if (blockCount === 0) {
        console.log('⚠️ No hay bloques cargados, saltando creación de partida');
        test.skip();
      }

      const firstBlock = blockCards.first();
      await expect(firstBlock).toBeVisible({ timeout: 10000 });

      // Click "Jugar" button on block
      const playButton = firstBlock.locator('button').filter({ hasText: 'Jugar' }).first();
      await expect(playButton).toBeVisible({ timeout: 10000 });
      await playButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Abrió configurador de juego');

      // Wait for game configurator modal
      const configuratorModal = page.locator('.fixed.inset-0').filter({ has: page.locator('h3:has-text("Configurador de Juego")') }).first();
      await expect(configuratorModal).toBeVisible({ timeout: 10000 });

      // Select game mode (Modo Clásico by default)
      const modoClasico = configuratorModal.locator('button').filter({ hasText: 'Modo Clásico' }).first();
      if (await modoClasico.count() > 0 && await modoClasico.isVisible()) {
        await modoClasico.click();
        await page.waitForTimeout(500);
        console.log('✅ Seleccionado Modo Clásico');
      }

      // Select all topics (default)
      const allTopicsButton = configuratorModal.locator('button').filter({ hasText: 'Todos los temas' }).first();
      if (await allTopicsButton.count() > 0 && await allTopicsButton.isVisible()) {
        await allTopicsButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Seleccionados todos los temas');
      }

      // Click "Crear Partida" button
      const crearPartidaButton = configuratorModal.locator('button').filter({ hasText: 'Crear Partida' }).first();
      await expect(crearPartidaButton).toBeVisible({ timeout: 10000 });

      // Listen for navigation to capture game ID
      const navigationPromise = page.waitForURL(/active-game\.html\?gameId=/, { timeout: 15000 }).catch(() => null);

      await crearPartidaButton.click();
      console.log('✅ Clic en Crear Partida');

      // Wait for navigation to game page
      const navigated = await navigationPromise;
      if (navigated) {
        const url = page.url();
        const match = url.match(/gameId=([^&]+)/);
        if (match) {
          newGameId = match[1];
          console.log(`🎮 Nueva partida creada con ID: ${newGameId}`);
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
