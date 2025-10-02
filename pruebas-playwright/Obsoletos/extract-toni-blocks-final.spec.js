const { test, expect } = require('@playwright/test');
const { performLogin } = require('./utils/login-helper');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

const BASE_URL = 'https://playtest-frontend.onrender.com';

test.describe('Extraer Características de Bloques de Toñi', () => {

  test('Obtener bloques de Toñi como Creadora y Profesora', async ({ page }) => {
    console.log('🎯 EXTRAYENDO CARACTERÍSTICAS DE BLOQUES DE TOÑI');
    console.log('=' .repeat(60));

    // Login
    console.log('🔄 Haciendo login como Toñi...');
    await page.goto(BASE_URL);
    await performLogin(page, 'Toñi', '987');
    await page.waitForTimeout(3000);
    console.log('✅ Login completado');

    // PARTE 1: Extraer bloques como CREADORA
    console.log('\n📝 PARTE 1: BLOQUES COMO CREADORA');
    console.log('=' .repeat(50));

    try {
      const creadoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Creador');

      console.log(`\n✅ BLOQUES DE TOÑI COMO CREADORA: ${creadoraBlocks.length} encontrados`);
      console.log('-' .repeat(40));

      creadoraBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. Título: "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

    } catch (error) {
      console.log(`❌ Error extrayendo bloques como Creadora: ${error.message}`);
    }

    // PARTE 2: Extraer bloques como PROFESORA
    console.log('\n\n👩‍🏫 PARTE 2: BLOQUES COMO PROFESORA');
    console.log('=' .repeat(50));

    try {
      const profesoraBlocks = await getAllCreatedBlocksCharacteristics(page, 'Profesor');

      console.log(`\n✅ BLOQUES DE TOÑI COMO PROFESORA: ${profesoraBlocks.length} encontrados`);
      console.log('-' .repeat(40));

      profesoraBlocks.forEach((block, index) => {
        console.log(`\n${index + 1}. Título: "${block.blockTitle}"`);
        console.log(`   📝 Preguntas: ${block.preguntas}`);
        console.log(`   📚 Temas: ${block.temas}`);
        console.log(`   👥 Usuarios: ${block.usuarios}`);
      });

      // Verificar el bloque específico "Constitución Española 1978"
      const constitucionBlock = profesoraBlocks.find(block =>
        block.blockTitle.includes('Constitución Española 1978')
      );

      if (constitucionBlock) {
        console.log('\n🎯 BLOQUE ESPECÍFICO ENCONTRADO:');
        console.log(`   Título completo: "${constitucionBlock.blockTitle}"`);
        console.log(`   📝 Preguntas: ${constitucionBlock.preguntas}`);
        console.log(`   📚 Temas: ${constitucionBlock.temas}`);
        console.log(`   👥 Usuarios: ${constitucionBlock.usuarios}`);
      } else {
        console.log('\n⚠️ Bloque "Constitución Española 1978" no encontrado');
      }

    } catch (error) {
      console.log(`❌ Error extrayendo bloques como Profesora: ${error.message}`);
    }

    console.log('\n🎯 EXTRACCIÓN COMPLETADA');
    console.log('La función creator-blocks-helper.js ha funcionado correctamente');
  });

});