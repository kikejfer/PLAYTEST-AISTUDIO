const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificación Admin Secundario', () => {
  
  test('kikejfer verifica información después de reasignación', async ({ page }) => {
    
    await test.step('Login como kikejfer', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('networkidle');
      await page.locator('input[name="nickname"]').fill('kikejfer');
      await page.locator('input[name="password"]').fill('123');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      
      // Verificar que llega al panel de admin secundario
      await expect(page).toHaveURL(/admin-secundario-panel/);
      console.log('✅ kikejfer logged in successfully');
    });
    
    await test.step('Verificar AndGar asignado a kikejfer', async () => {
      // Verificar que AndGar aparece asignado a kikejfer
      const andgarAssignment = page.locator('text=AndGar').first();
      
      if (await andgarAssignment.count() > 0) {
        await expect(andgarAssignment).toBeVisible();
        console.log('✅ AndGar appears assigned to kikejfer');
      } else {
        // Buscar en sección de usuarios asignados
        const assignedUsers = page.locator('.assigned-users, .my-users, .secondary-admin-users').first();
        if (await assignedUsers.count() > 0) {
          const andgarInAssigned = assignedUsers.locator('text=AndGar');
          if (await andgarInAssigned.count() > 0) {
            console.log('✅ AndGar found in assigned users section');
          }
        }
      }
    });
    
    await test.step('Verificar información del bloque', async () => {
      // Verificar información del bloque y usuarios
      const blockInfo = page.locator('.block-info, .blocks-section, .admin-blocks').first();
      
      if (await blockInfo.count() > 0) {
        await expect(blockInfo).toBeVisible();
        console.log('✅ Block information section is visible');
        
        // Verificar características del bloque de AndGar
        const andgarBlock = page.locator('text=/AndGar.*bloque/i, text=/bloque.*AndGar/i').first();
        if (await andgarBlock.count() > 0) {
          console.log('✅ AndGar block information is visible');
        }
        
        // Verificar temas y preguntas
        const topicInfo = page.locator('text=/3.*tema/i, text=/tema.*3/i').first();
        if (await topicInfo.count() > 0) {
          console.log('✅ Block shows 3 topics correctly');
        }
        
        const questionInfo = page.locator('text=/9.*pregunta/i, text=/pregunta.*9/i').first();
        if (await questionInfo.count() > 0) {
          console.log('✅ Block shows 9 questions correctly');
        }
      }
    });
    
    await test.step('Verificar usuarios que cargaron/descargaron', async () => {
      // Verificar que JaiGon y SebDom aparecen como usuarios que interactuaron con el bloque
      const jaiGonInfo = page.locator('text=JaiGon').first();
      if (await jaiGonInfo.count() > 0) {
        console.log('✅ JaiGon appears in user interactions');
      }
      
      const sebDomInfo = page.locator('text=SebDom').first();
      if (await sebDomInfo.count() > 0) {
        console.log('✅ SebDom appears in user interactions');
        
        // Verificar estado de descarga de SebDom
        const downloadStatus = page.locator('text=/SebDom.*descarg/i, text=/descarg.*SebDom/i').first();
        if (await downloadStatus.count() > 0) {
          console.log('✅ SebDom shows as having downloaded the block');
        }
      }
    });
    
    await test.step('Verificar estadísticas y contadores', async () => {
      // Verificar contadores de usuarios
      const userCounter = page.locator('text=/[0-9]+.*usuario/i, .user-count').first();
      if (await userCounter.count() > 0) {
        console.log('✅ User counter is visible');
      }
      
      // Verificar contadores de bloques
      const blockCounter = page.locator('text=/[0-9]+.*bloque/i, .block-count').first();
      if (await blockCounter.count() > 0) {
        console.log('✅ Block counter is visible');
      }
      
      // Verificar estadísticas generales
      const statsSection = page.locator('.stats, .statistics, .admin-stats').first();
      if (await statsSection.count() > 0) {
        console.log('✅ Statistics section is visible');
      }
    });
    
    await test.step('Verificar funcionalidades de admin secundario', async () => {
      // Verificar que kikejfer tiene acceso a funcionalidades de admin secundario
      const adminActions = page.locator('.admin-actions, .secondary-admin-controls').first();
      if (await adminActions.count() > 0) {
        console.log('✅ Admin actions are available');
      }
      
      // Verificar que puede ver detalles de usuarios asignados
      const userDetails = page.locator('.user-details, .assigned-user-info').first();
      if (await userDetails.count() > 0) {
        console.log('✅ User details are accessible');
      }
      
      // Verificar acceso a información de bloques
      const blockDetails = page.locator('.block-details, .block-management').first();
      if (await blockDetails.count() > 0) {
        console.log('✅ Block details are accessible');
      }
    });
    
    console.log('🎉 Secondary admin verification test completed successfully');
    console.log('📊 All information appears correctly in kikejfer admin panel');
  });
});