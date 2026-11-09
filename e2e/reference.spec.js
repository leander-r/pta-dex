import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
];
const MOCK_GAME_DATA = {
    abilities: {}, items: {}, features: {}, natures: {},
    moves: { Tackle: { type: 'Normal', category: 'Physical', damage: '1d6', frequency: 'At-Will', description: '' } },
};

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

async function goToReferenceTab(page) {
    await page.locator('.nav-button', { hasText: 'Quick Reference' }).click();
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Quick Reference', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToReferenceTab(page);
});

test('Pokédex is the default section and lists the seeded species', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Pokédex' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Bulbasaur — click to expand')).toBeVisible();
});

test('searching the Pokédex filters to matching species', async ({ page }) => {
    await page.getByPlaceholder('Search species or #…').fill('zzz-no-match');
    await expect(page.getByLabel('Bulbasaur — click to expand')).not.toBeVisible();

    await page.getByPlaceholder('Search species or #…').fill('Bulba');
    await expect(page.getByLabel('Bulbasaur — click to expand')).toBeVisible();
});

test('clicking a species row expands it in place', async ({ page }) => {
    await page.getByLabel('Bulbasaur — click to expand').click();
    await expect(page.getByLabel('Bulbasaur — click to collapse')).toBeVisible();

    await page.getByLabel('Bulbasaur — click to collapse').click();
    await expect(page.getByLabel('Bulbasaur — click to expand')).toBeVisible();
});

test('switching to Type Chart shows the effectiveness chart', async ({ page }) => {
    await page.getByRole('tab', { name: 'Type Chart' }).click();
    await expect(page.getByRole('heading', { name: 'Type Effectiveness Chart' })).toBeVisible();
});

test('switching to Moves Database lists the seeded move', async ({ page }) => {
    await page.getByRole('tab', { name: 'Moves Database' }).click();
    await expect(page.getByText(/Moves Database \(\d+ moves\)/)).toBeVisible();
    await expect(page.getByText('Tackle', { exact: true })).toBeVisible();
});
