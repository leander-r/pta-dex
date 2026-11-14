import { test, expect } from '@playwright/test';

// Regression coverage for reserve pagination (added for a large-roster performance fix —
// the party+reserve list previously mounted every card at once with no windowing, unlike
// the already-paginated 809-species Pokédex list).

const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
      abilities: { basic: ['Overgrow'], adv: [], high: [] },
      skills: { overland: 4, swim: 2, jump: 2, power: 2 } },
];
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

const basePoke = (id, name) => ({
    id, name, species: 'Bulbasaur', level: 5,
    abilities: ['Overgrow'], heldItem: '', types: ['Grass', 'Poison'],
    stats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
    currentDamage: 0, moves: [],
});

// 62 reserve Pokémon -> 2 pages at PAGE_SIZE=50 (50 + 12).
const SEEDED_SAVE = JSON.stringify({
    version: '2.1', activeTrainerId: 1, inventory: [], customSpecies: [],
    trainers: [{
        id: 1, name: 'Ash', gender: 'male', age: '', avatar: '', level: 5, experience: 0,
        classes: [], stats: { hp: 10, atk: 8, def: 8, satk: 8, sdef: 8, spd: 8 },
        statPoints: 0, levelStatPoints: 0, featPoints: 0, skills: {}, features: [], notes: '',
        badges: [], money: 0,
        party: [],
        reserve: Array.from({ length: 62 }, (_, i) => basePoke(`r${i + 1}`, `Mon${i + 1}`)),
    }],
});

test.beforeEach(async ({ page }) => {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.addInitScript((saveData) => {
        localStorage.setItem('pta-enhanced-save-data', saveData);
    }, SEEDED_SAVE);
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]', { state: 'detached', timeout: 15_000 });
    await page.locator('.nav-button', { hasText: 'Pokémon Team' }).click();
    await page.locator('[role="tab"]', { hasText: 'Reserve' }).click();
});

test('a large reserve is paginated (50/page) with working navigation', async ({ page }) => {
    // Page 1: exactly 50 cards, Mon1 visible, Mon51 not yet.
    await expect(page.locator('.pokemon-roster-tile')).toHaveCount(50);
    await expect(page.getByText('Mon1', { exact: true })).toBeVisible();
    await expect(page.getByText('Mon51', { exact: true })).not.toBeVisible();
    await expect(page.getByText('1–50 / 62')).toBeVisible();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();

    // Page 2: the remaining 12 cards.
    await expect(page.locator('.pokemon-roster-tile')).toHaveCount(12);
    await expect(page.getByText('Mon51', { exact: true })).toBeVisible();
    await expect(page.getByText('Mon62', { exact: true })).toBeVisible();
    await expect(page.getByText('Mon1', { exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();

    await page.getByRole('button', { name: 'First page' }).click();
    await expect(page.getByText('Mon1', { exact: true })).toBeVisible();
});

test('filtering resets to page 1 and paginates the filtered result', async ({ page }) => {
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();

    // Narrow the list via search — should snap back to page 1 of whatever the new result set is.
    await page.getByRole('button', { name: '🔍 Search' }).click();
    await page.getByPlaceholder(/search/i).fill('Mon5');
    await expect(page.getByText('Page 1 of')).not.toBeVisible(); // fewer than 50 matches -> no pager at all
    await expect(page.locator('.pokemon-roster-tile')).toHaveCount(11); // Mon5, Mon50-59 (11 matches)
});
