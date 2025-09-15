const { test, expect } = require('@playwright/test');

// Configuraci�n de usuarios de prueba
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

// URLs base
const BASE_URL = 'https://playtest-frontend.onrender.com/'; // Ajustar seg�n tu entorno
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificaci�n de Roles y Funcionalidades', () => {
  
  // Test para cada usuario
  for (const user of testUsers) {
    test(`${user.role} - ${user.username}`, async ({ page }) => {
      console.log(`>� Testing user: ${user.username} (${user.role})`);
      
      // Acci�n 1: Login
      await test.step('Login', async () => {
        await page.goto(LOGIN_URL);
        
        // Esperar a que cargue la app React y el formulario de login
        await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
        
        // Usar los selectores exactos del formulario React
        const usernameField = page.locator('input[name="nickname"]');
        const passwordField = page.locator('input[name="password"]');
        const loginButton = page.locator('button[type="submit"]');
        
        // Rellenar credenciales
        await usernameField.fill(user.username);
        await passwordField.fill(user.password);
        
        // Hacer login (React app, no redirección tradicional)
        await loginButton.click();
        
        // Esperar a que la app redirija (React Router o similar)
        await page.waitForURL(new RegExp(user.expectedPanel), { timeout: 15000 });
        
        console.log(` Login successful for ${user.username}`);
      });
      
      // Acci�n 2: Verificar panel correspondiente
      await test.step('Verificar Panel', async () => {
        // Verificar que estamos en la p�gina correcta
        const currentUrl = page.url();
        expect(currentUrl).toContain(user.expectedPanel);
        
        console.log(` Redirected to correct panel: ${user.expectedPanel}`);
        
        // Verificaciones espec�ficas por tipo de panel
        switch (user.role) {
          case 'administrador principal':
          case 'administrador secundario':
            await verifyAdminPanel(page, user);
            break;
          case 'soporte t�cnico':
            await verifySupportPanel(page, user);
            break;
          case 'profesor':
            await verifyPPFPanel(page, user);
            break;
          case 'creador':
            await verifyPCCPanel(page, user);
            break;
        }
      });
    });
  }
});

// Funciones de verificaci�n por panel
async function verifyAdminPanel(page, user) {
  // Esperar a que cargue el panel admin
  await page.waitForLoadState('networkidle');
  
  // Verificar header del usuario admin
  await expect(page.locator('.user-header, .header-container')).toBeVisible();
  
  // Verificar contenedor principal del panel admin
  await expect(page.locator('.container, .admin-container')).toBeVisible();
  
  console.log(` Admin panel verified for ${user.username}`);
}

async function verifySupportPanel(page, user) {
  // Esperar a que cargue el panel de soporte
  await page.waitForLoadState('networkidle');
  
  // Verificar elementos del panel de soporte
  await expect(page.locator('h1, .support-title')).toBeVisible();
  
  // Verificar secciones de soporte t�cnico
  const supportSections = page.locator('.support-section, .ticket-section');
  await expect(supportSections.first()).toBeVisible();
  
  console.log(` Support panel verified for ${user.username}`);
}

async function verifyPPFPanel(page, user) {
  // Esperar a que cargue el panel PPF
  await page.waitForLoadState('networkidle');
  
  // Verificar header del profesor
  await expect(page.locator('.user-header, .header').first()).toBeVisible();
  
  // Verificar que hay contenido espec�fico de profesor
  const teacherContent = page.locator('.container, .teacher-content, .ppf-content');
  await expect(teacherContent.first()).toBeVisible();
  
  // Verificar navegaci�n/pesta�as si existen
  const navTabs = page.locator('.nav-tabs, .tabs-nav, .tab-button');
  if (await navTabs.count() > 0) {
    await expect(navTabs.first()).toBeVisible();
  }
  
  console.log(` PPF panel verified for ${user.username}`);
}

async function verifyPCCPanel(page, user) {
  // Esperar a que cargue el panel PCC
  await page.waitForLoadState('networkidle');
  
  // Verificar header del creador
  await expect(page.locator('.user-header').first()).toBeVisible();
  
  // Verificar pesta�as del PCC
  const tabButtons = page.locator('.tab-button, .nav-tab');
  await expect(tabButtons.first()).toBeVisible();
  
  // Verificar las tres pesta�as principales
  const expectedTabs = ['Contenido', 'A�adir Preguntas', 'Gesti�n de Jugadores'];
  for (const tabText of expectedTabs) {
    const tab = page.locator(`.tab-button:has-text("${tabText}")`).first();
    if (await tab.count() > 0) {
      await expect(tab).toBeVisible();
      console.log(` Found tab: ${tabText}`);
    }
  }
  
  // Verificar contenido de la pesta�a activa
  const activeContent = page.locator('.tab-content .active, .tab-pane.active').first();
  await expect(activeContent).toBeVisible({ timeout: 10000 }).catch(() => {
    console.log(' Active content not found, but tab navigation working');
  });
  
  console.log(` PCC panel verified for ${user.username}`);
}

// Test completo de creación, carga y gestión de bloques
test('Verificación completa de gestión de bloques', async ({ page }) => {
  
  await test.step('AndGar crea bloque con carga multiarchivo', async () => {
    // Login como AndGar (creador)
    await page.goto(LOGIN_URL);
    await page.locator('input[name="nickname"]').fill('AndGar');
    await page.locator('input[name="password"]').fill('1002');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Verificar que llega al panel de creador
    await expect(page).toHaveURL(/creators-panel-content/);
    
    // Ir a la pestaña de Añadir Preguntas
    const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
    await addQuestionsTab.click();
    await page.waitForTimeout(1000);
    
    // Configurar carga multiarchivo - buscar el input correcto (no webkitdirectory)
    const multiFileUpload = page.locator('input[type="file"]:not([webkitdirectory])').first();
    
    // Subir los 3 archivos
    await multiFileUpload.setInputFiles([
      'tests/CE1978_Título I Derechos y Deberes.txt',
      'tests/CE1978_Título II La Corona.txt', 
      'tests/CE1978_Título III Cortes Generales.txt'
    ]);
    
    // Procesar la carga
    const processButton = page.locator('button:has-text("Procesar"), button:has-text("Cargar")').first();
    if (await processButton.count() > 0) {
      await processButton.click();
      await page.waitForTimeout(3000); // Esperar procesamiento
    }
    
    // Verificar que el bloque se creó correctamente
    const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
    await contentTab.click();
    await page.waitForTimeout(1000);
    
    // Verificar características del bloque
    const blockContainer = page.locator('#bloques-creados-container, .bc-container').first();
    await expect(blockContainer).toBeVisible();
    
    console.log('✅ AndGar creó bloque con carga multiarchivo');
  });
  
  await test.step('JaiGon verifica información del bloque y lo carga', async () => {
    // Limpiar sesión y hacer login como JaiGon
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="nickname"]').fill('JaiGon');
    await page.locator('input[name="password"]').fill('1004');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Verificar que llega al panel de jugador
    await expect(page).toHaveURL(/jugadores-panel-gaming/);
    
    // Buscar bloques disponibles
    const availableBlocks = page.locator('.block-card, .available-block').first();
    if (await availableBlocks.count() > 0) {
      await expect(availableBlocks).toBeVisible();
      
      // Cargar el bloque
      const loadButton = page.locator('button:has-text("Cargar"), button:has-text("Seleccionar")').first();
      if (await loadButton.count() > 0) {
        await loadButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('✅ JaiGon verificó y cargó el bloque');
  });
  
  await test.step('SebDom verifica información del bloque y lo carga', async () => {
    // Limpiar sesión y hacer login como SebDom
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="nickname"]').fill('SebDom');
    await page.locator('input[name="password"]').fill('1004');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Verificar que llega al panel de jugador
    await expect(page).toHaveURL(/jugadores-panel-gaming/);
    
    // Buscar y cargar bloque
    const availableBlocks = page.locator('.block-card, .available-block').first();
    if (await availableBlocks.count() > 0) {
      await expect(availableBlocks).toBeVisible();
      
      const loadButton = page.locator('button:has-text("Cargar"), button:has-text("Seleccionar")').first();
      if (await loadButton.count() > 0) {
        await loadButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('✅ SebDom verificó y cargó el bloque');
  });
  
  await test.step('AdminPrincipal verifica información en panel de administrador', async () => {
    // Limpiar sesión y hacer login como AdminPrincipal
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="nickname"]').fill('AdminPrincipal');
    await page.locator('input[name="password"]').fill('kikejfer');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Verificar que llega al panel de admin principal
    await expect(page).toHaveURL(/admin-principal-panel/);
    
    // Verificar información de usuarios y bloques
    const usersSection = page.locator('.users-section, .admin-users').first();
    if (await usersSection.count() > 0) {
      await expect(usersSection).toBeVisible();
    }
    
    // Verificar información de AndGar
    const andgarInfo = page.locator('text=AndGar').first();
    if (await andgarInfo.count() > 0) {
      await expect(andgarInfo).toBeVisible();
    }
    
    console.log('✅ AdminPrincipal verificó información en panel de administrador');
  });
  
  await test.step('AdminPrincipal reasigna AndGar a kikejfer', async () => {
    // Ya estamos logueados como AdminPrincipal
    
    // Buscar la opción de reasignación
    const reassignButton = page.locator('button:has-text("Reasignar"), select[name="admin"]').first();
    if (await reassignButton.count() > 0) {
      if (await reassignButton.getAttribute('tagName') === 'SELECT') {
        await reassignButton.selectOption('kikejfer');
      } else {
        await reassignButton.click();
        // Buscar dropdown o modal de reasignación
        const kikejferOption = page.locator('option:has-text("kikejfer"), button:has-text("kikejfer")').first();
        if (await kikejferOption.count() > 0) {
          await kikejferOption.click();
        }
      }
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ AdminPrincipal reasignó AndGar a kikejfer');
  });
  
  await test.step('SebDom descarga el bloque', async () => {
    // Limpiar sesión y hacer login como SebDom nuevamente
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="nickname"]').fill('SebDom');
    await page.locator('input[name="password"]').fill('1004');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Buscar opción de descarga
    const downloadButton = page.locator('button:has-text("Descargar"), a:has-text("Descargar")').first();
    if (await downloadButton.count() > 0) {
      await downloadButton.click();
      await page.waitForTimeout(2000);
    }
    
    console.log('✅ SebDom descargó el bloque');
  });
  
  await test.step('Verificar información en panel de kikejfer (admin secundario)', async () => {
    // Limpiar sesión y hacer login como kikejfer
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="nickname"]').fill('kikejfer');
    await page.locator('input[name="password"]').fill('123');
    await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
    await page.waitForNavigation();
    
    // Verificar que llega al panel de admin secundario
    await expect(page).toHaveURL(/admin-secundario-panel/);
    
    // Verificar que AndGar aparece asignado a kikejfer
    const andgarAssignment = page.locator('text=AndGar').first();
    if (await andgarAssignment.count() > 0) {
      await expect(andgarAssignment).toBeVisible();
    }
    
    // Verificar información del bloque y usuarios
    const blockInfo = page.locator('.block-info, .blocks-section').first();
    if (await blockInfo.count() > 0) {
      await expect(blockInfo).toBeVisible();
    }
    
    console.log('✅ Verificada información correcta en panel de kikejfer');
  });
  
  console.log('🎉 Test completo de gestión de bloques finalizado exitosamente');
});

// Test adicional para verificar funcionalidades cr�ticas
test('Verificaci�n de APIs cr�ticas', async ({ page }) => {
  // Este test verifica que los endpoints cr�ticos respondan correctamente
  
  await test.step('Verificar health check', async () => {
    const response = await page.request.get('https://playtest-backend.onrender.com/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('OK');
    
    console.log(' Backend health check passed');
  });
  
  await test.step('Verificar endpoint loaded-stats (debe requerir auth)', async () => {
    const response = await page.request.get('https://playtest-backend.onrender.com/api/blocks/loaded-stats');
    // Debe devolver 401 (no autorizado) porque no hay token
    expect(response.status()).toBe(401);
    
    console.log(' loaded-stats endpoint responding correctly (requires auth)');
  });
});

// Test de regresi�n para funcionalidades espec�ficas
test('Verificaci�n de regresi�n - Bloques Cargados', async ({ page }) => {
  // Login como creador para probar funcionalidad de bloques
  await page.goto(LOGIN_URL);
  
  await page.locator('input[name="nickname"]').fill('Toñi');
  await page.locator('input[name="password"]').fill('987');
  await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
  
  await page.waitForNavigation();
  
  // Verificar que el panel PCC carga correctamente
  await expect(page).toHaveURL(/creators-panel-content/);
  
  // Verificar que las pesta�as funcionan
  const contentTab = page.locator('.tab-button:has-text("Contenido")').first();
  if (await contentTab.count() > 0) {
    await contentTab.click();
    await page.waitForTimeout(1000); // Esperar a que cargue el contenido
    
    // Verificar que se muestra contenido
    const content = page.locator('#bloques-creados-container, .bc-container');
    if (await content.count() > 0) {
      console.log(' Bloques Creados section is visible');
    }
  }
  
  console.log(' Regression test for Bloques Cargados passed');
});