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
        level: 5,
        experience: 0,
        classes: [],
        stats: { hp:10, atk:8, def:8, satk:8, sdef:8, spd:8 },
        statPoints: 0,
        levelStatPoints: 0,
        featPoints: 0,
        skills: {},
        features: [],
        notes: '',
        badges: [],
        money: 0,
        party: [{
            id: 'p1', name: 'Bulby', species: 'Bulbasaur', level: 5,
            abilities: ['Overgrow'], heldItem: '', types: ['Grass', 'Poison'],
            stats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
            currentDamage: 0,
            moves: [{ name: 'Tackle', type: 'Normal', category: 'Physical', damage: '1d6', frequency: 'At-Will' }],
        }],
        reserve: [],
    }],
});

async function setupPage(page, { seeded = false } = {}) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    if (seeded) {
        await page.addInitScript((saveData) => {
            localStorage.setItem('pta-enhanced-save-data', saveData);
        }, SEEDED_SAVE);
    }
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

async function goToDiceRollerTab(page) {
    await page.locator('.nav-button', { hasText: 'Dice Roller' }).click();
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Dice Roller', { timeout: 10_000 });
}

// ── Smoke / empty state ─────────────────────────────────────────────────────

test('empty party shows the no-Pokémon message instead of the roll panel', async ({ page }) => {
    await setupPage(page);
    await goToDiceRollerTab(page);

    await expect(page.getByText('No Pokémon in your party.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select a Pokémon & move' })).toBeDisabled();
});

// ── Seeded party flows ───────────────────────────────────────────────────────

test.describe('with a party Pokémon', () => {
    test.beforeEach(async ({ page }) => {
        await setupPage(page, { seeded: true });
        await goToDiceRollerTab(page);
        await page.locator('text=Bulby').first().click();
    });

    test('selecting a Pokémon then a move enables the Roll button', async ({ page }) => {
        const rollButton = page.getByRole('button', { name: /Select a Pokémon & move/ });
        await expect(rollButton).toBeDisabled();

        await page.getByRole('button', { name: /^Tackle/ }).click();

        await expect(page.getByRole('button', { name: 'Roll Tackle!' })).toBeEnabled();
    });

    test('rolling a guaranteed-hit move adds a HIT entry to roll history', async ({ page }) => {
        await page.getByRole('button', { name: /^Tackle/ }).click();

        // Force a guaranteed hit so the test isn't flaky on the d20 accuracy roll.
        await page.locator('[title*="Override the move\'s Accuracy Class"] input').fill('1');

        await page.getByRole('button', { name: 'Roll Tackle!' }).click();

        const entry = page.locator('.roll-history-item').first();
        await expect(entry).toContainText('Bulby - Tackle');
        await expect(entry).not.toContainText('MISS!');
    });

    test('HP tracker damage and heal buttons adjust current HP', async ({ page }) => {
        const hpValue = page.locator('.hp-tracker-box').getByText('35', { exact: true });
        await expect(hpValue).toBeVisible();

        await page.getByLabel('Deal 10 damage to HP').click();
        await expect(page.locator('.hp-tracker-box').getByText('25', { exact: true })).toBeVisible();

        await page.getByLabel('Heal 5 HP for HP').click();
        await expect(page.locator('.hp-tracker-box').getByText('30', { exact: true })).toBeVisible();
    });

    test('custom HP amount damage and heal apply the typed value', async ({ page }) => {
        await page.getByLabel('Custom HP amount for HP').fill('7');
        await page.getByLabel('Deal custom damage to HP').click();
        await expect(page.locator('.hp-tracker-box').getByText('28', { exact: true })).toBeVisible();

        await page.getByLabel('Custom HP amount for HP').fill('3');
        await page.getByLabel('Heal custom HP for HP').click();
        await expect(page.locator('.hp-tracker-box').getByText('31', { exact: true })).toBeVisible();
    });

    test('toggling a status condition shows it as an active chip', async ({ page }) => {
        const header = page.getByRole('button', { name: 'Hide status conditions' });
        await page.getByRole('button', { name: '🔥 Burned', exact: true }).click();

        await expect(header.getByText('🔥 Burned')).toBeVisible();

        // Toggling again clears it.
        await page.getByRole('button', { name: '🔥 Burned', exact: true }).click();
        await expect(header.getByText('🔥 Burned')).not.toBeVisible();
    });

    test('combat stages: increasing ATK updates the stage counter and Reset All Stages clears it', async ({ page }) => {
        await page.getByLabel('Show combat stages').click();

        await page.getByLabel('Increase ATK stage').click();
        await page.getByLabel('Increase ATK stage').click();
        await expect(page.getByText('+2', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: 'Reset All Stages' }).click();
        await expect(page.getByText('+2', { exact: true })).not.toBeVisible();
    });

    test('Battle/Contest toggle switches the active sub-panel', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Select a Pokémon & move/ })).toBeVisible();

        await page.getByRole('button', { name: /Contest/ }).click();
        await expect(page.getByRole('button', { name: /Select a Pokémon & move/ })).not.toBeVisible();

        await page.getByRole('button', { name: /Battle/ }).click();
        await expect(page.getByRole('button', { name: /Select a Pokémon & move/ })).toBeVisible();
    });
});
