import { test, expect } from '@playwright/test';

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

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

/** Navigate to the Pokémon Team tab. */
async function goToPokemonTab(page) {
    await page.locator('.nav-button', { hasText: 'Pokémon Team' }).click();
    // Wait for the tab to become active
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Pokémon Team', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToPokemonTab(page);
});

// ── Tests ────────────────────────────────────────────────────────────────────

test('empty party shows "Add Your First Pokémon" CTA', async ({ page }) => {
    await expect(
        page.getByRole('button', { name: /Add Your First Pokémon/i })
    ).toBeVisible();
});

test('clicking add button shows a new Pokémon card in edit mode', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();

    // addPokemon() calls setEditingPokemon → card opens in expanded/edit mode
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible({ timeout: 5_000 });
});

test('clicking a collapsed card opens the edit view', async ({ page }) => {
    // Add a card and immediately close it
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.pokemon-card-collapsed')).toBeVisible();

    // Click the collapsed card to reopen
    await page.locator('.pokemon-card-collapsed').click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();
    await expect(page.locator('.pokemon-card-tabs')).toBeVisible();
});

test('edit tab navigation: Stats tab shows stat grid, Moves tab shows move summary', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    const card = page.locator('.pokemon-card-expanded');

    // Click the "stats" tab
    await card.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
    // "Stat Allocation" header is unique to the Pokémon card stats tab
    await expect(card.getByText(/Stat Allocation/i)).toBeVisible({ timeout: 5_000 });

    // Click the "moves" tab
    await card.locator('.pokemon-card-tabs .tab', { hasText: 'moves' }).click();
    // "Known Moves" section header is always rendered
    await expect(card.getByText(/Known Moves/)).toBeVisible({ timeout: 5_000 });
});

test('clicking Done collapses the card', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    await page.getByRole('button', { name: 'Done' }).click();

    // Edit tabs should be gone; collapsed card should appear
    await expect(page.locator('.pokemon-card-tabs')).not.toBeVisible();
    await expect(page.locator('.pokemon-card-collapsed')).toBeVisible({ timeout: 5_000 });
});

test.describe('Breeder Bonus (Stats tab)', () => {
    /**
     * Add a fresh Pokémon and navigate to its Stats tab.
     * Seeds the "seen" flag first so these tests exercise the steady-state
     * (collapsed-by-default) behavior rather than the one-time discovery nudge,
     * which has its own dedicated test below.
     */
    async function openStatsTab(page) {
        await page.evaluate(() => localStorage.setItem('pta-seen-breeder-bonus', 'true'));
        await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
        const card = page.locator('.pokemon-card-expanded');
        await expect(card).toBeVisible();
        await card.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
        await expect(card.getByText(/Stat Allocation/i)).toBeVisible();
        return card;
    }

    test('first-ever visit auto-expands the section with a NEW badge; clicking dismisses it for good', async ({ page }) => {
        const card = await (async () => {
            await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
            const c = page.locator('.pokemon-card-expanded');
            await expect(c).toBeVisible();
            await c.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
            await expect(c.getByText(/Stat Allocation/i)).toBeVisible();
            return c;
        })();

        // Never seen before (no seeded flag) — section starts expanded, badge visible.
        await expect(card.getByText('NEW')).toBeVisible();
        await expect(card.getByText(/Permanent base-stat bonus/)).toBeVisible();

        // Collapsing it counts as discovery — badge goes away and stays away.
        await card.getByText('🧬 Breeder Bonus').click();
        await expect(card.getByText('NEW')).toHaveCount(0);
        expect(await page.evaluate(() => localStorage.getItem('pta-seen-breeder-bonus'))).toBe('true');

        // Closing and reopening the card (a fresh PokemonCard mount) must not bring the badge back.
        await page.getByRole('button', { name: 'Done' }).click();
        await expect(page.locator('.pokemon-card-collapsed')).toBeVisible();
        await page.locator('.pokemon-card-collapsed').click();
        const reopenedCard = page.locator('.pokemon-card-expanded');
        await reopenedCard.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
        await expect(reopenedCard.getByText('🧬 Breeder Bonus')).toBeVisible();
        await expect(reopenedCard.getByText('NEW')).toHaveCount(0);
        await expect(reopenedCard.getByText(/Permanent base-stat bonus/)).toHaveCount(0);
    });

    /** The second `.stat-cards-grid` on the tab is the Breeder Bonus grid (first is Stat Allocation). */
    function breederStatCard(card, stat) {
        const grid = card.locator('.stat-cards-grid').nth(1);
        return grid.getByText(stat, { exact: true }).locator('xpath=..');
    }

    function mainStatCard(card, stat) {
        const grid = card.locator('.stat-cards-grid').nth(0);
        return grid.getByText(stat, { exact: true }).locator('xpath=..');
    }

    test('section is collapsed by default showing "(none)"', async ({ page }) => {
        const card = await openStatsTab(page);
        await expect(card.getByText('🧬 Breeder Bonus')).toBeVisible();
        await expect(card.getByText('(none)')).toBeVisible();
        await expect(card.getByText(/Permanent base-stat bonus/)).toHaveCount(0);
    });

    test('expanding reveals the stepper grid and caption; collapsing hides it again', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.getByText('🧬 Breeder Bonus').click();
        await expect(card.getByText(/Permanent base-stat bonus/)).toBeVisible();

        await card.getByText('🧬 Breeder Bonus').click();
        await expect(card.getByText(/Permanent base-stat bonus/)).toHaveCount(0);
    });

    test('help button opens the Breeder Bonus help topic without toggling the section', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.locator('[aria-label="Help: Breeder Bonus"]').click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('#help-modal-title')).toHaveText('Breeder Bonus');

        await page.getByRole('button', { name: 'Close help' }).click();
        await expect(dialog).not.toBeVisible();
        // Section must still be collapsed — the help click must not have toggled it.
        await expect(card.getByText(/Permanent base-stat bonus/)).toHaveCount(0);
    });

    test('incrementing DEF updates the bonus, the main stat total, and caps at +6', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.getByText('🧬 Breeder Bonus').click();

        const defCard = breederStatCard(card, 'DEF');
        const plusBtn = defCard.locator('button').last();

        for (let i = 0; i < 6; i++) {
            await plusBtn.click();
        }
        await expect(defCard.locator('span').first()).toHaveText('+6');
        await expect(plusBtn).toBeDisabled();

        // A further click is a no-op — the bonus must not exceed +6.
        await plusBtn.click({ force: true }).catch(() => {});
        await expect(defCard.locator('span').first()).toHaveText('+6');

        // Base (species default 10) + 6 = 16 on the main Stat Allocation card.
        await expect(mainStatCard(card, 'DEF').locator('div').nth(3)).toHaveText('16');
    });

    test('decrementing floors at +0 and restores the original base stat', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.getByText('🧬 Breeder Bonus').click();

        const defCard = breederStatCard(card, 'DEF');
        const plusBtn = defCard.locator('button').last();
        const minusBtn = defCard.locator('button').first();

        await expect(minusBtn).toBeDisabled();

        await plusBtn.click();
        await plusBtn.click();
        await expect(defCard.locator('span').first()).toHaveText('+2');
        await expect(mainStatCard(card, 'DEF').locator('div').nth(3)).toHaveText('12');

        await minusBtn.click();
        await minusBtn.click();
        await expect(defCard.locator('span').first()).toHaveText('+0');
        await expect(minusBtn).toBeDisabled();
        await expect(mainStatCard(card, 'DEF').locator('div').nth(3)).toHaveText('10');
    });

    test('collapsed summary lists only stats with a non-zero bonus', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.getByText('🧬 Breeder Bonus').click();

        await breederStatCard(card, 'DEF').locator('button').last().click();
        await breederStatCard(card, 'DEF').locator('button').last().click();
        await breederStatCard(card, 'SPD').locator('button').last().click();

        await card.getByText('🧬 Breeder Bonus').click(); // collapse

        await expect(card.getByText(/DEF \+2/)).toBeVisible();
        await expect(card.getByText(/SPD \+1/)).toBeVisible();
        await expect(card.getByText(/ATK \+/)).toHaveCount(0);
    });

    test('bonus survives switching tabs away and back', async ({ page }) => {
        const card = await openStatsTab(page);
        await card.getByText('🧬 Breeder Bonus').click();
        await breederStatCard(card, 'SATK').locator('button').last().click();
        await breederStatCard(card, 'SATK').locator('button').last().click();
        await breederStatCard(card, 'SATK').locator('button').last().click();

        await card.locator('.pokemon-card-tabs .tab', { hasText: 'moves' }).click();
        await expect(card.getByText(/Known Moves/)).toBeVisible();
        await card.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
        await expect(card.getByText(/Stat Allocation/i)).toBeVisible();

        // PokemonCard itself never unmounts across its inner tabs, so both the expanded/collapsed
        // UI state and the bonus value should still be exactly as left.
        await expect(breederStatCard(card, 'SATK').locator('span').first()).toHaveText('+3');
        await expect(mainStatCard(card, 'SATK').locator('div').nth(3)).toHaveText('13');
    });
});
