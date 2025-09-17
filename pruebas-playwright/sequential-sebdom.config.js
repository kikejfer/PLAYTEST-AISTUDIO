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
      name: 'Bloque 3 Complete Sequential Tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'sequential-block-test.spec.js', // Test 0: AndGar creates block (MUST run first)
        'block-loading.spec.js',         // Test 1: JaiGon & SebDom load block
        'block-download.spec.js'         // Test 2: SebDom downloads & AndGar deletes
      ],
    },
  ],

  reporter: [['html'], ['list']],
});