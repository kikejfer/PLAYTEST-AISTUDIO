const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllRolesTotals } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Kikejfer Simple Function Test', () => {

  test('Execute creator-blocks-helper for kikejfer - single attempt', async ({ page }) => {
    console.log('🎯 EJECUTANDO FUNCIÓN CREATOR-BLOCKS-HELPER.JS PARA KIKEJFER');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como kikejfer...');
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n🎯 EJECUTANDO FUNCIÓN PARA KIKEJFER - ROLES DISPONIBLES:');
    console.log('=' .repeat(50));

    try {
      // Try to find available roles first
      const rolesToTest = ['Profesor', 'Creador'];
      const results = [];

      for (const role of rolesToTest) {
        console.log(`\n🔄 Probando rol: ${role}...`);
        try {
          const totals = await getAllRolesTotals(page, [role]);
          if (totals && totals.length > 0) {
            results.push(totals[0]);
            console.log(`✅ Rol ${role}: ${totals[0].totalBloques} bloques encontrados`);
          }
        } catch (error) {
          console.log(`⚠️ Rol ${role} falló: ${error.message}`);
        }

        // Small break between roles
        await page.waitForTimeout(3000);
      }

      // Display results
      console.log('\n🎉 FUNCIÓN CREATOR-BLOCKS-HELPER.JS EJECUTADA PARA KIKEJFER');
      console.log('=' .repeat(60));

      if (results.length > 0) {
        results.forEach((roleTotal, index) => {
          console.log(`\n📊 ${index + 1}. ROL: ${roleTotal.role.toUpperCase()}`);
          console.log(`   📦 Total Bloques: ${roleTotal.totalBloques}`);
          console.log(`   📚 Total Temas: ${roleTotal.totalTemas}`);
          console.log(`   📝 Total Preguntas: ${roleTotal.totalPreguntas}`);
          console.log(`   👥 Total Usuarios: ${roleTotal.totalUsuarios}`);

          if (roleTotal.error) {
            console.log(`   ❌ Error: ${roleTotal.error}`);
          }
        });

        // Calculate grand total
        const grandTotals = {
          totalBloques: results.reduce((sum, role) => sum + role.totalBloques, 0),
          totalTemas: results.reduce((sum, role) => sum + role.totalTemas, 0),
          totalPreguntas: results.reduce((sum, role) => sum + role.totalPreguntas, 0),
          totalUsuarios: results.reduce((sum, role) => sum + role.totalUsuarios, 0)
        };

        console.log('\n🏆 GRAN TOTAL KIKEJFER (TODOS LOS ROLES COMBINADOS):');
        console.log('=' .repeat(50));
        console.log(`📦 Total Bloques: ${grandTotals.totalBloques}`);
        console.log(`📚 Total Temas: ${grandTotals.totalTemas}`);
        console.log(`📝 Total Preguntas: ${grandTotals.totalPreguntas}`);
        console.log(`👥 Total Usuarios: ${grandTotals.totalUsuarios}`);
      } else {
        console.log('❌ No se pudieron obtener resultados para ningún rol de kikejfer');
      }

    } catch (error) {
      console.log(`❌ Error general ejecutando función creator-blocks-helper para kikejfer: ${error.message}`);
    }

    console.log('\n✅ FUNCIÓN CREATOR-BLOCKS-HELPER.JS COMPLETADA PARA KIKEJFER');
  });

});