import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
];

const MOCK_GAME_DATA = {
    moves: {}, abilities: {}, features: {}, natures: {},
    items: {
        Potion: { type: 'healing', effect: 'Heals 2d4+2 HP', price: 200 },
        'Poké Ball': { type: 'ball', effect: 'Catches a wild Pokémon.', price: 200 },
    },
};

/** Seeded trainer with one party Pokémon, used by the heal-panel tests. */
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
            abilities: ['Overgrow'], heldItem: '',
            stats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
            currentDamage: 10,
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

async function goToInventoryTab(page) {
    await page.locator('.nav-button', { hasText: 'Inventory' }).click();
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Inventory', { timeout: 10_000 });
}

/** Opens the Add Item panel and adds the named item once. */
async function addItem(page, name) {
    await page.getByRole('button', { name: '+ Add Item', exact: true }).click();
    const panel = page.locator('.add-item-panel');
    await panel.getByPlaceholder('Search items by name or effect...').fill(name);
    await panel.locator('.item-list-card', { hasText: name }).getByRole('button', { name: 'Add', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToInventoryTab(page);
});

// ── Smoke / empty state ─────────────────────────────────────────────────────

test('empty inventory shows the empty state and Add Items CTA', async ({ page }) => {
    await expect(page.getByText('Inventory is empty')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add Items' })).toBeVisible();
});

// ── Add item ─────────────────────────────────────────────────────────────────

test('adding an item from the database shows it in the inventory list', async ({ page }) => {
    await addItem(page, 'Poké Ball');

    const card = page.locator('.inventory-item-card', { hasText: 'Poké Ball' });
    await expect(card).toBeVisible();
    await expect(card.locator('.qty-input')).toHaveValue('1');
});

test('adding a custom item not in the database adds it as misc', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Item', exact: true }).click();
    const panel = page.locator('.add-item-panel');
    await panel.getByPlaceholder('Search items by name or effect...').fill('Mystery Shard');
    await panel.getByRole('button', { name: /Custom/ }).click();

    const card = page.locator('.inventory-item-card', { hasText: 'Mystery Shard' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('misc');
});

// ── Quantity controls ────────────────────────────────────────────────────────

test('increase/decrease quantity buttons adjust stock without a confirm dialog', async ({ page }) => {
    await addItem(page, 'Poké Ball');
    const card = page.locator('.inventory-item-card', { hasText: 'Poké Ball' });

    await card.getByLabel('Increase quantity').click();
    await expect(card.locator('.qty-input')).toHaveValue('2');

    await card.getByLabel('Decrease quantity').click();
    await expect(card.locator('.qty-input')).toHaveValue('1');
});

test('decreasing quantity past the last one asks for confirmation before removing', async ({ page }) => {
    await addItem(page, 'Poké Ball');
    const card = page.locator('.inventory-item-card', { hasText: 'Poké Ball' });

    await card.getByLabel('Remove item').click();
    await expect(page.locator('[role="dialog"]')).toContainText('Remove Item');
    await expect(page.locator('[role="dialog"]')).toContainText('last one');

    await page.locator('[role="dialog"]').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Inventory is empty')).toBeVisible();
});

test('regression: clearing the quantity field and blurring does not collapse stock to 1', async ({ page }) => {
    await addItem(page, 'Poké Ball');
    const card = page.locator('.inventory-item-card', { hasText: 'Poké Ball' });
    const qtyInput = card.locator('.qty-input');

    // Bring stock to 5, then clear the field and blur without typing a new value.
    for (let i = 0; i < 4; i++) await card.getByLabel('Increase quantity').click();
    await expect(qtyInput).toHaveValue('5');

    await qtyInput.fill('');
    await qtyInput.blur();

    // Stock must still be 5, not silently reset to 1.
    await expect(qtyInput).toHaveValue('5');
});

test('deleting an item removes all of its stock after confirmation', async ({ page }) => {
    await addItem(page, 'Poké Ball');
    const card = page.locator('.inventory-item-card', { hasText: 'Poké Ball' });
    await card.getByLabel('Increase quantity').click(); // qty 2, so Delete is the only way to zero it in one step

    await card.getByLabel('Delete all Poké Ball').click();
    await expect(page.locator('[role="dialog"]')).toContainText('Delete Item');

    await page.locator('[role="dialog"]').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Inventory is empty')).toBeVisible();
});

// ── Search & filter ──────────────────────────────────────────────────────────

test('search filters the inventory list', async ({ page }) => {
    await addItem(page, 'Poké Ball');
    await page.getByRole('button', { name: /Close/ }).click(); // close add-item panel

    await page.getByRole('button', { name: /Filter/ }).click();
    await page.getByPlaceholder('Search inventory...').fill('Potion');

    await expect(page.getByText('No items found')).toBeVisible();
    await expect(page.locator('.inventory-item-card', { hasText: 'Poké Ball' })).not.toBeVisible();
});

// ── Use item / heal flow (requires a seeded party Pokémon) ──────────────────

test.describe('Use item — heal flow', () => {
    test.beforeEach(async ({ page }) => {
        await setupPage(page, { seeded: true });
        await goToInventoryTab(page);
    });

    test('using a healing item opens the heal panel and applying it heals the target', async ({ page }) => {
        await addItem(page, 'Potion');
        const card = page.locator('.inventory-item-card', { hasText: 'Potion' });

        await card.getByRole('button', { name: 'Use', exact: true }).click();
        await expect(card).toContainText('Use Potion on:');

        await card.locator('select').selectOption('p1');
        await card.getByRole('button', { name: 'Roll & Apply' }).click();

        // Toast confirms the heal actually applied to Bulby, not just that the item was consumed.
        await expect(page.locator('[role="alert"]')).toContainText('Bulby healed');

        // Potion was the last one in stock -> fully consumed and removed from inventory.
        await expect(page.getByText('Inventory is empty')).toBeVisible();
    });

    test('canceling the heal panel leaves the item untouched', async ({ page }) => {
        await addItem(page, 'Potion');
        const card = page.locator('.inventory-item-card', { hasText: 'Potion' });

        await card.getByRole('button', { name: 'Use', exact: true }).click();
        await card.getByRole('button', { name: 'Cancel' }).click();

        await expect(card).not.toContainText('Use Potion on:');
        await expect(card.locator('.qty-input')).toHaveValue('1');
    });
});
