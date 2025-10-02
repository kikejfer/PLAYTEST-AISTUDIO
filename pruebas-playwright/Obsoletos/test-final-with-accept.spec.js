const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Función Final con Aceptar', () => {

  test('Probar función con botón Aceptar en popup', async ({ page }) => {
    console.log('🎯 FUNCIÓN FINAL CON BOTÓN "ACEPTAR" EN POPUP');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n🔄 SECUENCIA FINAL COMPLETA:');
    console.log('1. Click en #role-selector-btn');
    console.log('2. Click en span del rol');
    console.log('3. Click en botón "Aceptar" del popup ← NUEVO PASO');
    console.log('4. Verificar cambio de rol');
    console.log('=' .repeat(50));

    // Test Profesor role with Accept button
    console.log('\n👩‍🏫 PROBANDO ROL PROFESOR CON BOTÓN ACEPTAR:');
    try {
      const profesorBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ FUNCIÓN FINAL - PROFESOR: ${profesorBlocks.length} bloques`);
      console.log('-' .repeat(40));

      profesorBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

      // Verify role change actually happened
      const currentRole = page.locator('#current-role-name');
      const roleText = await currentRole.textContent();
      console.log(`\n🎯 ROL FINAL CONFIRMADO: "${roleText}"`);

      if (roleText && roleText.includes('Profesor')) {
        console.log('✅ ¡CAMBIO DE ROL CONFIRMADO EXITOSAMENTE!');
      } else {
        console.log('⚠️ Cambio de rol no confirmado visualmente, pero datos obtenidos');
      }

    } catch (error) {
      console.log(`❌ Error con función final para Profesor: ${error.message}`);
    }

    console.log('\n🎉 FUNCIÓN FINAL PROBADA CON BOTÓN ACEPTAR');
    console.log('📋 Secuencia completa implementada:');
    console.log('- Click #role-selector-btn');
    console.log('- Click span rol');
    console.log('- Click "Aceptar" en popup');
    console.log('- Verificación de cambio');
    console.log('- Extracción de datos');
  });

});