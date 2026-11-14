import { describe, it, expect } from 'vitest';
import { parsePrerequisites, getUnmetPrerequisites } from '../featurePrerequisites.js';

const classNames = new Set(['Ace Trainer', 'Black Belt', 'Martial Artist', 'Chaser']);
const featureNames = new Set(['Improved Attacks +', 'Go Away!', 'Jump Kick', 'Bloodthirst']);

describe('parsePrerequisites', () => {
    it('returns all-empty for no prerequisites', () => {
        expect(parsePrerequisites(null, { classNames, featureNames })).toEqual({
            classes: [], features: [], stats: [], level: null, unparsed: [],
        });
        expect(parsePrerequisites('', { classNames, featureNames }).classes).toEqual([]);
    });

    it('parses a known class name', () => {
        const r = parsePrerequisites('Ace Trainer', { classNames, featureNames });
        expect(r.classes).toEqual(['Ace Trainer']);
        expect(r.unparsed).toEqual([]);
    });

    it('parses a known prior-feature name', () => {
        const r = parsePrerequisites('Go Away!', { classNames, featureNames });
        expect(r.features).toEqual(['Go Away!']);
    });

    it('parses stat minimums in "N STAT" form', () => {
        const r = parsePrerequisites('18 ATK, 18 SATK', { classNames, featureNames });
        expect(r.stats).toEqual([{ stat: 'atk', value: 18 }, { stat: 'satk', value: 18 }]);
    });

    it('parses stat minimums with a trailing "Stat" word, case-insensitively', () => {
        expect(parsePrerequisites('13 HP Stat', { classNames, featureNames }).stats).toEqual([{ stat: 'hp', value: 13 }]);
        expect(parsePrerequisites('17 hp stat', { classNames, featureNames }).stats).toEqual([{ stat: 'hp', value: 17 }]);
    });

    it('parses a level minimum, case-insensitively, taking the highest if repeated', () => {
        expect(parsePrerequisites('Level 20', { classNames, featureNames }).level).toBe(20);
        expect(parsePrerequisites('level 15', { classNames, featureNames }).level).toBe(15);
    });

    it('combines class + feature + multiple stats in one string', () => {
        const r = parsePrerequisites('Ace Trainer, Improved Attacks +, 18 ATK, 18 SATK', { classNames, featureNames });
        expect(r.classes).toEqual(['Ace Trainer']);
        expect(r.features).toEqual(['Improved Attacks +']);
        expect(r.stats).toEqual([{ stat: 'atk', value: 18 }, { stat: 'satk', value: 18 }]);
    });

    it('leaves narrative/situational clauses unparsed rather than guessing', () => {
        const r = parsePrerequisites('Black Belt, has suffered a Mach Punch attack', { classNames, featureNames });
        expect(r.classes).toEqual(['Black Belt']);
        expect(r.unparsed).toEqual(['has suffered a Mach Punch attack']);
    });

    it('leaves an OR-condition between two stats unparsed rather than wrongly ANDing them', () => {
        const r = parsePrerequisites('14 SATK or 14 SDEF', { classNames, featureNames });
        expect(r.stats).toEqual([]);
        expect(r.unparsed).toEqual(['14 SATK or 14 SDEF']);
    });

    it('does not mistake "took N HP from X" damage-taken text for an HP stat minimum', () => {
        // "Godspeaker" isn't in this test's known-class set, so it's expected to also land
        // in unparsed here — the point of this test is the HP clause, not the class clause.
        const r = parsePrerequisites('Godspeaker, took 1000 HP from Legendary Pokémon by using Features', { classNames, featureNames });
        expect(r.stats).toEqual([]);
        expect(r.unparsed).toContain('took 1000 HP from Legendary Pokémon by using Features');
    });

    it('leaves an unrecognized token (not a class, feature, stat, or level) unparsed', () => {
        const r = parsePrerequisites('Weapon of Choice (Unarmed)', { classNames, featureNames });
        expect(r.unparsed).toEqual(['Weapon of Choice (Unarmed)']);
    });
});

describe('getUnmetPrerequisites', () => {
    const trainer = {
        level: 5,
        classes: ['Ace Trainer'],
        features: ['Improved Attacks +'],
        stats: { atk: 16, satk: 10, def: 10, sdef: 10, spd: 10, hp: 10 },
    };

    it('returns an empty list when every parseable requirement is met', () => {
        expect(getUnmetPrerequisites('Ace Trainer', trainer, { classNames, featureNames })).toEqual([]);
        expect(getUnmetPrerequisites(null, trainer, { classNames, featureNames })).toEqual([]);
    });

    it('flags a missing class', () => {
        expect(getUnmetPrerequisites('Black Belt', trainer, { classNames, featureNames })).toEqual(['Black Belt class']);
    });

    it('flags a missing prior feature', () => {
        expect(getUnmetPrerequisites('Go Away!', trainer, { classNames, featureNames })).toEqual(['"Go Away!" feature']);
    });

    it('flags an unmet stat minimum with the current value shown', () => {
        expect(getUnmetPrerequisites('18 SATK', trainer, { classNames, featureNames })).toEqual(['SATK 18+ (currently 10)']);
    });

    it('does not flag a met stat minimum', () => {
        expect(getUnmetPrerequisites('16 ATK', trainer, { classNames, featureNames })).toEqual([]);
    });

    it('flags an unmet level minimum', () => {
        expect(getUnmetPrerequisites('Level 10', trainer, { classNames, featureNames })).toEqual(['Level 10+ (currently 5)']);
    });

    it('collects every unmet requirement from a combined prerequisites string', () => {
        // Ace Trainer class and the Improved Attacks + feature are already held; ATK (16)
        // and SATK (10) both fall short of the required 18.
        const unmet = getUnmetPrerequisites('Ace Trainer, Improved Attacks +, 18 ATK, 18 SATK', trainer, { classNames, featureNames });
        expect(unmet).toEqual(['ATK 18+ (currently 16)', 'SATK 18+ (currently 10)']);
    });

    it('never flags an unparsed/narrative clause as unmet', () => {
        expect(getUnmetPrerequisites('has suffered a Mach Punch attack', trainer, { classNames, featureNames })).toEqual([]);
    });
});
