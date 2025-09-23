// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Bloque 4 - Administration tests
 * Optimized timeouts for online frontend connectivity
 */
module.exports = defineConfig({
  testDir: './tests/04-administracion',

  // Run tests serially to avoid conflicts
  fullyParallel: false,
  workers: 1,

  // Extended timeout configurations for complete workflow
  timeout: 600000, // 10 minutes per test for complete workflow
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },

  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Extended navigation timeout
    navigationTimeout: 60000,
    // Extended action timeout
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'Bloque 4 Admin',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});