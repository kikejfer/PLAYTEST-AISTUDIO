const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllRolesTotals, calculateBlocksTotals } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Probar Nueva Función de Totales', () => {

  test('Calcular totales de bloques para todos los roles de Toñi', async ({ page }) => {
    console.log('🎯 PROBANDO NUEVA FUNCIÓN DE TOTALES');
    console.log('=' .repeat(60));

    // Login
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);

    // Navigate to teachers panel for role testing
    await page.goto(`${BASE_URL}/teachers-panel-schedules.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📊 CALCULANDO TOTALES PARA TODOS LOS ROLES');
    console.log('=' .repeat(50));

    try {
      // Get totals for all available roles
      const roles = ['Creador', 'Profesor'];
      const allTotals = await getAllRolesTotals(page, roles);

      console.log('\n🎉 RESUMEN FINAL DE TOTALES:');
      console.log('=' .repeat(60));

      allTotals.forEach((roleTotal, index) => {
        console.log(`\n${index + 1}. ROL: ${roleTotal.role.toUpperCase()}`);
        console.log(`   📦 Total Bloques: ${roleTotal.totalBloques}`);
        console.log(`   📚 Total Temas: ${roleTotal.totalTemas}`);
        console.log(`   📝 Total Preguntas: ${roleTotal.totalPreguntas}`);
        console.log(`   👥 Total Usuarios: ${roleTotal.totalUsuarios}`);

        if (roleTotal.error) {
          console.log(`   ❌ Error: ${roleTotal.error}`);
        }
      });

      // Calculate grand totals across all roles
      const grandTotals = {
        totalBloques: allTotals.reduce((sum, role) => sum + role.totalBloques, 0),
        totalTemas: allTotals.reduce((sum, role) => sum + role.totalTemas, 0),
        totalPreguntas: allTotals.reduce((sum, role) => sum + role.totalPreguntas, 0),
        totalUsuarios: allTotals.reduce((sum, role) => sum + role.totalUsuarios, 0)
      };

      console.log('\n🏆 GRAN TOTAL (TODOS LOS ROLES COMBINADOS):');
      console.log('=' .repeat(50));
      console.log(`📦 Bloques Total: ${grandTotals.totalBloques}`);
      console.log(`📚 Temas Total: ${grandTotals.totalTemas}`);
      console.log(`📝 Preguntas Total: ${grandTotals.totalPreguntas}`);
      console.log(`👥 Usuarios Total: ${grandTotals.totalUsuarios}`);

      // Test also the individual calculateBlocksTotals function
      console.log('\n🧪 PROBANDO FUNCIÓN calculateBlocksTotals CON DATOS DE EJEMPLO:');
      console.log('-' .repeat(50));

      const exampleBlocks = [
        { blockTitle: 'Test Block 1', preguntas: '10', temas: '2', usuarios: '5' },
        { blockTitle: 'Test Block 2', preguntas: '20', temas: '3', usuarios: '8' }
      ];

      const exampleTotals = calculateBlocksTotals(exampleBlocks, 'TestRole');
      console.log('Datos de entrada:', exampleBlocks);
      console.log('Resultado:', exampleTotals);

    } catch (error) {
      console.log(`❌ Error en cálculo de totales: ${error.message}`);
    }

    console.log('\n✅ PRUEBA DE FUNCIÓN DE TOTALES COMPLETADA');
  });

});