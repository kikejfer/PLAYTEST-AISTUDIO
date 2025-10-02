const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllRolesTotals } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Test creator-blocks-helper for nickname user', () => {

  test('Execute creator-blocks-helper function for nickname', async ({ page }) => {
    console.log('🎯 EJECUTANDO FUNCIÓN CREATOR-BLOCKS-HELPER.JS PARA KIKEJFER');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Login como kikejfer...');
    await page.goto(BASE_URL);
    await performLogin(page, 'kikejfer', '123456');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForTimeout(5000);

    console.log('\n🎯 EJECUTANDO FUNCIÓN PARA NICKNAME:');
    console.log('=' .repeat(50));

    try {
      // Try both roles
      const roles = ['Profesor', 'Creador'];
      const allTotals = await getAllRolesTotals(page, roles);

      console.log('\n🎉 FUNCIÓN CREATOR-BLOCKS-HELPER.JS EJECUTADA PARA NICKNAME');
      console.log('=' .repeat(60));

      allTotals.forEach((roleTotal, index) => {
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
        totalBloques: allTotals.reduce((sum, role) => sum + role.totalBloques, 0),
        totalTemas: allTotals.reduce((sum, role) => sum + role.totalTemas, 0),
        totalPreguntas: allTotals.reduce((sum, role) => sum + role.totalPreguntas, 0),
        totalUsuarios: allTotals.reduce((sum, role) => sum + role.totalUsuarios, 0)
      };

      console.log('\n🏆 GRAN TOTAL NICKNAME (TODOS LOS ROLES COMBINADOS):');
      console.log('=' .repeat(50));
      console.log(`📦 Total Bloques: ${grandTotals.totalBloques}`);
      console.log(`📚 Total Temas: ${grandTotals.totalTemas}`);
      console.log(`📝 Total Preguntas: ${grandTotals.totalPreguntas}`);
      console.log(`👥 Total Usuarios: ${grandTotals.totalUsuarios}`);

    } catch (error) {
      console.log(`❌ Error ejecutando función creator-blocks-helper para nickname: ${error.message}`);
    }

    console.log('\n✅ FUNCIÓN CREATOR-BLOCKS-HELPER.JS COMPLETADA PARA NICKNAME');
  });

});