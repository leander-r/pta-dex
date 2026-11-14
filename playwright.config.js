import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: process.env.CI ? 1 : 0,
    // Playwright's default (half of logical cores) over-saturates this project locally:
    // many concurrent headless Chromium instances all hitting one shared dev server plus
    // per-context IndexedDB writes can leave a page's internal data-loading state stuck
    // in its loading spinner indefinitely (not just slow — it never resolves even with a
    // generous timeout). Verified empirically: the full suite is flaky at the ~8-worker
    // default on a 16-core machine, and passes reliably at workers=3.
    workers: process.env.CI ? 2 : 4,
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
