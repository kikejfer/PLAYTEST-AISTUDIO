// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Bloque 0 - Block creation prerequisite
 */
module.exports = defineConfig({
  testDir: './Obsoletos',

  fullyParallel: false,
  workers: 1,

  timeout: 300000, // 5 minutes for block creation
  expect: {
    timeout: 15000,
  },

  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'Bloque 0 Creation',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'sequential-block-test.spec.js'
    },
  ],

  reporter: [['html'], ['list']],
});