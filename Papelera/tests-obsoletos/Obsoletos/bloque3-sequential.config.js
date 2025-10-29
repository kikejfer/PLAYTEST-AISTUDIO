// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Bloque 3 - Sequential execution only
 * Clean configuration to ensure proper test order
 */
module.exports = defineConfig({
  testDir: './tests/03-funcionalidad-core',

  // Force sequential execution
  fullyParallel: false,
  workers: 1,

  // Extended timeouts for complex workflows
  timeout: 120000, // 2 minutes per test
  expect: {
    timeout: 20000,
  },

  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 25000,
  },

  projects: [
    {
      name: 'Bloque 3 Sequential',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});