export const createDemoTrainer = () => {
    const base = Date.now() * 1000 + Math.floor(Math.random() * 999);
    return {
        id: base,
        name: 'Red',
        gender: 'male',
        age: 16,
        level: 5,
        experience: 0,
        classes: ['Ace Trainer'],
        // All 4 level-up points already spent (Ace Trainer's 3 skill picks below come
        // from its real skillPool: Bluff/Diplomacy, Browbeat, Concentration, History,
        // Investigate, Sprint, Streetwise, Tireless — not the old Athletics/Intimidate names).
        stats: { hp: 12, atk: 14, def: 9, satk: 9, sdef: 9, spd: 11 },
        statPoints: 0,
        levelStatPoints: 0,
        featPoints: 1,
        skills: { Browbeat: 1, Sprint: 1, Concentration: 1 },
        features: [],
        notes: 'Example trainer — feel free to edit or delete.',
        badges: [],
        money: 2500,
        archived: false,
        partyPresets: [],
        party: [
            {
                id: base + 1,
                name: 'Pika',
                species: 'Pikachu',
                gender: 'male',
                level: 8, exp: 650,
                highestLevelReached: 8,
                types: ['Electric'],
                nature: 'Jolly',
                ability: 'Static',
                // Real Pikachu baseStats (also re-synced from the live Pokédex on load, see
                // DataContext.loadDemoTrainer) — kept accurate here as a readable fallback.
                baseStats: { hp: 4, atk: 6, def: 4, satk: 5, sdef: 5, spd: 9 },
                addedStats: { hp: 0, atk: 2, def: 0, satk: 0, sdef: 0, spd: 5 },
                statAllocationHistory: ['atk', 'atk', 'spd', 'spd', 'spd', 'spd', 'spd'],
                statPointsAvailable: 0,
                // Natural moves learnable by level 8 (Quick Attack is real but not until
                // level 10); Shock Wave is a legitimate tutor-taught move for Pikachu.
                // category/damage/frequency/range/effect mirror GAME_DATA.moves so these
                // display correctly without relying on a live move-data merge.
                moves: [
                    { name: 'Growl', source: 'natural', type: 'Normal', learnedAtLevel: 5,
                      category: 'Status', damage: '', frequency: 'At-Will - 2', range: 'Ranged 5', effect: 'No Target, Burst, Sound' },
                    { name: 'Play Nice', source: 'natural', type: 'Normal', learnedAtLevel: 7,
                      category: 'Status', damage: '', frequency: 'At-Will - 2', range: 'Ranged 4', effect: '1 Target' },
                    { name: 'Shock Wave', source: 'taught', type: 'Electric',
                      category: 'Special', damage: '2d10+8', frequency: 'EOT - None', range: 'Ranged 2', effect: '1 Target, Column' },
                ],
                skills: [], notes: '', loyalty: 3, heldItem: '', moveHistory: [],
            },
            {
                id: base + 2,
                name: 'Bulba',
                species: 'Bulbasaur',
                gender: 'male',
                level: 7, exp: 450,
                highestLevelReached: 7,
                types: ['Grass', 'Poison'],
                nature: 'Bold',
                ability: 'Overgrow',
                // Real Bulbasaur baseStats (also re-synced from the live Pokédex on load, see
                // DataContext.loadDemoTrainer) — kept accurate here as a readable fallback.
                baseStats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
                addedStats: { hp: 2, atk: 0, def: 1, satk: 2, sdef: 1, spd: 0 },
                statAllocationHistory: ['hp', 'hp', 'def', 'satk', 'satk', 'sdef'],
                statPointsAvailable: 0,
                // Natural moves learnable by level 7 (Vine Whip is real but not until
                // level 9); Giga Drain is a legitimate tutor-taught move for Bulbasaur.
                // category/damage/frequency/range/effect mirror GAME_DATA.moves so these
                // display correctly without relying on a live move-data merge.
                moves: [
                    { name: 'Tackle', source: 'natural', type: 'Normal', learnedAtLevel: 1,
                      category: 'Physical', damage: '2d8+6', frequency: 'At-Will - 3', range: 'Melee', effect: '1 Target, Dash' },
                    { name: 'Growl', source: 'natural', type: 'Normal', learnedAtLevel: 3,
                      category: 'Status', damage: '', frequency: 'At-Will - 2', range: 'Ranged 5', effect: 'No Target, Burst, Sound' },
                    { name: 'Leech Seed', source: 'natural', type: 'Grass', learnedAtLevel: 7,
                      category: 'Status', damage: '', frequency: 'Center - 4', range: 'Ranged 6', effect: '1 Target' },
                    { name: 'Giga Drain', source: 'taught', type: 'Grass',
                      category: 'Special', damage: '3d10+12', frequency: 'Battle - 2', range: 'Ranged 4', effect: '1 Target' },
                ],
                skills: [], notes: '', loyalty: 3, heldItem: '', moveHistory: [],
            },
        ],
        reserve: [],
    };
};
