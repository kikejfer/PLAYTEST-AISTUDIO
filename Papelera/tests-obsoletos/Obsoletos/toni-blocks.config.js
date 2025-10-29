// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration for Toñi blocks characteristics extraction
 */
module.exports = defineConfig({
  testDir: './',
  testMatch: 'test-toni-blocks.spec.js',

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
    headless: true,
  },

  projects: [
    {
      name: 'Toñi Blocks Extraction',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['html'], ['list']],
});