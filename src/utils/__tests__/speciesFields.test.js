import { describe, it, expect } from 'vitest';
import { buildPokemonSkills, buildSpeciesUpdateFields } from '../speciesFields.js';

describe('buildPokemonSkills', () => {
    it('returns an empty array when skills is missing', () => {
        expect(buildPokemonSkills(null)).toEqual([]);
        expect(buildPokemonSkills(undefined)).toEqual([]);
    });

    it('maps movement skill keys to their display name + value, preserving a value of 0', () => {
        const result = buildPokemonSkills({ overland: 4, surface: 0, jump: 2 });
        expect(result).toEqual([
            { name: 'Overland', value: 4 },
            { name: 'Surface', value: 0 },
            { name: 'Jump', value: 2 },
        ]);
    });

    it('omits a movement skill entirely when it is null/undefined, but keeps false as a present skill value', () => {
        const result = buildPokemonSkills({ overland: undefined, surface: null, jump: 2 });
        expect(result).toEqual([{ name: 'Jump', value: 2 }]);
    });

    it('maps truthy capability flags to a bare { name } entry with no value', () => {
        const result = buildPokemonSkills({ tracker: true, gilled: false, zapper: 1 });
        expect(result).toEqual([
            { name: 'Zapper' },
            { name: 'Tracker' },
        ]);
    });

    it('expands a naturewalk array into one "Naturewalk (terrain)" entry per terrain', () => {
        const result = buildPokemonSkills({ naturewalk: ['Forest', 'Mountain'] });
        expect(result).toEqual([
            { name: 'Naturewalk (Forest)' },
            { name: 'Naturewalk (Mountain)' },
        ]);
    });

    it('ignores a non-array naturewalk value instead of throwing', () => {
        expect(() => buildPokemonSkills({ naturewalk: 'Forest' })).not.toThrow();
        expect(buildPokemonSkills({ naturewalk: 'Forest' })).toEqual([]);
    });

    it('combines movement skills, capabilities, and naturewalk together in mapping order', () => {
        const result = buildPokemonSkills({ power: 3, tracker: true, naturewalk: ['Desert'] });
        expect(result).toEqual([
            { name: 'Power', value: 3 },
            { name: 'Tracker' },
            { name: 'Naturewalk (Desert)' },
        ]);
    });
});

describe('buildSpeciesUpdateFields', () => {
    const speciesData = {
        id: 1,
        species: 'Bulbasaur',
        types: ['Grass', 'Poison'],
        baseStats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
        abilities: { basic: ['Overgrow'], adv: [], high: [] },
        levelUpMoves: [{ level: 1, move: 'Tackle' }],
        eggMoves: [{ move: 'Curse' }],
        tutorMoves: [{ move: 'Frenzy Plant' }],
        skills: { overland: 4, jump: 2 },
    };

    it('uses the base species data directly when no regional form is given', () => {
        const { isRegional, formData, updates } = buildSpeciesUpdateFields(speciesData, null);
        expect(isRegional).toBeFalsy();
        expect(formData).toBeNull();
        expect(updates.species).toBe('Bulbasaur');
        expect(updates.types).toEqual(['Grass', 'Poison']);
        expect(updates.baseStats).toEqual(speciesData.baseStats);
        expect(updates.regionalForm).toBeNull();
        expect(updates.pokemonSkills).toEqual([
            { name: 'Overland', value: 4 },
            { name: 'Jump', value: 2 },
        ]);
    });

    it('treats a regionalForm flagged isBase as the base form, not a regional override', () => {
        const baseForm = { isBase: true, name: 'Kantonian', types: ['Water'] };
        const { isRegional, formData, updates } = buildSpeciesUpdateFields(speciesData, baseForm);
        expect(isRegional).toBe(false);
        expect(formData).toBeNull();
        // Falls back to speciesData's own types/baseStats, ignoring the base-form object's fields
        expect(updates.types).toEqual(['Grass', 'Poison']);
        expect(updates.regionalForm).toBeNull();
    });

    it('overrides types/baseStats/abilities/moves from a real regional form, but keeps skills from the base species', () => {
        const alolanForm = {
            name: 'Alolan',
            types: ['Fire'],
            baseStats: { hp: 9, atk: 9, def: 9, satk: 9, sdef: 9, spd: 9 },
            abilities: { basic: ['Flash Fire'], adv: [], high: [] },
            levelUpMoves: [{ level: 1, move: 'Ember' }],
            eggMoves: [],
            tutorMoves: [],
        };
        const { isRegional, formData, updates } = buildSpeciesUpdateFields(speciesData, alolanForm);
        expect(isRegional).toBe(true);
        expect(formData).toBe(alolanForm);
        expect(updates.types).toEqual(['Fire']);
        expect(updates.baseStats).toEqual(alolanForm.baseStats);
        expect(updates.availableAbilities).toEqual(alolanForm.abilities);
        expect(updates.availableLevelUpMoves).toEqual(alolanForm.levelUpMoves);
        expect(updates.regionalForm).toBe('Alolan');
        // Regional form data carries no skills field in this dataset — always derived
        // from the base species, not the form.
        expect(updates.pokemonSkills).toEqual([
            { name: 'Overland', value: 4 },
            { name: 'Jump', value: 2 },
        ]);
    });

    it('returns deep copies of types/baseStats/abilities, not references to the source species data', () => {
        const { updates } = buildSpeciesUpdateFields(speciesData, null);
        updates.types.push('Fire');
        updates.baseStats.hp = 999;
        expect(speciesData.types).toEqual(['Grass', 'Poison']);
        expect(speciesData.baseStats.hp).toBe(5);
    });

    it('falls back to an empty move-pool array when the species has none', () => {
        const bare = { id: 2, species: 'Missingno', types: [], baseStats: {} };
        const { updates } = buildSpeciesUpdateFields(bare, null);
        expect(updates.availableLevelUpMoves).toEqual([]);
        expect(updates.availableEggMoves).toEqual([]);
        expect(updates.availableTutorMoves).toEqual([]);
        expect(updates.availableAbilities).toBeNull();
    });
});
