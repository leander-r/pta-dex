import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
];
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

// GM Tools lives in MainNavigation's MORE_NAV_ITEMS — shown inline on desktop, but
// only reachable via the "More" overflow button on mobile viewports.
async function goToGMTab(page) {
    const navButton = page.locator('.nav-button', { hasText: 'GM Tools' });
    if (await navButton.first().isVisible()) {
        await navButton.first().click();
    } else {
        await page.locator('.nav-button', { hasText: 'More' }).click();
        await page.getByRole('menuitem', { name: 'GM Tools' }).click();
    }
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('GM Tools', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToGMTab(page);
});

test('Capture Rates is the default section', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Capture Rates' })).toHaveAttribute('aria-selected', 'true');
});

test('switching sub-tabs mounts the corresponding section content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Death Saves' }).click();
    await expect(page.getByRole('heading', { name: /Fainting Rules/ })).toBeVisible();

    await page.getByRole('tab', { name: 'Wild Encounters' }).click();
    await expect(page.getByRole('heading', { name: /Encounter Composition/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Fainting Rules/ })).not.toBeVisible();
});

test('a previously visited section stays mounted (hidden) when switching away and back', async ({ page }) => {
    await page.getByRole('tab', { name: 'Death Saves' }).click();
    await expect(page.getByRole('heading', { name: /Fainting Rules/ })).toBeVisible();

    await page.getByRole('tab', { name: 'Capture Rates' }).click();
    await page.getByRole('tab', { name: 'Death Saves' }).click();
    await expect(page.getByRole('heading', { name: /Fainting Rules/ })).toBeVisible();
});
