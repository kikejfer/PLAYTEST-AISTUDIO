const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Detector Simple de Clicks', () => {

  test('Ir directo a teachers panel y detectar clicks', async ({ page }) => {
    console.log('🎯 DETECTOR SIMPLE DE CLICKS - IR DIRECTO A TEACHERS PANEL');
    console.log('👆 HAZ LOGIN MANUALMENTE Y LUEGO HAZ CLICKS PARA CAMBIAR ROL');
    console.log('=' .repeat(60));

    // Go directly to teachers panel
    console.log('🔄 Navegando directamente a teachers-panel...');
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForTimeout(3000);

    console.log('✅ PÁGINA CARGADA');
    console.log('👆 AHORA HAZ LOGIN MANUALMENTE SI ES NECESARIO');
    console.log('🔍 LUEGO HAZ LOS CLICKS PARA CAMBIAR DE ROL');
    console.log('📊 TODOS LOS CLICKS SERÁN DETECTADOS...');
    console.log('-' .repeat(50));

    // Add click listeners to detect all clicks
    await page.evaluate(() => {
      let clickCounter = 1;

      // Function to get element details
      function getElementInfo(element) {
        const tagName = element.tagName.toLowerCase();
        const id = element.id || 'no-id';
        const className = element.className || 'no-class';
        const text = element.textContent?.trim().substring(0, 100) || 'no-text';
        const type = element.type || 'no-type';
        const value = element.value || 'no-value';

        // Get parent info
        const parent = element.parentElement;
        const parentTag = parent ? parent.tagName.toLowerCase() : 'no-parent';
        const parentId = parent ? (parent.id || 'no-parent-id') : 'no-parent';
        const parentClass = parent ? (parent.className || 'no-parent-class') : 'no-parent';

        return {
          tagName, id, className, text, type, value, parentTag, parentId, parentClass
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
        if (info.type !== 'no-type') console.log(`   ⚙️ Type: "${info.type}"`);
        if (info.value !== 'no-value') console.log(`   💎 Value: "${info.value}"`);
        console.log(`   👨‍👩‍👧‍👦 Parent: <${info.parentTag}> id="${info.parentId}" class="${info.parentClass}"`);
        console.log(`   🔍 Selector: #${info.id !== 'no-id' ? info.id : info.tagName + (info.className !== 'no-class' ? '.' + info.className.split(' ')[0] : '')}`);
        console.log('   ' + '='.repeat(60));

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

        console.log(`📋 ROL INICIAL: "${roleNameElement.textContent}"`);
      }

      console.log('🎯 DETECTORES ACTIVADOS - HAZ TUS CLICKS PARA CAMBIAR ROL');
    });

    console.log('\n👆 AHORA HAZ LOS CLICKS MANUALES:');
    console.log('1. Login si es necesario');
    console.log('2. Cambiar de rol Creador a Profesor');
    console.log('3. Hacer click en el botón "Aceptar" del popup');
    console.log('\n🕐 TIEMPO DISPONIBLE: 180 segundos');
    console.log('📊 TODOS LOS CLICKS APARECERÁN EN LA CONSOLA');

    // Wait 3 minutes for manual interaction
    await page.waitForTimeout(180000);

    console.log('\n⏰ TIEMPO TERMINADO');
    console.log('📋 REVISA LOS LOGS ARRIBA PARA VER LA SECUENCIA CORRECTA');
  });

});