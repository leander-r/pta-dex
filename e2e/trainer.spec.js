import { test, expect } from '@playwright/test';

// Minimal mock data — mirrors smoke.spec.js
const MOCK_POKEDEX = [
    { id: 1,  species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
    { id: 25, species: 'Pikachu', types: ['Electric'],
      baseStats: { hp:4, atk:6, def:4, satk:5, sdef:5, spd:10 },
      abilities: { basic:['Static'], adv:[], high:[] },
      skills: { overland:5, swim:2, jump:3, power:2 } },
];
const MOCK_GAME_DATA = { moves:{}, abilities:{}, items:{}, features:{}, natures:{} };

/** Seed localStorage with a trainer at level 1 so level-up is available. */
const SEEDED_SAVE = JSON.stringify({
    version: '2.1',
    activeTrainerId: 1,
    inventory: [],
    customSpecies: [],
    trainers: [{
        id: 1,
        name: 'Ash',
        gender: 'male',
        age: '',
        avatar: '',
        level: 1,
        experience: 0,
        classes: ['Ace Trainer'],
        stats: { hp:10, atk:8, def:8, satk:8, sdef:8, spd:8 },
        statPoints: 0,
        levelStatPoints: 0,
        featPoints: 0,
        skills: {},
        features: [],
        notes: '',
        badges: [],
        money: 0,
        party: [],
        reserve: [],
    }],
});

/** Set up routes and navigate; waits for the loading spinner to go away. */
async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

// ── Tests that work with the default (fresh, level-0) state ──────────────────

test.describe('Trainer tab — fresh state', () => {
    test.beforeEach(async ({ page }) => {
        await setupPage(page);
        // Trainer tab is the default; no navigation needed
    });

    test('edit trainer name persists after blur', async ({ page }) => {
        const nameInput = page.getByPlaceholder('Trainer Name...');
        await nameInput.fill('Red');
        await nameInput.blur();

        // Value should still be "Red" — auto-save keeps it
        await expect(nameInput).toHaveValue('Red');
    });

    test('level-down button is disabled at minimum level', async ({ page }) => {
        // Default trainer starts at level 0 which satisfies disabled condition (level <= 1)
        const decreaseBtn = page.getByRole('button', { name: 'Decrease level' });
        await expect(decreaseBtn).toBeDisabled();
    });

    test('add a badge via the confirm dialog', async ({ page }) => {
        await page.getByRole('button', { name: '+ Add', exact: true }).click();

        // Confirm modal should appear with "Add Badge" heading
        await expect(page.locator('#confirm-modal-title')).toContainText('Add Badge');

        // Type the badge name and confirm
        await page.fill('[placeholder="Badge name..."]', 'Boulder Badge');
        // Scope to the dialog to avoid matching other "Add …" buttons on the page
        await page.locator('[role="dialog"]').getByRole('button', { name: 'Add', exact: true }).click();

        // Badge chip should appear
        await expect(page.locator('text=Boulder Badge').first()).toBeVisible();
    });

    test('theme persists after page reload', async ({ page }) => {
        const html = page.locator('html');
        const before = await html.getAttribute('data-theme');

        // Toggle theme via the standalone header button
        await page.getByRole('button', { name: /switch to (dark|light) mode/i }).click();

        const toggled = await html.getAttribute('data-theme');
        expect(toggled).not.toBe(before);

        // Reload and re-mock the fetches
        await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
        await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
        await page.reload();
        await page.waitForSelector('[aria-label="Loading application data"]',
            { state: 'detached', timeout: 15_000 });

        await expect(page.locator('html')).toHaveAttribute('data-theme', toggled);
    });
});

// ── Test that requires a pre-existing level-1 trainer ────────────────────────

test.describe('Trainer tab — seeded level-1 trainer', () => {
    test.beforeEach(async ({ page }) => {
        // Seed localStorage BEFORE the page loads
        await page.addInitScript((saveData) => {
            localStorage.setItem('pta-enhanced-save-data', saveData);
        }, SEEDED_SAVE);

        await setupPage(page);
    });

    test('level-up button increments the level display', async ({ page }) => {
        const levelDisplay = page.locator('.level-value');
        await expect(levelDisplay).toContainText('1');

        await page.getByRole('button', { name: 'Increase level' }).click();

        await expect(levelDisplay).toContainText('2');
    });
});

// ── Classes/Skills economy regressions ────────────────────────────────────────
// PH2 p.18: skills are granted only by Trainer Classes (a Base Class grants a
// pick of 3-of-8, an Advanced Class grants 1-of-2) — there is no standalone way
// to train a skill. Classes themselves are gated purely by Trainer Level, not a
// feat-point cost; the app layers its own +2/-1 feat-point bookkeeping on top,
// which must at least be internally self-consistent on add/remove.

const MOCK_GAME_DATA_CLASSES = {
    moves: {}, abilities: {}, items: {}, natures: {},
    features: {
        'Ace Trainer Base': { category: 'Ace Trainer', isBase: true, effect: 'Base feature.' },
        'Breeder Base': { category: 'Breeder', isBase: true, effect: 'Base feature.' },
    },
    trainerClasses: {
        'Ace Trainer': { type: 'base', skillPool: ['Browbeat', 'Sprint', 'Perception'] },
        'Breeder': { type: 'base', skillPool: ['Healing', 'Investigate', 'Acrobatics'] },
    },
    skills: {
        Browbeat: { stat: 'ATK', description: 'Intimidate a foe.' },
        Sprint: { stat: 'SPD', description: 'Move fast.' },
        Perception: { stat: 'SATK', description: 'Notice things.' },
        Healing: { stat: 'HP', description: 'Heal wounds.' },
        Investigate: { stat: 'SATK', description: 'Find clues.' },
        Acrobatics: { stat: 'DEF', description: 'Dodge well.' },
    },
};

/** Level 5 so a 2nd class is allowed (PH2 class-count gate: Lv5 -> 2 classes). */
const SEEDED_SAVE_LV5_NO_CLASS = JSON.stringify({
    version: '2.1', activeTrainerId: 1, inventory: [], customSpecies: [],
    trainers: [{
        id: 1, name: 'Ash', gender: 'male', age: '', avatar: '', level: 5, experience: 0, classes: [],
        stats: { hp:10, atk:8, def:8, satk:8, sdef:8, spd:8 }, statPoints: 0, levelStatPoints: 0, featPoints: 0,
        skills: {}, features: [], notes: '', badges: [], money: 0, party: [], reserve: [],
    }],
});

test.describe('Classes/Skills economy regressions', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
        await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA_CLASSES }));
        await page.addInitScript((saveData) => {
            localStorage.setItem('pta-enhanced-save-data', saveData);
        }, SEEDED_SAVE_LV5_NO_CLASS);
        await page.goto('/');
        await page.waitForSelector('[aria-label="Loading application data"]',
            { state: 'detached', timeout: 15_000 });
    });

    async function addClass(page, className, skillsToPick) {
        await page.selectOption('#classSelectCombined', className);
        await page.getByRole('button', { name: 'Add Class', exact: true }).click();
        for (const skill of skillsToPick) {
            await page.getByRole('button', { name: skill, exact: true }).click();
        }
        await page.getByRole('button', { name: /Confirm/ }).click();
    }

    test('regression: clicking an untrained skill does not grant it for free', async ({ page }) => {
        await addClass(page, 'Ace Trainer', ['Browbeat', 'Sprint', 'Perception']);

        // Expand Skills, then click "Healing" — granted by Breeder, not this trainer's class.
        await page.locator('h3', { hasText: 'Skills' }).click();
        const healingTile = page.getByLabel(/^Healing/);
        await expect(healingTile).toHaveAttribute('aria-label', /not trained/);

        await healingTile.click();

        await expect(healingTile).toHaveAttribute('aria-label', /not trained/); // unchanged
        // Info toasts use role="status" (polite), not role="alert" (assertive) — reserved for errors/warnings.
        await expect(page.locator('.toast-notification[role="status"]')).toContainText('granted by Trainer Classes');
    });

    test('regression: removing the first class reclaims the feat points it granted, even with other classes remaining', async ({ page }) => {
        const featPts = () => page.locator('text=FEAT PTS').locator('xpath=following-sibling::*[1]').textContent();

        await addClass(page, 'Ace Trainer', ['Browbeat', 'Sprint', 'Perception']);
        await expect.poll(featPts).toBe('2'); // first base class grants +2

        await addClass(page, 'Breeder', ['Healing', 'Investigate', 'Acrobatics']);
        await expect.poll(featPts).toBe('1'); // additional class costs 1 -> 2-1

        await page.getByRole('button', { name: 'Remove Ace Trainer' }).click();
        await page.locator('[role="dialog"]').getByRole('button', { name: 'Confirm' }).click();

        // Must reclaim the full +2 the first class granted, not just stay at 1 forever
        // (the bug: the old code only ever refunded the -1 cost of additional classes).
        await expect.poll(featPts).toBe('-1'); // 1 - 2
    });
});
