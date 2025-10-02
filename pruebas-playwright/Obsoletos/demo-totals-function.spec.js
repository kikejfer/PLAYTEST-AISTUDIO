const { test, expect } = require('@playwright/test');
const { calculateBlocksTotals } = require('./utils/creator-blocks-helper');

test.describe('Demo Función de Totales', () => {

  test('Demostrar función calculateBlocksTotals con datos de Toñi', async () => {
    console.log('🎯 DEMOSTRACIÓN DE FUNCIÓN DE TOTALES');
    console.log('=' .repeat(60));

    // Datos reales obtenidos de Toñi como Profesora
    const bloquesProfesora = [
      {
        blockTitle: 'Grado Informática Redes',
        preguntas: '79',
        temas: '2',
        usuarios: '1'
      },
      {
        blockTitle: 'Patrón de Yate (PY)',
        preguntas: '669',
        temas: '4',
        usuarios: '0'
      },
      {
        blockTitle: 'Patrón Embarcación Recreo (PER)',
        preguntas: '701',
        temas: '10',
        usuarios: '0'
      }
    ];

    // Datos simulados de Toñi como Creadora (mismos bloques según test anterior)
    const bloquesCreadora = [
      {
        blockTitle: 'Grado Informática Redes',
        preguntas: '79',
        temas: '2',
        usuarios: '1'
      },
      {
        blockTitle: 'Patrón de Yate (PY)',
        preguntas: '669',
        temas: '4',
        usuarios: '0'
      },
      {
        blockTitle: 'Patrón Embarcación Recreo (PER)',
        preguntas: '701',
        temas: '10',
        usuarios: '0'
      }
    ];

    console.log('📊 CALCULANDO TOTALES PARA CADA ROL:');
    console.log('=' .repeat(50));

    // Calcular totales para Profesora
    const totalesProfesora = calculateBlocksTotals(bloquesProfesora, 'Profesor');
    console.log('\n👩‍🏫 TOTALES COMO PROFESORA:');
    console.log(`   📦 Total Bloques: ${totalesProfesora.totalBloques}`);
    console.log(`   📚 Total Temas: ${totalesProfesora.totalTemas}`);
    console.log(`   📝 Total Preguntas: ${totalesProfesora.totalPreguntas}`);
    console.log(`   👥 Total Usuarios: ${totalesProfesora.totalUsuarios}`);

    // Calcular totales para Creadora
    const totalesCreadora = calculateBlocksTotals(bloquesCreadora, 'Creador');
    console.log('\n📝 TOTALES COMO CREADORA:');
    console.log(`   📦 Total Bloques: ${totalesCreadora.totalBloques}`);
    console.log(`   📚 Total Temas: ${totalesCreadora.totalTemas}`);
    console.log(`   📝 Total Preguntas: ${totalesCreadora.totalPreguntas}`);
    console.log(`   👥 Total Usuarios: ${totalesCreadora.totalUsuarios}`);

    // Crear array de todos los totales (como devolvería getAllRolesTotals)
    const allTotals = [totalesProfesora, totalesCreadora];

    console.log('\n🏆 GRAN TOTAL COMBINADO:');
    console.log('=' .repeat(40));

    const grandTotals = {
      totalBloques: allTotals.reduce((sum, role) => sum + role.totalBloques, 0),
      totalTemas: allTotals.reduce((sum, role) => sum + role.totalTemas, 0),
      totalPreguntas: allTotals.reduce((sum, role) => sum + role.totalPreguntas, 0),
      totalUsuarios: allTotals.reduce((sum, role) => sum + role.totalUsuarios, 0)
    };

    console.log(`📦 Total Bloques (ambos roles): ${grandTotals.totalBloques}`);
    console.log(`📚 Total Temas (ambos roles): ${grandTotals.totalTemas}`);
    console.log(`📝 Total Preguntas (ambos roles): ${grandTotals.totalPreguntas}`);
    console.log(`👥 Total Usuarios (ambos roles): ${grandTotals.totalUsuarios}`);

    console.log('\n📋 DETALLE DE BLOQUES INDIVIDUALES:');
    console.log('=' .repeat(50));

    bloquesProfesora.forEach((block, index) => {
      console.log(`\n${index + 1}. "${block.blockTitle}"`);
      console.log(`   📝 ${block.preguntas} preguntas`);
      console.log(`   📚 ${block.temas} temas`);
      console.log(`   👥 ${block.usuarios} usuarios`);
    });

    console.log('\n✅ FUNCIÓN DE TOTALES DEMOSTRADA EXITOSAMENTE');
    console.log('\n🔧 FUNCIONES CREADAS:');
    console.log('1. calculateBlocksTotals(blocksArray, role) - Calcula totales de un array de bloques');
    console.log('2. getAllRolesTotals(page, roles) - Obtiene totales para múltiples roles automáticamente');
  });

});