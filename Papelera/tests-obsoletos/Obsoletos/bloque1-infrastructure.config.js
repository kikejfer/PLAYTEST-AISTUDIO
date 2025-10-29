// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Bloque 1 - Infrastructure tests
 */
module.exports = defineConfig({
  testDir: './tests/01-infraestructura',

  fullyParallel: false,
  workers: 1,

  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'Bloque 1 Infrastructure',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});