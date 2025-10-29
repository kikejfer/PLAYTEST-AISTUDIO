const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Secuencia Correcta para Profesor', () => {

  test('Usar secuencia correcta: role-selector-container → role-selector-btn → dropdown', async ({ page }) => {
    console.log('🎯 PROBANDO SECUENCIA CORRECTA PARA ACCEDER A PROFESOR');
    console.log('=' .repeat(60));

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📍 PASO 1: Click en "Creador de contenido" button');
    const creadorButton = page.locator('button:has(span:text("Creador de contenido"))');
    const creadorExists = await creadorButton.count();
    if (creadorExists > 0) {
      await creadorButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked "Creador de contenido"');
    }

    console.log('📍 PASO 2: Click en #role-selector-container');
    const roleSelectorContainer = page.locator('#role-selector-container');
    await roleSelectorContainer.click();
    await page.waitForTimeout(1000);
    console.log('✅ Clicked #role-selector-container');

    console.log('📍 PASO 3: Click en #role-selector-btn');
    const roleSelectorBtn = page.locator('#role-selector-btn');
    const btnExists = await roleSelectorBtn.count();
    console.log(`#role-selector-btn existe: ${btnExists > 0 ? 'SÍ' : 'NO'}`);

    if (btnExists > 0) {
      const btnVisible = await roleSelectorBtn.isVisible();
      console.log(`#role-selector-btn visible: ${btnVisible ? 'SÍ' : 'NO'}`);

      await roleSelectorBtn.click();
      await page.waitForTimeout(1500);
      console.log('✅ Clicked #role-selector-btn');

      console.log('📍 PASO 4: Verificar #role-selector-dropdown');
      const dropdown = page.locator('#role-selector-dropdown');
      const dropdownExists = await dropdown.count();
      const dropdownVisible = await dropdown.isVisible();

      console.log(`#role-selector-dropdown existe: ${dropdownExists > 0 ? 'SÍ' : 'NO'}`);
      console.log(`#role-selector-dropdown visible: ${dropdownVisible ? 'SÍ' : 'NO'}`);

      if (dropdownVisible) {
        console.log('📍 PASO 5: Verificar #role-options dentro del dropdown');
        const roleOptions = page.locator('#role-options');
        const optionsExists = await roleOptions.count();
        const optionsVisible = await roleOptions.isVisible();

        console.log(`#role-options existe: ${optionsExists > 0 ? 'SÍ' : 'NO'}`);
        console.log(`#role-options visible: ${optionsVisible ? 'SÍ' : 'NO'}`);

        if (optionsVisible) {
          console.log('📍 PASO 6: Buscar span "Profesor"');
          const profesorSpan = page.locator('#role-options span:text("Profesor")');
          const profesorExists = await profesorSpan.count();
          const profesorVisible = await profesorSpan.isVisible();

          console.log(`Span "Profesor" existe: ${profesorExists > 0 ? 'SÍ' : 'NO'}`);
          console.log(`Span "Profesor" visible: ${profesorVisible ? 'SÍ' : 'NO'}`);

          if (profesorVisible) {
            console.log('📍 PASO 7: Click en span "Profesor"');
            await profesorSpan.click();
            await page.waitForTimeout(3000);
            console.log('✅ Clicked en span "Profesor"');

            // Verify role change
            const currentRole = page.locator('#current-role-name');
            const currentRoleText = await currentRole.textContent();
            console.log(`🎯 Rol actual después del cambio: "${currentRoleText}"`);

            if (currentRoleText && currentRoleText.includes('Profesor')) {
              console.log('🎉 ¡CAMBIO DE ROL EXITOSO!');

              // Now try to navigate to Recursos tab
              console.log('📍 PASO 8: Navegar a pestaña Recursos');
              const recursosTab = page.locator('.tab-button:has-text("Recursos"), button:has-text("Recursos")');
              const recursosExists = await recursosTab.count();
              console.log(`Botón Recursos existe: ${recursosExists > 0 ? 'SÍ' : 'NO'}`);

              if (recursosExists > 0) {
                await recursosTab.first().click();
                await page.waitForTimeout(3000);
                console.log('✅ Navegado a pestaña Recursos');

                // Check for blocks
                console.log('📍 PASO 9: Buscar bloques en recursos');
                const container = page.locator('#recursos-bloques-creados-container');
                const containerExists = await container.count();
                console.log(`Container recursos existe: ${containerExists > 0 ? 'SÍ' : 'NO'}`);

                if (containerExists > 0) {
                  const blockCards = container.locator('.bc-block-card');
                  const cardCount = await blockCards.count();
                  console.log(`✅ Bloques encontrados como Profesor: ${cardCount}`);

                  for (let i = 0; i < cardCount; i++) {
                    const card = blockCards.nth(i);
                    const title = await card.locator('.bc-block-title').textContent();
                    console.log(`  ${i + 1}. "${title?.trim()}"`);

                    if (title && title.includes('Constitución')) {
                      console.log(`    🎯 ¡ENCONTRADO! Bloque Constitución Española`);
                    }
                  }
                }
              }
            }
          } else {
            console.log('❌ Span "Profesor" no es visible');
          }
        } else {
          console.log('❌ #role-options no es visible');
        }
      } else {
        console.log('❌ #role-selector-dropdown no es visible después del click');
      }
    } else {
      console.log('❌ #role-selector-btn no existe');
    }

    console.log('\n⏸️ Secuencia completada, manteniendo navegador abierto...');
    await page.waitForTimeout(30000);
  });

});