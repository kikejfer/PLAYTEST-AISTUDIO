// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Bloque 2 Refactored - Authentication tests using helper functions
 */
module.exports = defineConfig({
  testDir: './tests/02-autenticacion-refactored',

  fullyParallel: false,
  workers: 1,

  timeout: 90000,
  expect: {
    timeout: 15000,
  },

  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 20000,
  },

  projects: [
    {
      name: 'Bloque 2 Refactored',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});