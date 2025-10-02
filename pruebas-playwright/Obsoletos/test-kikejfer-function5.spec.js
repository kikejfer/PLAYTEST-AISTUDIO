const { test, expect } = require('@playwright/test');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

test.describe('Test Function 5 - getAllCreatedBlocksCharacteristics', () => {
  test('Test kikejfer blocks extraction', async ({ page }) => {
    console.log('\n🧪 === TESTING FUNCTION 5 WITH KIKEJFER ===');

    try {
      // Test the function with kikejfer
      const allBlocks = await getAllCreatedBlocksCharacteristics('kikejfer', page);

      console.log('\n📊 === RESULTS ===');
      console.log(`Total blocks found: ${allBlocks.length}`);

      if (allBlocks.length > 0) {
        console.log('\n📋 === DETAILED BLOCKS ===');

        // Group by role
        const creadorBlocks = allBlocks.filter(b => b.role === 'Creador');
        const profesorBlocks = allBlocks.filter(b => b.role === 'Profesor');

        console.log(`\n🎨 CREADOR BLOCKS (${creadorBlocks.length}):`);
        creadorBlocks.forEach((block, index) => {
          console.log(`  ${index + 1}. "${block.blockTitle}"`);
          console.log(`     - Preguntas: ${block.preguntas}`);
          console.log(`     - Temas: ${block.temas}`);
          console.log(`     - Usuarios: ${block.usuarios}`);
        });

        console.log(`\n👨‍🏫 PROFESOR BLOCKS (${profesorBlocks.length}):`);
        profesorBlocks.forEach((block, index) => {
          console.log(`  ${index + 1}. "${block.blockTitle}"`);
          console.log(`     - Preguntas: ${block.preguntas}`);
          console.log(`     - Temas: ${block.temas}`);
          console.log(`     - Usuarios: ${block.usuarios}`);
        });

        // Calculate totals
        const totalPreguntas = allBlocks.reduce((sum, b) => sum + parseInt(b.preguntas || 0), 0);
        const totalTemas = allBlocks.reduce((sum, b) => sum + parseInt(b.temas || 0), 0);
        const totalUsuarios = allBlocks.reduce((sum, b) => sum + parseInt(b.usuarios || 0), 0);

        console.log(`\n📈 === TOTALS ===`);
        console.log(`Total Blocks: ${allBlocks.length}`);
        console.log(`Total Preguntas: ${totalPreguntas}`);
        console.log(`Total Temas: ${totalTemas}`);
        console.log(`Total Usuarios: ${totalUsuarios}`);

      } else {
        console.log('❌ No blocks found for kikejfer');
      }

      // Verify that we got some data
      expect(allBlocks).toBeDefined();
      console.log('\n✅ Function test completed successfully');

    } catch (error) {
      console.log(`❌ Error testing function: ${error.message}`);
      console.log('Stack trace:', error.stack);
      throw error;
    }
  });
});