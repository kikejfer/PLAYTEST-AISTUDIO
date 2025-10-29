// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for debugging Profesora panel
 */
module.exports = defineConfig({
  testDir: './',
  testMatch: 'check-available-roles.spec.js',

  fullyParallel: false,
  workers: 1,

  timeout: 120000,
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
    headless: false,
  },

  projects: [
    {
      name: 'Debug Profesora',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});