const { test, expect } = require('@playwright/test');
const { getAllCreatedBlocksCharacteristics } = require('./utils/creator-blocks-helper');

test.describe('Test AdminPrincipal Format', () => {
  test('Test new AdminPrincipal format with kikejfer', async ({ page }) => {
    console.log('\n🧪 === TESTING NEW ADMINPRINCIPAL FORMAT ===');

    try {
      // Test the function with kikejfer
      const result = await getAllCreatedBlocksCharacteristics('kikejfer', page);

      console.log('\n📊 === ADMINPRINCIPAL FORMAT RESULT ===');
      console.log('Full result:', JSON.stringify(result, null, 2));

      console.log('\n📋 === CREATORS DATA ===');
      result.creators.forEach((creator, index) => {
        console.log(`${index + 1}. ${creator.nickname}:`);
        console.log(`   - Blocks: ${creator.blocks}`);
        console.log(`   - Topics: ${creator.topics}`);
        console.log(`   - Questions: ${creator.questions}`);
        console.log(`   - Users: ${creator.users}`);
      });

      console.log('\n👨‍🏫 === PROFESSORS DATA ===');
      result.professors.forEach((professor, index) => {
        console.log(`${index + 1}. ${professor.nickname}:`);
        console.log(`   - Blocks: ${professor.blocks}`);
        console.log(`   - Topics: ${professor.topics}`);
        console.log(`   - Questions: ${professor.questions}`);
        console.log(`   - Users: ${professor.users}`);
      });

      // Verify structure
      expect(result).toHaveProperty('creators');
      expect(result).toHaveProperty('professors');
      expect(Array.isArray(result.creators)).toBe(true);
      expect(Array.isArray(result.professors)).toBe(true);

      console.log('\n✅ AdminPrincipal format test completed successfully');

    } catch (error) {
      console.log(`❌ Error testing AdminPrincipal format: ${error.message}`);
      console.log('Stack trace:', error.stack);
      throw error;
    }
  });
});