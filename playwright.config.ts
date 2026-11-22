import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the exported web app (dist/). By default they run against tests/e2e/serve.js, which
 * serves dist/ like nginx does; set E2E_BASE_URL to run them against a deployed site instead.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4173';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
    webServer: process.env.E2E_BASE_URL ? undefined : {
        command: 'node tests/e2e/serve.js 4173',
        url: baseURL,
        reuseExistingServer: true,
    },
});
