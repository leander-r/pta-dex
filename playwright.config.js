import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: process.env.CI ? 1 : 0,
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Service-worker-issued fetches aren't reliably caught by page.route(), and a
        // registration from one test/run can persist and serve stale cached responses
        // to later ones (silently bypassing every page.route() data mock in this suite).
        // These are functional tests, not PWA/offline tests, so block SWs entirely.
        serviceWorkers: 'block',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        // Mobile layout has its own navigation (bottom bar + "More" overflow menu) that
        // desktop-only testing can't exercise — run the same specs against a real mobile
        // viewport/UA to catch breakage specific to that layout.
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
