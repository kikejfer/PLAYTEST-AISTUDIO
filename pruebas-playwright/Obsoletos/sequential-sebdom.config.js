// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Complete sequential configuration for Bloque 3
 * Ensures tests run in correct order: creation first, then loading, then download
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
      name: '1. Block Creation',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'sequential-block-test.spec.js'
    },
    {
      name: '2. Block Loading',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'block-loading.spec.js',
      dependencies: ['1. Block Creation']
    },
    {
      name: '3. Block Download',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'block-download.spec.js',
      dependencies: ['2. Block Loading']
    }
  ],

  reporter: [['html'], ['list']],
});