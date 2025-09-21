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

        // Verificar que llegó al panel esperado
        await page.waitForURL(new RegExp(user.expectedPanel), { timeout: 15000 });

        console.log(` Login successful for ${user.username}`);
      });

      await test.step('Verificar Panel', async () => {
        console.log(` Redirected to correct panel: ${user.expectedPanel}`);

        // Verificaciones específicas según el tipo de panel
        if (user.actions.includes('admin_panel')) {
          await verifyAdminPanel(page, user);
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

// Función para verificar panel de administrador
async function verifyAdminPanel(page, user) {
  // Esperar a que cargue el panel
  await page.waitForLoadState('networkidle');
  
  // Verificar elementos del panel de administrador
  const adminHeader = page.locator('.user-header, .admin-header, .header').first();
  await expect(adminHeader).toBeVisible();
  
  // Verificar que hay sección de usuarios
  const usersSection = page.locator('.users-section, .admin-users, .container').first();
  await expect(usersSection).toBeVisible();
  
  console.log(` Admin panel verified for ${user.username}`);
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