// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Sequential configuration for SebDom tests in Bloque 3
 * Ensures tests run in correct order: loading first, then download
 */
module.exports = defineConfig({
  testDir: './tests/03-funcionalidad-core',

  // Run tests serially to maintain order
  fullyParallel: false,
  workers: 1,

  // Timeout configurations
  timeout: 60000,
  expect: {
    timeout: 10000,
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
      name: 'SebDom Sequential Tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'block-loading.spec.js',  // Test 2: Must run first
        'block-download.spec.js'  // Test 1: Must run second
      ],
    },
  ],

  reporter: [['html'], ['list']],
});