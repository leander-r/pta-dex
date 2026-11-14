import { test, expect } from '@playwright/test';

// Regression coverage for a stale-closure bug in the per-card callback cache added for
// PokemonTab's React.memo optimization (src/components/pokemon/PokemonTab.jsx). A reserve
// Pokémon's cached "Move to Party" callback was only invalidated when the active view
// (party/reserve) changed — not when party/reserve contents actually changed — so it could
// keep calling a stale moveToParty() closure that still remembered the party size from
// whenever that specific card's cache entry was last (re)built. Reported by the user: moving
// a Pokémon from reserve into a party sitting at 5/6 incorrectly said "party is full".

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
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

const basePoke = (id, name) => ({
    id, name, species: 'Bulbasaur', level: 5,
    abilities: ['Overgrow'], heldItem: '', types: ['Grass', 'Poison'],
    stats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
    currentDamage: 0, moves: [],
});

// Party starts full (6/6) so the reserve Pokémon's cached "Move to Party" callback gets
// built while viewing Reserve with the party at capacity.
const SEEDED_SAVE = JSON.stringify({
    version: '2.1', activeTrainerId: 1, inventory: [], customSpecies: [],
    trainers: [{
        id: 1, name: 'Ash', gender: 'male', age: '', avatar: '', level: 5, experience: 0,
        classes: [], stats: { hp: 10, atk: 8, def: 8, satk: 8, sdef: 8, spd: 8 },
        statPoints: 0, levelStatPoints: 0, featPoints: 0, skills: {}, features: [], notes: '',
        badges: [], money: 0,
        party: [1, 2, 3, 4, 5, 6].map(n => basePoke(`p${n}`, `Mon${n}`)),
        reserve: [{ ...basePoke('r1', 'Pika'), species: 'Pikachu', types: ['Electric'], stats: { hp: 4, atk: 6, def: 4, satk: 5, sdef: 5, spd: 10 } }],
    }],
});

async function openTileMenu(page, tileName) {
    const tile = page.locator('.pokemon-roster-tile', { hasText: tileName });
    await tile.locator('[aria-label="More actions"]').click();
    return tile;
}

test('moving a Pokémon from reserve into a non-full party does not falsely report "party is full"', async ({ page }) => {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.addInitScript((saveData) => {
        localStorage.setItem('pta-enhanced-save-data', saveData);
    }, SEEDED_SAVE);
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]', { state: 'detached', timeout: 15_000 });

    await page.locator('.nav-button', { hasText: 'Pokémon Team' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Pokémon Team');

    // Visit Reserve first — this builds and caches Pika's card callbacks while the party is
    // still full (6/6), which is the state the stale closure needs to capture.
    await page.locator('[role="tab"]', { hasText: 'Reserve' }).click();
    await expect(page.getByText('Pika')).toBeVisible();

    // Move a party Pokémon out to reserve, dropping the party to 5/6, without ever touching
    // Pika's cache entry.
    await page.locator('[role="tab"]', { hasText: /^Party/ }).click();
    const mon1Tile = await openTileMenu(page, 'Mon1');
    await mon1Tile.getByText('Move to Reserve').click();
    await expect(page.locator('[role="tab"]', { hasText: /^Party/ })).toContainText('Party (5/6)');

    // Now move Pika (the untouched reserve Pokémon) into the party. With the bug, this
    // fires a "party is full" toast and does nothing; it should actually succeed.
    await page.locator('[role="tab"]', { hasText: 'Reserve' }).click();
    const pikaTile = await openTileMenu(page, 'Pika');
    await pikaTile.getByText('Move to Party').click();

    await expect(page.getByText(/party is full/i)).not.toBeVisible();
    await page.locator('[role="tab"]', { hasText: /^Party/ }).click();
    await expect(page.locator('[role="tab"]', { hasText: /^Party/ })).toContainText('Party (6/6)');
    await expect(page.locator('.pokemon-roster-tile', { hasText: 'Pika' })).toBeVisible();
});
