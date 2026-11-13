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

// Campaign Notes lives in MainNavigation's MORE_NAV_ITEMS — shown inline on desktop,
// but only reachable via the "More" overflow button on mobile viewports.
async function goToNotesTab(page) {
    const navButton = page.locator('.nav-button', { hasText: 'Campaign Notes' });
    if (await navButton.first().isVisible()) {
        await navButton.first().click();
    } else {
        await page.locator('.nav-button', { hasText: 'More' }).click();
        await page.getByRole('menuitem', { name: 'Campaign Notes' }).click();
    }
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Campaign Notes', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToNotesTab(page);
});

// Campaign and Session tabs share a single <textarea> (aria-label swaps with the
// active sub-tab) — getByLabel('Campaign notes') collides with the "Campaign Notes"
// nav button's aria-label, so scope by class instead.
const notesTextarea = (page) => page.locator('textarea.notes-textarea');

test('campaign notes auto-save as you type', async ({ page }) => {
    const text = 'The party arrives in Celadon City.';
    await notesTextarea(page).fill(text);

    await expect(page.getByText(/Saved at/)).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(String(text.length), { exact: true })).toBeVisible(); // character count
});

test('session notes Clear button asks for confirmation before erasing', async ({ page }) => {
    await page.getByRole('tab', { name: /Session/ }).click();
    await notesTextarea(page).fill('Fought a wild Rattata.');

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('[role="dialog"]')).toContainText('Clear Session Notes?');

    await page.locator('[role="dialog"]').getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(notesTextarea(page)).toHaveValue('');
});

test('session notes Clear does not touch campaign notes', async ({ page }) => {
    await notesTextarea(page).fill('Campaign note stays.');

    await page.getByRole('tab', { name: /Session/ }).click();
    await notesTextarea(page).fill('Session note goes away.');
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Clear', exact: true }).click();

    await page.getByRole('tab', { name: /Campaign/ }).click();
    await expect(notesTextarea(page)).toHaveValue('Campaign note stays.');
});

test.describe('Quest log', () => {
    test.beforeEach(async ({ page }) => {
        await page.getByRole('tab', { name: /Quests/ }).click();
    });

    test('empty quest log shows the empty state', async ({ page }) => {
        await expect(page.getByText('No quests yet. Add your first quest above.')).toBeVisible();
    });

    test('adding a quest shows it under Active with a status chip', async ({ page }) => {
        await page.getByLabel('New quest title').fill('Find the missing Meowth');
        await page.getByRole('button', { name: '+ Add Quest' }).click();

        await expect(page.getByText('Active (1)')).toBeVisible();
        await expect(page.getByLabel(/Find the missing Meowth — click to expand/)).toBeVisible();
    });

    test('cycling quest status moves it between status groups', async ({ page }) => {
        await page.getByLabel('New quest title').fill('Deliver the parcel');
        await page.getByRole('button', { name: '+ Add Quest' }).click();

        await page.getByLabel('Cycle status for quest: Deliver the parcel').click();
        await expect(page.getByText('Completed (1)')).toBeVisible();

        await page.getByLabel('Cycle status for quest: Deliver the parcel').click();
        await expect(page.getByText('Abandoned (1)')).toBeVisible();
    });

    test('expanding a quest reveals a notes field that persists text', async ({ page }) => {
        await page.getByLabel('New quest title').fill('Explore the cave');
        await page.getByRole('button', { name: '+ Add Quest' }).click();

        await page.getByLabel(/Explore the cave — click to expand/).click();
        const notes = page.getByLabel('Notes for quest: Explore the cave');
        await notes.fill('Found a Zubat colony.');

        // Collapse and re-expand — notes should still be there.
        await page.getByLabel(/Explore the cave — click to collapse/).click();
        await page.getByLabel(/Explore the cave — click to expand/).click();
        await expect(page.getByLabel('Notes for quest: Explore the cave')).toHaveValue('Found a Zubat colony.');
    });

    test('deleting a quest asks for confirmation before removing it', async ({ page }) => {
        await page.getByLabel('New quest title').fill('Catch a Pikachu');
        await page.getByRole('button', { name: '+ Add Quest' }).click();

        await page.getByLabel('Delete quest: Catch a Pikachu').click();
        await expect(page.locator('[role="dialog"]')).toContainText('Delete Quest?');

        await page.locator('[role="dialog"]').getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(page.getByText('No quests yet. Add your first quest above.')).toBeVisible();
    });
});
