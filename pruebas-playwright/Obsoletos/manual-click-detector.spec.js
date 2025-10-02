const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Detector de Clicks Manuales', () => {

  test('Detectar elementos que clickeas manualmente', async ({ page }) => {
    console.log('🎯 DETECTOR DE CLICKS MANUALES ACTIVADO');
    console.log('👆 HAZ CLICKS MANUALMENTE Y YO LOS DETECTARÉ');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Haciendo login automáticamente...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ PÁGINA CARGADA - AHORA HAZ CLICKS MANUALMENTE');
    console.log('🔍 DETECTANDO TODOS TUS CLICKS...');
    console.log('-' .repeat(50));

    // Add click listeners to detect all clicks
    await page.evaluate(() => {
      let clickCounter = 1;

      // Function to get element details
      function getElementInfo(element) {
        const tagName = element.tagName.toLowerCase();
        const id = element.id || 'no-id';
        const className = element.className || 'no-class';
        const text = element.textContent?.trim().substring(0, 50) || 'no-text';

        // Get parent info
        const parent = element.parentElement;
        const parentTag = parent ? parent.tagName.toLowerCase() : 'no-parent';
        const parentId = parent ? (parent.id || 'no-parent-id') : 'no-parent';
        const parentClass = parent ? (parent.className || 'no-parent-class') : 'no-parent';

        return {
          tagName, id, className, text, parentTag, parentId, parentClass
        };
      }

      // Add click listener to document
      document.addEventListener('click', function(event) {
        const element = event.target;
        const info = getElementInfo(element);

        console.log(`🖱️ CLICK ${clickCounter}: <${info.tagName}>`);
        console.log(`   📍 ID: "${info.id}"`);
        console.log(`   🎨 Class: "${info.className}"`);
        console.log(`   📝 Text: "${info.text}"`);
        console.log(`   👨‍👩‍👧‍👦 Parent: <${info.parentTag}> id="${info.parentId}" class="${info.parentClass}"`);
        console.log(`   🔍 Selector sugerido: #${info.id !== 'no-id' ? info.id : info.tagName}`);
        console.log('   ' + '='.repeat(40));

        clickCounter++;
      });

      // Also listen for role changes
      const roleNameElement = document.querySelector('#current-role-name');
      if (roleNameElement) {
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              console.log(`🔄 ROL CAMBIADO A: "${roleNameElement.textContent}"`);
            }
          });
        });

        observer.observe(roleNameElement, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }

      console.log('🎯 DETECTORES ACTIVADOS - HAZ TUS CLICKS');
    });

    // Monitor role changes from playwright side too
    const currentRole = page.locator('#current-role-name');

    let previousRole = await currentRole.textContent();
    console.log(`📋 ROL INICIAL: "${previousRole}"`);

    // Keep checking for role changes every 2 seconds
    const checkInterval = setInterval(async () => {
      try {
        const newRole = await currentRole.textContent();
        if (newRole !== previousRole) {
          console.log(`🚀 PLAYWRIGHT DETECTÓ CAMBIO DE ROL: "${previousRole}" → "${newRole}"`);
          previousRole = newRole;
        }
      } catch (error) {
        // Ignore errors
      }
    }, 2000);

    console.log('\n👆 AHORA HAZ LOS CLICKS MANUALES PARA CAMBIAR A ROL PROFESOR');
    console.log('🕐 TIEMPO DISPONIBLE: 120 segundos');
    console.log('📊 TODOS LOS CLICKS SERÁN DETECTADOS Y MOSTRADOS EN LA CONSOLA');

    // Wait 2 minutes for manual interaction
    await page.waitForTimeout(120000);

    clearInterval(checkInterval);
    console.log('\n⏰ TIEMPO TERMINADO');
    console.log('📋 REVISA LOS LOGS ARRIBA PARA VER TODOS LOS ELEMENTOS QUE CLICKEASTE');
  });

});