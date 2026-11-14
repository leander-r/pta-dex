import { describe, it, expect, beforeAll } from 'vitest';
import {
    calcModifier,
    formatNumber,
    parseDice,
    calculatePokemonLevel,
    getExpToNextLevel,
    applyCombatStage,
    applyNature,
    getActualStats,
    calculatePokemonHP,
    calculateSTAB,
    getBaseRelationViolations,
    parseACFromFrequency,
    parseCritThreshold,
    resolveAccuracyRoll,
    calculateTrainerMaxHP,
} from '../dataUtils.js';
import { GAME_DATA } from '../../data/configs.js';

describe('calcModifier', () => {
    it('returns 0 for stat 10', () => {
        expect(calcModifier(10)).toBe(0);
    });

    it('returns 2 for stat 14', () => {
        expect(calcModifier(14)).toBe(2);
    });

    it('returns -2 for stat 8', () => {
        expect(calcModifier(8)).toBe(-2);
    });

    it('returns -9 for stat 1', () => {
        expect(calcModifier(1)).toBe(-9);
    });
});

describe('formatNumber', () => {
    it('formats 1234567 with commas', () => {
        expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('returns 0 for falsy values', () => {
        expect(formatNumber(0)).toBe('0');
    });
});

describe('parseDice', () => {
    it('parses 2d6+5', () => {
        expect(parseDice('2d6+5')).toEqual({ count: 2, sides: 6, bonus: 5 });
    });

    it('parses 1d20 with no bonus', () => {
        expect(parseDice('1d20')).toEqual({ count: 1, sides: 20, bonus: 0 });
    });

    it('returns zeros for empty input', () => {
        expect(parseDice('')).toEqual({ count: 0, sides: 0, bonus: 0 });
    });

    it('returns zeros for null input', () => {
        expect(parseDice(null)).toEqual({ count: 0, sides: 0, bonus: 0 });
    });
});

describe('calculatePokemonLevel', () => {
    it('returns level 1 for 0 exp', () => {
        expect(calculatePokemonLevel(0)).toBe(1);
    });

    it('returns level 10 for 1000 exp', () => {
        expect(calculatePokemonLevel(1000)).toBe(10);
    });

    it('returns level 100 for max exp', () => {
        expect(calculatePokemonLevel(2000000)).toBe(100);
    });
});

describe('getExpToNextLevel', () => {
    it('returns 0 when already at max level with max exp', () => {
        expect(getExpToNextLevel(2000000, 100)).toBe(0);
    });

    it('returns positive number at level 1 with 0 exp', () => {
        expect(getExpToNextLevel(0, 1)).toBeGreaterThan(0);
    });
});

describe('applyCombatStage', () => {
    it('returns base stat unchanged at stage 0', () => {
        expect(applyCombatStage(100, 0)).toBe(100);
    });

    it('applies +25% per positive stage at +2', () => {
        expect(applyCombatStage(100, 2)).toBe(150);
    });

    it('applies -10% per negative stage at -2', () => {
        expect(applyCombatStage(100, -2)).toBe(80);
    });
});

describe('applyNature', () => {
    const baseStats = { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };

    it('Adamant boosts ATK and lowers SATK', () => {
        const result = applyNature(baseStats, 'Adamant');
        expect(result.atk).toBe(12);
        expect(result.satk).toBe(8);
    });

    it('Hardy (neutral) returns stats unchanged', () => {
        const result = applyNature(baseStats, 'Hardy');
        expect(result).toEqual(baseStats);
    });
});

describe('calculatePokemonHP', () => {
    it('calculates HP as level + (hp_stat × 3)', () => {
        const pokemon = {
            level: 10,
            baseStats: { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            addedStats: { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 },
            nature: 'Hardy',
        };
        expect(calculatePokemonHP(pokemon)).toBe(40);
    });

    it('returns 0 for null input', () => {
        expect(calculatePokemonHP(null)).toBe(0);
    });
});

describe('calculateSTAB', () => {
    it('returns 0 at level 1', () => {
        expect(calculateSTAB(1)).toBe(0);
    });

    it('returns 10 at level 50', () => {
        expect(calculateSTAB(50)).toBe(10);
    });

    it('returns 20 at level 100', () => {
        expect(calculateSTAB(100)).toBe(20);
    });
});

// ── Mudbray, Calm nature, level 1 ────────────────────────────────────────────
// Mudbray base stats (from pokedex.min.json):
//   hp:7  atk:10  def:7  satk:5  sdef:6  spd:5
//
// Calm nature: +2 SDEF, -2 ATK  →  nature-modified bases:
//   hp:7  atk:8  def:7  satk:5  sdef:8  spd:5
//
// At level 1, no added stats → totals = nature-modified bases
// Max HP = level + (hp_stat × 3) = 1 + (7 × 3) = 22
// ─────────────────────────────────────────────────────────────────────────────
describe('Stats tab — Mudbray, Calm nature, level 1', () => {
    const mudbrayBase = { hp: 7, atk: 10, def: 7, satk: 5, sdef: 6, spd: 5 };
    const mudbray = {
        level: 1,
        baseStats: mudbrayBase,
        addedStats: {},
        nature: 'Calm',
    };

    beforeAll(() => {
        // Calm is not in the 5-nature fallback; inject it so applyNature resolves correctly.
        GAME_DATA.natures['Calm'] = { buff: 'sdef', nerf: 'atk' };
    });

    it('applyNature applies +2 SDEF and -2 ATK to raw base stats', () => {
        const natBase = applyNature(mudbrayBase, 'Calm');
        expect(natBase.hp).toBe(7);
        expect(natBase.atk).toBe(8);   // 10 - 2
        expect(natBase.def).toBe(7);
        expect(natBase.satk).toBe(5);
        expect(natBase.sdef).toBe(8);  // 6 + 2
        expect(natBase.spd).toBe(5);
    });

    it('Stats tab "Base:" row shows nature-modified values', () => {
        // The Stats tab displays applyNature(baseStats, nature) as the "Base:" label.
        const displayed = applyNature(mudbray.baseStats, mudbray.nature);
        expect(displayed).toMatchObject({ hp: 7, atk: 8, def: 7, satk: 5, sdef: 8, spd: 5 });
    });

    it('getActualStats returns nature-modified totals when no points are added', () => {
        const actual = getActualStats(mudbray);
        expect(actual.hp).toBe(7);
        expect(actual.atk).toBe(8);
        expect(actual.def).toBe(7);
        expect(actual.satk).toBe(5);
        expect(actual.sdef).toBe(8);
        expect(actual.spd).toBe(5);
    });

    it('Max HP = 1 + (7 × 3) = 22', () => {
        expect(calculatePokemonHP(mudbray)).toBe(22);
    });

    it('no Base Relation violations with no added stats', () => {
        expect(getBaseRelationViolations(mudbray)).toHaveLength(0);
    });

    it('Base Relation ordering uses nature-modified bases (ATK 8 = SDEF 8 > HP 7 = DEF 7 > SATK 5 = SPD 5)', () => {
        // ATK base(8) equals SDEF base(8) → no ordering constraint between them
        // Both must exceed HP(7) and DEF(7), which in turn must exceed SATK(5) and SPD(5).
        // Violation: if SATK total reaches ATK total (8) while no points added to ATK → violation
        const withSatkOverAtk = { ...mudbray, addedStats: { satk: 4 } }; // satk total = 9 > atk total = 8
        expect(getBaseRelationViolations(withSatkOverAtk).length).toBeGreaterThan(0);
    });

    it('adding points to SDEF equal to ATK added keeps no violation (equal bases, no constraint)', () => {
        // ATK base == SDEF base (both 8) → no ordering constraint between them
        const withEqualTotals = { ...mudbray, addedStats: { atk: 2, sdef: 2 } };
        expect(getBaseRelationViolations(withEqualTotals)).toHaveLength(0);
    });

});

describe('Breeder Bonus interaction with Base Relation', () => {
    // ATK deliberately low relative to the rest, no nature (applyNature is a no-op for an unknown nature key).
    const baseStats = { hp: 10, atk: 5, def: 10, satk: 10, sdef: 10, spd: 10 };

    it('is legal to invest level-up points into a stat whose base is currently higher', () => {
        // base(def)=10 > base(atk)=5 requires total(def) > total(atk): 15 > 5. OK.
        const pokemon = { level: 1, baseStats, addedStats: { def: 5 }, nature: 'none' };
        expect(getBaseRelationViolations(pokemon)).toHaveLength(0);
    });

    it('a Breeder Bonus written into baseStats can flip the base order and surface a violation against pre-existing level-up points', () => {
        // A Breeder applies a +6 Breeder Bonus to ATK's base stat (Natural Edge/Natural Progression).
        // Because the bonus is folded straight into baseStats ("this becomes the Pokémon's new base
        // stats" — PHB2), ATK's base jumps from 5 to 11, overtaking DEF's base of 10 — the order flips.
        // The DEF total (10 base + 5 added = 15) no longer clears the new bar against ATK's total (11).
        const pokemon = {
            level: 1,
            baseStats: { ...baseStats, atk: baseStats.atk + 6 },
            addedStats: { def: 5 },
            nature: 'none',
        };
        expect(getBaseRelationViolations(pokemon).length).toBeGreaterThan(0);
    });
});

describe('parseACFromFrequency', () => {
    it('extracts the AC number from a frequency string', () => {
        expect(parseACFromFrequency('At-Will - 2')).toBe(2);
        expect(parseACFromFrequency('EOT - 4')).toBe(4);
        expect(parseACFromFrequency('Battle - 8')).toBe(8);
    });

    it('returns null (auto-hit) for "- None" frequencies, not a default AC', () => {
        expect(parseACFromFrequency('EOT - None')).toBeNull();
        expect(parseACFromFrequency('Center - None')).toBeNull();
    });

    it('defaults to AC 2 only when the frequency string is missing entirely', () => {
        expect(parseACFromFrequency('')).toBe(2);
        expect(parseACFromFrequency(null)).toBe(2);
    });
});

describe('parseCritThreshold', () => {
    it('defaults to a natural 20 when no extended crit range is described', () => {
        expect(parseCritThreshold('')).toBe(20);
        expect(parseCritThreshold('Deals extra damage.')).toBe(20);
    });

    it('parses an extended crit range from the move description', () => {
        expect(parseCritThreshold('Critical Hit on 18-20')).toBe(18);
        expect(parseCritThreshold('Critical Hit on 19-20')).toBe(19);
    });
});

describe('resolveAccuracyRoll', () => {
    // Regression guard for the shipped bug where a Pokémon's own EVA stage was being
    // folded into its own attack-accuracy check. EVA only reduces incoming hit rolls
    // against this Pokémon — it must never factor into this function at all, so the
    // only stage-derived modifier this function accepts is the attacker's own ACC.
    it('a hit/miss outcome depends only on the raw roll + the attacker\'s own ACC modifier vs. AC', () => {
        // AC 12, no ACC stage: roll of 12 hits, 11 misses.
        expect(resolveAccuracyRoll(12, 0, 12, 20).isHit).toBe(true);
        expect(resolveAccuracyRoll(11, 0, 12, 20).isHit).toBe(false);
    });

    it('a positive ACC modifier can turn an otherwise-missed roll into a hit', () => {
        const result = resolveAccuracyRoll(10, 3, 12, 20); // 10 + 3 = 13 >= 12
        expect(result.modifiedAccRoll).toBe(13);
        expect(result.isHit).toBe(true);
    });

    it('a negative ACC modifier can turn an otherwise-hit roll into a miss', () => {
        const result = resolveAccuracyRoll(12, -2, 12, 20); // 12 - 2 = 10 < 12
        expect(result.modifiedAccRoll).toBe(10);
        expect(result.isHit).toBe(false);
    });

    it('moveAC === null means the move auto-hits regardless of roll or ACC modifier', () => {
        expect(resolveAccuracyRoll(1, -5, null, 20).isHit).toBe(true);
    });

    it('a natural roll at/above the crit threshold always hits and crits, even against a modified roll below AC', () => {
        const result = resolveAccuracyRoll(20, -10, 25, 20); // modifiedAccRoll = 10, far below AC 25
        expect(result.isCrit).toBe(true);
        expect(result.isHit).toBe(true);
    });

    it('an extended crit threshold (e.g. "18-20") crits on 18 and 19 too, not just a natural 20', () => {
        expect(resolveAccuracyRoll(18, 0, 99, 18).isCrit).toBe(true);
        expect(resolveAccuracyRoll(19, 0, 99, 18).isCrit).toBe(true);
        expect(resolveAccuracyRoll(17, 0, 99, 18).isCrit).toBe(false);
    });
});

describe('calculateTrainerMaxHP', () => {
    const baseTrainer = { level: 10, stats: { hp: 10, atk: 10, def: 10 }, features: [] };

    it('is level*4 + HP-stat*4 with no relevant features', () => {
        expect(calculateTrainerMaxHP(baseTrainer)).toBe(10 * 4 + 10 * 4);
    });

    it('adds (ATK mod + DEF mod) * 5 with Improved Martial Endurance', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 14, def: 12 }, features: ['Improved Martial Endurance'] };
        // atkMod = floor((14-10)/2) = 2, defMod = floor((12-10)/2) = 1 -> (2+1)*5 = 15
        expect(calculateTrainerMaxHP(trainer)).toBe(80 + 15);
    });

    it('adds (floor(ATK mod/2) + floor(DEF mod/2)) * 5 with Martial Endurance (half rate of Improved)', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 14, def: 12 }, features: ['Martial Endurance'] };
        // atkMod=2, defMod=1 -> (floor(2/2)+floor(1/2))*5 = (1+0)*5 = 5
        expect(calculateTrainerMaxHP(trainer)).toBe(80 + 5);
    });

    it('Improved Martial Endurance and Martial Endurance do not stack — only the improved bonus applies', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 14, def: 12 }, features: ['Martial Endurance', 'Improved Martial Endurance'] };
        expect(calculateTrainerMaxHP(trainer)).toBe(80 + 15);
    });

    it('adds DEF mod * 3 with Mystic Veil, stacking with Martial Endurance', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 10, def: 12 }, features: ['Mystic Veil'] };
        // defMod = 1 -> 1*3 = 3
        expect(calculateTrainerMaxHP(trainer)).toBe(80 + 3);
    });

    it('never subtracts HP for a negative stat modifier (clamped at 0 bonus)', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 4, def: 4 }, features: ['Improved Martial Endurance', 'Mystic Veil'] };
        expect(calculateTrainerMaxHP(trainer)).toBe(80);
    });

    it('accepts features stored as {name} objects, not just plain strings', () => {
        const trainer = { ...baseTrainer, stats: { hp: 10, atk: 14, def: 12 }, features: [{ name: 'Mystic Veil' }] };
        expect(calculateTrainerMaxHP(trainer)).toBe(80 + 3);
    });
});
