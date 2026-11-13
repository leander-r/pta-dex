import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
];
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

test.beforeEach(async ({ page }) => {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
});

// One test per tab (rather than one big loop) so a failure names the specific tab in
// the test report, and so a fix for one tab doesn't block the others from reporting.
const TABS = ['Trainer', 'Pokémon Team', 'Inventory', 'Dice Roller', 'Quick Reference', 'Campaign Notes', 'GM Tools'];

for (const tab of TABS) {
    test(`${tab} tab has no automatically detectable accessibility violations`, async ({ page }) => {
        if (tab !== 'Trainer') {
            // Campaign Notes and GM Tools live in MainNavigation's MORE_NAV_ITEMS —
            // shown inline on desktop, but only reachable via the "More" overflow
            // button on mobile viewports.
            const navButton = page.locator('.nav-button', { hasText: tab });
            if (await navButton.first().isVisible()) {
                await navButton.first().click();
            } else {
                await page.locator('.nav-button', { hasText: 'More' }).click();
                await page.getByRole('menuitem', { name: tab }).click();
            }
            await page.waitForTimeout(300);
        }
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
}
