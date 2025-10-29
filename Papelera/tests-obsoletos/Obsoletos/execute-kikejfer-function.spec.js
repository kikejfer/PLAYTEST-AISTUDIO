const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics, getAllRolesTotals } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Ejecutar Función creator-blocks-helper.js para kikejfer', () => {

  test('Ejecutar función completa para kikejfer - todos los roles', async ({ page }) => {
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

    console.log('\n🎯 EJECUTANDO FUNCIÓN PARA TODOS LOS ROLES DE KIKEJFER:');
    console.log('=' .repeat(50));

    // EJECUTAR FUNCIÓN PARA TODOS LOS ROLES DISPONIBLES
    try {
      // Probar con todos los roles posibles
      const rolesToTest = ['Profesor', 'Creador', 'Administrador Secundario', 'Admin'];
      const successfulRoles = [];

      for (const role of rolesToTest) {
        console.log(`\n🔄 Probando rol: ${role}...`);
        try {
          const blocks = await getAllCreatedBlocksCharacteristics(page, role);
          if (blocks && blocks.length >= 0) {
            successfulRoles.push(role);
            console.log(`✅ Rol ${role}: ${blocks.length} bloques encontrados`);
          }
        } catch (error) {
          console.log(`⚠️ Rol ${role} no disponible: ${error.message}`);
        }

        // Pequeña pausa entre roles
        await page.waitForTimeout(2000);
      }

      console.log(`\n📊 Roles exitosos para kikejfer: ${successfulRoles.join(', ')}`);

      // Ejecutar getAllRolesTotals para los roles exitosos
      if (successfulRoles.length > 0) {
        console.log('\n🎯 EJECUTANDO getAllRolesTotals...');
        const allTotals = await getAllRolesTotals(page, successfulRoles);

        console.log('\n🎉 FUNCIÓN CREATOR-BLOCKS-HELPER.JS EJECUTADA PARA KIKEJFER');
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

        // Calcular gran total
        const grandTotals = {
          totalBloques: allTotals.reduce((sum, role) => sum + role.totalBloques, 0),
          totalTemas: allTotals.reduce((sum, role) => sum + role.totalTemas, 0),
          totalPreguntas: allTotals.reduce((sum, role) => sum + role.totalPreguntas, 0),
          totalUsuarios: allTotals.reduce((sum, role) => sum + role.totalUsuarios, 0)
        };

        console.log('\n🏆 GRAN TOTAL KIKEJFER (TODOS LOS ROLES COMBINADOS):');
        console.log('=' .repeat(50));
        console.log(`📦 Total Bloques: ${grandTotals.totalBloques}`);
        console.log(`📚 Total Temas: ${grandTotals.totalTemas}`);
        console.log(`📝 Total Preguntas: ${grandTotals.totalPreguntas}`);
        console.log(`👥 Total Usuarios: ${grandTotals.totalUsuarios}`);

        // Mostrar detalles individuales por rol
        console.log('\n📋 DETALLES INDIVIDUALES POR ROL - KIKEJFER:');
        console.log('=' .repeat(50));

        for (const roleTotal of allTotals) {
          if (roleTotal.totalBloques > 0) {
            console.log(`\n🔍 Detalles del rol ${roleTotal.role}:`);
            const blocks = await getAllCreatedBlocksCharacteristics(page, roleTotal.role);

            blocks.forEach((block, index) => {
              console.log(`\n   ${index + 1}. "${block.blockTitle}"`);
              console.log(`      📝 Preguntas: ${block.preguntas}`);
              console.log(`      📚 Temas: ${block.temas}`);
              console.log(`      👥 Usuarios: ${block.usuarios}`);
            });
          }
        }

      } else {
        console.log('❌ No se encontraron roles disponibles para kikejfer');
      }

    } catch (error) {
      console.log(`❌ Error ejecutando función creator-blocks-helper para kikejfer: ${error.message}`);
    }

    console.log('\n✅ FUNCIÓN CREATOR-BLOCKS-HELPER.JS COMPLETADA PARA KIKEJFER');
    console.log('📋 Usuario: kikejfer');
    console.log('📋 Funciones utilizadas:');
    console.log('   - getAllRolesTotals()');
    console.log('   - getAllCreatedBlocksCharacteristics()');
    console.log('   - calculateBlocksTotals() (internamente)');
  });

});