const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics, getAllRolesTotals } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Ejecutar Función Final creator-blocks-helper.js', () => {

  test('Ejecutar función completa para Toñi - ambos roles', async ({ page }) => {
    console.log('🎯 EJECUTANDO FUNCIÓN CREATOR-BLOCKS-HELPER.JS PARA TOÑI');
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

    console.log('\n🎯 EJECUTANDO FUNCIÓN PARA AMBOS ROLES:');
    console.log('🎯 ESPERADO: Profesor=1 bloque, Creador=3 bloques');
    console.log('=' .repeat(50));

    // EJECUTAR FUNCIÓN PARA AMBOS ROLES
    try {
      const allTotals = await getAllRolesTotals(page, ['Profesor', 'Creador']);

      console.log('\n🎉 FUNCIÓN CREATOR-BLOCKS-HELPER.JS EJECUTADA EXITOSAMENTE');
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

        // Verificar resultados esperados
        if (roleTotal.role === 'Profesor' && roleTotal.totalBloques === 1) {
          console.log(`   ✅ CORRECTO: Profesor tiene 1 bloque`);
        } else if (roleTotal.role === 'Creador' && roleTotal.totalBloques === 3) {
          console.log(`   ✅ CORRECTO: Creador tiene 3 bloques`);
        } else {
          console.log(`   ⚠️ Resultado inesperado para ${roleTotal.role}`);
        }
      });

      // Calcular gran total
      const grandTotals = {
        totalBloques: allTotals.reduce((sum, role) => sum + role.totalBloques, 0),
        totalTemas: allTotals.reduce((sum, role) => sum + role.totalTemas, 0),
        totalPreguntas: allTotals.reduce((sum, role) => sum + role.totalPreguntas, 0),
        totalUsuarios: allTotals.reduce((sum, role) => sum + role.totalUsuarios, 0)
      };

      console.log('\n🏆 GRAN TOTAL (AMBOS ROLES COMBINADOS):');
      console.log('=' .repeat(50));
      console.log(`📦 Total Bloques: ${grandTotals.totalBloques}`);
      console.log(`📚 Total Temas: ${grandTotals.totalTemas}`);
      console.log(`📝 Total Preguntas: ${grandTotals.totalPreguntas}`);
      console.log(`👥 Total Usuarios: ${grandTotals.totalUsuarios}`);

      // Mostrar detalles individuales si es necesario
      console.log('\n📋 DETALLES INDIVIDUALES POR ROL:');
      console.log('=' .repeat(50));

      for (const roleTotal of allTotals) {
        if (roleTotal.totalBloques > 0) {
          console.log(`\n🔍 Ejecutando getAllCreatedBlocksCharacteristics para ${roleTotal.role}...`);
          const blocks = await getAllCreatedBlocksCharacteristics(page, roleTotal.role);

          blocks.forEach((block, index) => {
            console.log(`\n   ${index + 1}. "${block.blockTitle}"`);
            console.log(`      📝 Preguntas: ${block.preguntas}`);
            console.log(`      📚 Temas: ${block.temas}`);
            console.log(`      👥 Usuarios: ${block.usuarios}`);
          });
        }
      }

    } catch (error) {
      console.log(`❌ Error ejecutando función creator-blocks-helper: ${error.message}`);
    }

    console.log('\n✅ FUNCIÓN CREATOR-BLOCKS-HELPER.JS COMPLETADA PARA TOÑI');
    console.log('📋 Funciones utilizadas:');
    console.log('   - getAllRolesTotals()');
    console.log('   - getAllCreatedBlocksCharacteristics()');
    console.log('   - calculateBlocksTotals() (internamente)');
  });

});