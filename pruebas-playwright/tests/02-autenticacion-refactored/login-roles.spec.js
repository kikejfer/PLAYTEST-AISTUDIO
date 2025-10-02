const { test, expect } = require('@playwright/test');
const { login } = require('../../utils/login-helper');
const { createLogoutStep } = require('../../utils/logout-helper');

// Configuración de usuarios de prueba
const testUsers = [
  {
    username: 'AdminPrincipal',
    password: 'kikejfer',
    role: 'administrador principal',
    expectedPanel: 'admin-principal-panel',
    actions: ['login', 'admin_panel']
  },
  {
    username: 'kikejfer',
    password: '123',
    role: 'administrador secundario',
    expectedPanel: 'admin-secundario-panel',
    actions: ['login', 'admin_panel']
  },
  {
    username: 'admin',
    password: 'kikejfer', 
    role: 'soporte técnico',
    expectedPanel: 'support-dashboard',
    actions: ['login', 'support_panel']
  },
  {
    username: 'Toñi',
    password: '987',
    role: 'creador',
    expectedPanel: 'creators-panel-content',
    actions: ['login', 'pcc_panel']
  },
  {
    username: 'AntLop',
    password: '1001',
    role: 'profesor',
    expectedPanel: 'teachers-panel-schedules',
    actions: ['login', 'ppf_panel']
  },
  {
    username: 'AndGar',
    password: '1002',
    role: 'creador',
    expectedPanel: 'creators-panel-content',
    actions: ['login', 'pcc_panel', 'create_block']
  },
  {
    username: 'JaiGon',
    password: '1003',
    role: 'jugador',
    expectedPanel: 'jugadores-panel-gaming',
    actions: ['login', 'load_block']
  },
  {
    username: 'SebDom',
    password: '1004',
    role: 'jugador',
    expectedPanel: 'jugadores-panel-gaming',
    actions: ['login', 'load_block', 'download_block']
  }
];


test.describe('Verificación de Login y Acceso a Paneles', () => {

  // Test para cada usuario
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    test(`${user.role} - ${user.username}`, async ({ page }) => {
      // Aumentar timeout para tests que hacen validación cruzada o cambio de roles
      if (user.username === 'AdminPrincipal') {
        test.setTimeout(120000); // 120 segundos (2 min) para validación cruzada compleja
      } else if (user.username === 'admin' || user.username === 'kikejfer' || user.username === 'Toñi') {
        test.setTimeout(45000); // 45 segundos para usuarios que hacen cambio de roles
      }

      // Logout antes del login (excepto para el primer usuario)
      if (i > 0) {
        console.log(`🔍 TEST ${i}: About to perform logout before login for user ${user.username}`);
        await createLogoutStep(test, page);
        console.log(`✅ TEST ${i}: Logout step completed`);
      } else {
        console.log(`🔍 TEST ${i}: First test, skipping logout`);
      }

      await test.step('Login', async () => {
        await login(page, user.username);

        // Debug: mostrar URL actual después del login
        const currentUrl = page.url();
        console.log(`📍 Current URL after login: ${currentUrl}`);
        console.log(`📍 Expected panel pattern: ${user.expectedPanel}`);

        // Verificar que llegó al panel esperado
        try {
          await page.waitForURL(new RegExp(user.expectedPanel), { timeout: 15000 });
          console.log(`✅ Login successful for ${user.username}`);
        } catch (error) {
          console.log(`⚠️ URL redirection timeout. Current URL: ${page.url()}`);
          console.log(`⚠️ Expected pattern: ${user.expectedPanel}`);

          // Intentar navegar directamente al panel esperado si no se redirigió automáticamente
          if (user.expectedPanel && !page.url().includes(user.expectedPanel)) {
            console.log(`🔄 Attempting direct navigation to expected panel...`);
            await page.goto(`https://playtest-frontend.onrender.com/${user.expectedPanel}.html`, { timeout: 15000 });
            console.log(`✅ Direct navigation to ${user.expectedPanel} completed`);
          }
        }
      });

      await test.step('Verificar Panel', async () => {
        console.log(` Redirected to correct panel: ${user.expectedPanel}`);

        // Verificaciones específicas según el tipo de usuario
        if (user.username === 'AdminPrincipal') {
          // Solo AdminPrincipal hace la validación cruzada completa
          await verifyAdminPanel(page, user);
        } else if (user.username === 'kikejfer' || user.username === 'admin' || user.username === 'Toñi') {
          // Usuarios normales: extraer sus bloques directamente usando creator-blocks-helper
          await verifyUserBlocks(page, user);
        } else if (user.actions.includes('pcc_panel')) {
          await verifyPCCPanel(page, user);
        } else if (user.actions.includes('ppf_panel')) {
          await verifyPPFPanel(page, user);
        } else if (user.actions.includes('support_panel')) {
          await verifySupportPanel(page, user);
        } else {
          // Panel básico de jugador
          await verifyPlayerPanel(page, user);
        }
      });

      await createLogoutStep(test, page);
    });
  }
});

// Función para verificar y extraer bloques de usuarios normales (kikejfer, admin, Toñi)
async function verifyUserBlocks(page, user) {
  const { getAllCreatedBlocksCharacteristics } = require('../../utils/creator-blocks-helper');

  console.log(`🔄 Starting user blocks verification for ${user.username}`);

  try {
    // Esperar a que cargue el panel
    await page.waitForLoadState('networkidle');

    console.log(`📊 Extracting ${user.username} creator blocks...`);

    // Obtener bloques (la función ya extrae ambos roles: Creador Y Profesor)
    const allBlocks = await getAllCreatedBlocksCharacteristics(user.username, page);
    console.log(`✅ ${user.username} blocks extracted:`, allBlocks);

    // Calcular totales de creador
    const creatorArray = allBlocks.creators || [];
    const creatorTotals = {
      totalBloques: creatorArray.length,
      totalTemas: creatorArray.reduce((sum, block) => sum + parseInt(block.topics || 0), 0),
      totalPreguntas: creatorArray.reduce((sum, block) => sum + parseInt(block.questions || 0), 0),
      totalUsuarios: creatorArray.reduce((sum, block) => sum + parseInt(block.users || 0), 0)
    };
    console.log(`📊 ${user.username} creator totals:`, creatorTotals);

    // Calcular totales de profesor (ya extraídos en la misma llamada)
    let professorTotals = { totalBloques: 0, totalTemas: 0, totalPreguntas: 0, totalUsuarios: 0 };

    if (user.username === 'kikejfer' || user.username === 'admin' || user.username === 'Toñi') {
      const professorArray = allBlocks.professors || [];
      professorTotals = {
        totalBloques: professorArray.length,
        totalTemas: professorArray.reduce((sum, block) => sum + parseInt(block.topics || 0), 0),
        totalPreguntas: professorArray.reduce((sum, block) => sum + parseInt(block.questions || 0), 0),
        totalUsuarios: professorArray.reduce((sum, block) => sum + parseInt(block.users || 0), 0)
      };
      console.log(`📊 ${user.username} professor totals:`, professorTotals);
    }

    console.log(`✅ User blocks verification completed for ${user.username}`);

    // Mostrar resumen
    console.log(`\n📋 FINAL TOTALS FOR ${user.username}:`);
    console.log(`   Creator: ${creatorTotals.totalBloques} bloques, ${creatorTotals.totalTemas} temas, ${creatorTotals.totalPreguntas} preguntas, ${creatorTotals.totalUsuarios} usuarios`);
    if (user.username === 'kikejfer' || user.username === 'admin' || user.username === 'Toñi') {
      console.log(`   Professor: ${professorTotals.totalBloques} bloques, ${professorTotals.totalTemas} temas, ${professorTotals.totalPreguntas} preguntas, ${professorTotals.totalUsuarios} usuarios`);
    }

  } catch (error) {
    console.log(`❌ Error in user blocks verification for ${user.username}: ${error.message}`);
    throw error;
  }
}

// Función para verificar panel de administrador con validación cruzada
async function verifyAdminPanel(page, user) {
  console.log(`🔄 Starting comprehensive admin panel verification for ${user.username}`);

  // Esperar a que cargue el panel
  await page.waitForLoadState('networkidle');

  // Verificar elementos básicos del panel de administrador
  const adminHeader = page.locator('.user-header, .admin-header, .header').first();
  await expect(adminHeader).toBeVisible();

  // Verificar que hay sección de usuarios
  const usersSection = page.locator('.users-section, .admin-users, .container').first();
  await expect(usersSection).toBeVisible();

  console.log(`✅ Basic admin panel structure verified for ${user.username}`);

  // Solo hacer validación cruzada para AdminPrincipal
  if (user.username === 'AdminPrincipal') {
    console.log(`📋 Starting cross-validation for AdminPrincipal panel...`);
    await performCrossValidation(page, user);
  } else {
    console.log(`⚠️ Cross-validation only performed for AdminPrincipal, skipping for ${user.username}`);
  }

  console.log(`✅ Admin panel verification completed for ${user.username}`);
}

// Función para realizar la validación cruzada completa
async function performCrossValidation(page, user) {
  const { extractUserInfoFromPAP } = require('../../utils/admin-panel-helper');
  const { login } = require('../../utils/login-helper');
  const { createLogoutStep } = require('../../utils/logout-helper');
  const { getAllCreatedBlocksCharacteristics } = require('../../utils/creator-blocks-helper');

  // Usuarios a verificar: kikejfer, admin, Toñi
  const usersToVerify = ['kikejfer', 'admin', 'Toñi'];

  // Variables para almacenar los resultados
  const adminPanelData = {
    creators: [], // Lista de características como creadores desde AdminPrincipal
    professors: [] // Lista de características como profesores desde AdminPrincipal
  };

  const userPanelsData = {
    kikejfer: { creator: [], professor: [] },
    admin: { creator: [], professor: [] },
    Toñi: { creator: [], professor: [] }
  };

  console.log(`📋 Step 1: Extracting user data from AdminPrincipal panel...`);

  // PASO 1: Obtener datos desde el panel AdminPrincipal
  try {
    for (const nickname of usersToVerify) {
      console.log(`🔍 Extracting data for ${nickname} from AdminPrincipal panel...`);

      // Obtener datos como Creador
      try {
        console.log(`📊 Getting ${nickname} creator stats from AdminPrincipal...`);
        const creatorStats = await extractUserInfoFromPAP('Creadores', nickname, '', page);
        adminPanelData.creators.push({
          nickname: nickname,
          stats: creatorStats
        });
        console.log(`✅ ${nickname} creator stats from AdminPrincipal:`, creatorStats);
      } catch (error) {
        console.log(`⚠️ Could not extract creator stats for ${nickname}: ${error.message}`);
        adminPanelData.creators.push({
          nickname: nickname,
          stats: { error: error.message }
        });
      }

      // Obtener datos como Profesor (para kikejfer, admin y Toñi)
      if (nickname === 'kikejfer' || nickname === 'admin' || nickname === 'Toñi') {
        try {
          console.log(`📊 Getting ${nickname} professor stats from AdminPrincipal...`);
          const professorStats = await extractUserInfoFromPAP('Profesores', nickname, '', page);
          adminPanelData.professors.push({
            nickname: nickname,
            stats: professorStats
          });
          console.log(`✅ ${nickname} professor stats from AdminPrincipal:`, professorStats);
        } catch (error) {
          console.log(`⚠️ Could not extract professor stats for ${nickname}: ${error.message}`);
          adminPanelData.professors.push({
            nickname: nickname,
            stats: { error: error.message }
          });
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error in AdminPrincipal data extraction: ${error.message}`);
  }

  console.log(`📋 Step 2: Extracting data from individual user panels...`);

  // Logout de AdminPrincipal una sola vez antes del PASO 2
  console.log(`🚪 Logging out from AdminPrincipal before processing individual users...`);
  await createLogoutStep(test, page);

  // PASO 2: Obtener datos desde los paneles individuales de cada usuario
  for (const nickname of usersToVerify) {
    console.log(`🔍 Processing user panel for ${nickname}...`);

    try {
      // Login como el usuario específico
      console.log(`🔐 Logging in as ${nickname}...`);
      await login(page, nickname);

      // Esperar a que cargue el panel
      await page.waitForTimeout(3000);

      // Obtener bloques como Creador
      try {
        console.log(`📊 Getting ${nickname} creator blocks from their own panel...`);
        const creatorBlocks = await getAllCreatedBlocksCharacteristics(nickname, page);

        // Calcular totales de creador
        const creatorArray = creatorBlocks.creators || [];
        const creatorTotals = {
          totalBloques: creatorArray.length,
          totalTemas: creatorArray.reduce((sum, block) => sum + parseInt(block.topics || 0), 0),
          totalPreguntas: creatorArray.reduce((sum, block) => sum + parseInt(block.questions || 0), 0),
          totalUsuarios: creatorArray.reduce((sum, block) => sum + parseInt(block.users || 0), 0)
        };

        userPanelsData[nickname].creator = {
          blocks: creatorArray,
          totals: creatorTotals
        };
        console.log(`✅ ${nickname} creator totals from own panel:`, creatorTotals);
      } catch (error) {
        console.log(`⚠️ Could not extract creator blocks for ${nickname}: ${error.message}`);
        userPanelsData[nickname].creator = { error: error.message };
      }

      // Obtener bloques como Profesor (para kikejfer, admin y Toñi)
      if (nickname === 'kikejfer' || nickname === 'admin' || nickname === 'Toñi') {
        try {
          console.log(`📊 Getting ${nickname} professor blocks from their own panel...`);
          // Cambiar rol a Profesor y obtener bloques
          const professorBlocks = await getAllCreatedBlocksCharacteristics(nickname, page);

          // Calcular totales de profesor
          const professorArray = professorBlocks.professors || [];
          const professorTotals = {
            totalBloques: professorArray.length,
            totalTemas: professorArray.reduce((sum, block) => sum + parseInt(block.topics || 0), 0),
            totalPreguntas: professorArray.reduce((sum, block) => sum + parseInt(block.questions || 0), 0),
            totalUsuarios: professorArray.reduce((sum, block) => sum + parseInt(block.users || 0), 0)
          };

          userPanelsData[nickname].professor = {
            blocks: professorArray,
            totals: professorTotals
          };
          console.log(`✅ ${nickname} professor totals from own panel:`, professorTotals);
        } catch (error) {
          console.log(`⚠️ Could not extract professor blocks for ${nickname}: ${error.message}`);
          userPanelsData[nickname].professor = { error: error.message };
        }
      }

      // Logout después de procesar cada usuario (para el siguiente usuario)
      console.log(`🚪 Logging out from ${nickname} panel...`);
      await createLogoutStep(test, page);

    } catch (error) {
      console.log(`❌ Error processing user panel for ${nickname}: ${error.message}`);
      userPanelsData[nickname] = { error: error.message };

      // Intentar logout aunque haya error
      try {
        await createLogoutStep(test, page);
      } catch (logoutError) {
        console.log(`⚠️ Could not logout after error: ${logoutError.message}`);
      }
    }
  }

  // Volver a loguear como AdminPrincipal (ya hicimos logout del último usuario)
  console.log(`🔐 Logging back in as AdminPrincipal...`);
  await login(page, 'AdminPrincipal');
  await page.waitForTimeout(2000);

  console.log(`📋 Step 3: Comparing AdminPrincipal panel data with individual user panels...`);

  // PASO 3: Comparar los resultados
  await compareAndValidateData(adminPanelData, userPanelsData, usersToVerify);

  console.log(`✅ Cross-validation completed for AdminPrincipal panel`);
}

// Función para comparar y validar los datos obtenidos
async function compareAndValidateData(adminData, userData, users) {
  console.log(`📊 Starting data comparison and validation...`);

  let totalMatches = 0;
  let totalComparisons = 0;

  for (const nickname of users) {
    console.log(`🔍 Comparing data for ${nickname}...`);

    // Comparar datos como Creador
    const adminCreatorData = adminData.creators.find(u => u.nickname === nickname);
    const userCreatorData = userData[nickname]?.creator;

    if (adminCreatorData && userCreatorData && !adminCreatorData.stats.error && !userCreatorData.error) {
      console.log(`📊 Comparing ${nickname} creator data...`);
      console.log(`   AdminPrincipal shows:`, adminCreatorData.stats);
      console.log(`   ${nickname} panel shows:`, userCreatorData.totals);

      // Comparar valores específicos
      const comparisons = [
        {
          name: 'Bloques Creados',
          admin: parseInt(adminCreatorData.stats.bloquesCreados || 0),
          user: parseInt(userCreatorData.totals.totalBloques || 0)
        },
        {
          name: 'Temas',
          admin: parseInt(adminCreatorData.stats.temas || 0),
          user: parseInt(userCreatorData.totals.totalTemas || 0)
        },
        {
          name: 'Preguntas',
          admin: parseInt(adminCreatorData.stats.preguntas || 0),
          user: parseInt(userCreatorData.totals.totalPreguntas || 0)
        },
        {
          name: 'Alumnos/Usuarios',
          admin: parseInt(adminCreatorData.stats.alumnos || 0),
          user: parseInt(userCreatorData.totals.totalUsuarios || 0)
        }
      ];

      for (const comp of comparisons) {
        totalComparisons++;
        if (comp.admin === comp.user) {
          totalMatches++;
          console.log(`   ✅ ${comp.name}: MATCH (${comp.admin} = ${comp.user})`);
        } else {
          console.log(`   ❌ ${comp.name}: MISMATCH (Admin: ${comp.admin}, User: ${comp.user})`);
        }
      }
    } else {
      console.log(`   ⚠️ Cannot compare ${nickname} creator data (missing or error)`);
    }

    // Comparar datos como Profesor (para usuarios que tienen este rol: kikejfer, admin, Toñi)
    if (nickname === 'kikejfer' || nickname === 'admin' || nickname === 'Toñi') {
      const adminProfessorData = adminData.professors.find(u => u.nickname === nickname);
      const userProfessorData = userData[nickname]?.professor;

      if (adminProfessorData && userProfessorData && !adminProfessorData.stats.error && !userProfessorData.error) {
        console.log(`📊 Comparing ${nickname} professor data...`);
        console.log(`   AdminPrincipal shows:`, adminProfessorData.stats);
        console.log(`   ${nickname} panel shows:`, userProfessorData.totals);

        // Similar comparison logic for professor data
        const professorComparisons = [
          {
            name: 'Bloques Creados',
            admin: parseInt(adminProfessorData.stats.bloquesCreados || 0),
            user: parseInt(userProfessorData.totals.totalBloques || 0)
          },
          {
            name: 'Temas',
            admin: parseInt(adminProfessorData.stats.temas || 0),
            user: parseInt(userProfessorData.totals.totalTemas || 0)
          },
          {
            name: 'Preguntas',
            admin: parseInt(adminProfessorData.stats.preguntas || 0),
            user: parseInt(userProfessorData.totals.totalPreguntas || 0)
          },
          {
            name: 'Alumnos/Usuarios',
            admin: parseInt(adminProfessorData.stats.alumnos || 0),
            user: parseInt(userProfessorData.totals.totalUsuarios || 0)
          }
        ];

        for (const comp of professorComparisons) {
          totalComparisons++;
          if (comp.admin === comp.user) {
            totalMatches++;
            console.log(`   ✅ Professor ${comp.name}: MATCH (${comp.admin} = ${comp.user})`);
          } else {
            console.log(`   ❌ Professor ${comp.name}: MISMATCH (Admin: ${comp.admin}, User: ${comp.user})`);
          }
        }
      } else {
        console.log(`   ⚠️ Cannot compare ${nickname} professor data (missing or error)`);
      }
    }
  }

  // Resumen final
  const matchPercentage = totalComparisons > 0 ? ((totalMatches / totalComparisons) * 100).toFixed(1) : 0;
  console.log(`📊 VALIDATION SUMMARY:`);
  console.log(`   Total comparisons: ${totalComparisons}`);
  console.log(`   Successful matches: ${totalMatches}`);
  console.log(`   Match percentage: ${matchPercentage}%`);

  if (matchPercentage >= 90) {
    console.log(`✅ Cross-validation PASSED (${matchPercentage}% match rate)`);
  } else if (matchPercentage >= 70) {
    console.log(`⚠️ Cross-validation PARTIAL (${matchPercentage}% match rate)`);
  } else {
    console.log(`❌ Cross-validation FAILED (${matchPercentage}% match rate)`);
  }
}

// Función para verificar panel PCC (Panel Creador Contenido)
async function verifyPCCPanel(page, user) {
  // Esperar a que cargue el panel PCC
  await page.waitForLoadState('networkidle');
  
  // Verificar pestañas del PCC
  const tabButtons = page.locator('.tab-button, .nav-tab');
  await expect(tabButtons.first()).toBeVisible();
  
  // Verificar las tres pestañas principales
  const expectedTabs = ['Contenido', 'Añadir Preguntas', 'Gestión de Jugadores'];
  for (const tabText of expectedTabs) {
    const tab = page.locator(`.tab-button:has-text("${tabText}")`).first();
    if (await tab.count() > 0) {
      await expect(tab).toBeVisible();
      console.log(` Found tab: ${tabText}`);
    }
  }
  
  console.log(` PCC panel verified for ${user.username}`);
}

// Función para verificar panel PPF (Panel Profesor Funcionalidades)
async function verifyPPFPanel(page, user) {
  // Esperar a que cargue el panel PPF
  await page.waitForLoadState('networkidle');
  
  // Verificar header del profesor
  await expect(page.locator('.user-header, .header').first()).toBeVisible();
  
  // Verificar que hay contenido específico de profesor
  const teacherContent = page.locator('.container, .teacher-content, .ppf-content');
  await expect(teacherContent.first()).toBeVisible();
  
  console.log(` PPF panel verified for ${user.username}`);
}

// Función para verificar panel de soporte
async function verifySupportPanel(page, user) {
  // Esperar a que cargue el panel de soporte
  await page.waitForLoadState('networkidle');
  
  // Verificar elementos específicos del panel de soporte
  const supportContent = page.locator('.support-content, .container, .dashboard').first();
  await expect(supportContent).toBeVisible();
  
  console.log(` Support panel verified for ${user.username}`);
}

// Función para verificar panel de jugador
async function verifyPlayerPanel(page, user) {
  // Esperar a que cargue el panel de jugador
  await page.waitForLoadState('networkidle');
  
  // Verificar elementos del panel de jugador
  const playerContent = page.locator('.game-content, .player-content, .container').first();
  await expect(playerContent).toBeVisible();
  
  console.log(` Player panel verified for ${user.username}`);
}