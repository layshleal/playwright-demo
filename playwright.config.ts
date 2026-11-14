import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const DEMO_PORT = 4173;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // set by the nightly CI run to surface flaky tests instead of hiding them behind retries
  failOnFlakyTests: process.env.FAIL_ON_FLAKY === 'true',
  workers: isCI ? 2 : 3, // local cap for laptops; override with --workers=N
  reporter: isCI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        // one blob per CI job, merged into a single HTML report for GitHub Pages
        ['blob', { fileName: `report-${process.env.BLOB_REPORT_NAME ?? 'local'}.zip` }],
      ]
    : [['list'], ['html', { open: 'never' }]],

  // local demo app (demo-app/) for tests that need pages we control
  webServer: {
    command: 'node demo-app/server.mjs',
    url: `http://localhost:${DEMO_PORT}`,
    env: { DEMO_PORT: String(DEMO_PORT) },
    reuseExistingServer: !isCI,
    timeout: 15_000,
  },

  expect: {
    // visual regression: allow a few anti-aliased pixels, never animations.
    // An absolute pixel count, not a ratio: 1% of a 1280x720 page (~9,200 px) would hide
    // a whole button changing colour (~4,500 px).
    toHaveScreenshot: { maxDiffPixels: 100, animations: 'disabled' },
  },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    testIdAttribute: 'data-test',
  },

  projects: [
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com' },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'], baseURL: 'https://www.saucedemo.com' },
    },
    {
      name: 'mobile',
      testDir: './tests/ui',
      use: { ...devices['iPhone 15 Pro'], baseURL: 'https://www.saucedemo.com' },
    },
    {
      name: 'demo',
      testDir: './tests/demo',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEMO_PORT}` },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://restful-booker.herokuapp.com',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
