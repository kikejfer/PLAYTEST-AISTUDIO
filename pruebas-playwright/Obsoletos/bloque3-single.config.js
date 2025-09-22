// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Single test configuration for Bloque 3 - GUARANTEED sequential execution
 * All 5 steps in one test to ensure absolute order
 */
module.exports = defineConfig({
  testDir: './tests/03-funcionalidad-core',

  // Run tests serially
  fullyParallel: false,
  workers: 1,

  // Timeout configurations - increased for complete workflow
  timeout: 120000, // 2 minutes per test
  expect: {
    timeout: 15000,
  },

  // Use chromium for consistent behavior
  use: {
    baseURL: 'https://playtest-frontend.onrender.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Bloque 3 Single Workflow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'bloque3-workflow-single.spec.js'
    },
  ],

  reporter: [['html'], ['list']],
});