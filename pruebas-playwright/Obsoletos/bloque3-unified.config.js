// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Unified configuration for Bloque 3 - Single test with all steps
 * Guarantees sequential execution of all 5 phases
 */
module.exports = defineConfig({
  testDir: './tests/03-funcionalidad-core',

  // Run tests serially
  fullyParallel: false,
  workers: 1,

  // Extended timeout for complete workflow with robust React loading
  timeout: 360000, // 6 minutes per test (45s x 4 logins + workflow time)
  expect: {
    timeout: 20000,
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
      name: 'Bloque 3 Unified Workflow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'bloque3-unified.spec.js'
    },
  ],

  reporter: [['html'], ['list']],
});