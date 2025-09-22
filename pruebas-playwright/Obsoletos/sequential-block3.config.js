const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Configuración para ejecutar tests secuencialmente
  workers: 1, // Un solo worker para evitar paralelismo
  fullyParallel: false, // Deshabilitar paralelismo completo

  // Configuración de timeouts
  timeout: 60000, // 1 minuto por test

  // Configuración de reportes
  reporter: [['line']],

  // Solo ejecutar los tests del bloque 3 en orden específico
  testDir: './tests/03-funcionalidad-core',
  testMatch: [
    'sequential-block-test.spec.js', // 1. Crear bloque primero
    'block-loading.spec.js',         // 2. Luego cargar
    'block-download.spec.js'         // 3. Finalmente descargar y eliminar
  ],

  use: {
    // Configuración del navegador
    headless: false, // Mostrar navegador para debug
    baseURL: 'https://playtest-frontend.onrender.com/',

    // Configuración de timeouts para acciones
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Screenshots en caso de fallo
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Configuración adicional si es necesaria
      },
    },
  ],
});