// ============================================================
// DATA CALCULATION UTILITIES
// ============================================================

import { GAME_DATA } from '../data/configs.js';
import {
    POKEMON_HP_MULTIPLIER,
    COMBAT_STAGE_POSITIVE_MULTIPLIER,
    COMBAT_STAGE_NEGATIVE_MULTIPLIER
} from '../data/constants.js';

/**
 * Calculate stat modifier (PH2 p.10: +1 per 2 pts above 10, -1 per pt below 10)
 */
export const calcModifier = (stat) => {
    if (stat === 10) return 0;
    if (stat < 10) return -(10 - stat);
    return Math.floor((stat - 10) / 2);
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => (num || 0).toLocaleString();

/**
 * Calculate Pokémon level from experience
 */
export const calculatePokemonLevel = (exp) => {
    let level = 1;
    for (let lvl in GAME_DATA.pokemonExpChart) {
        if (exp >= GAME_DATA.pokemonExpChart[lvl]) {
            level = parseInt(lvl);
        } else {
            break;
        }
    }
    return level;
};

/**
 * Calculate exp needed for next level
 */
export const getExpToNextLevel = (currentExp, currentLevel) => {
    const nextLevel = Math.min(currentLevel + 1, 100);
    const expNeeded = GAME_DATA.pokemonExpChart[nextLevel] || 0;
    return expNeeded - currentExp;
};

/**
 * Apply nature to Pokémon stats
 * HP modifications are +1/-1, all other stats are +2/-2
 */
export const applyNature = (baseStats, nature) => {
    const natureData = GAME_DATA.natures[nature];
    if (!natureData) return baseStats;
    
    let modifiedStats = { ...baseStats };
    if (natureData.buff) {
        // HP gets +1, other stats get +2
        const buffAmount = natureData.buff === 'hp' ? 1 : 2;
        modifiedStats[natureData.buff] = baseStats[natureData.buff] + buffAmount;
    }
    if (natureData.nerf) {
        // HP gets -1, other stats get -2
        const nerfAmount = natureData.nerf === 'hp' ? 1 : 2;
        modifiedStats[natureData.nerf] = Math.max(1, baseStats[natureData.nerf] - nerfAmount);
    }
    return modifiedStats;
};

/**
 * Calculate Combat Stage modifier for a stat
 * +25% per positive stage (rounded down), -10% per negative stage (rounded up)
 * At +6: 250% of original, at -6: 40% of original
 */
export const applyCombatStage = (baseStat, stages) => {
    if (stages === 0) return baseStat;
    
    if (stages > 0) {
        // +25% per positive stage, rounded down
        return Math.floor(baseStat * (1 + (stages * COMBAT_STAGE_POSITIVE_MULTIPLIER)));
    } else {
        // -10% per negative stage, rounded up
        // At -6, should be 40% of original (1 - 0.6 = 0.4)
        const reduction = Math.abs(stages) * COMBAT_STAGE_NEGATIVE_MULTIPLIER;
        return Math.ceil(baseStat * (1 - reduction));
    }
};

/**
 * Get combat stage percentage display
 */
export const getCombatStagePercent = (stages) => {
    if (stages === 0) return '100%';
    if (stages > 0) {
        return `${100 + (stages * 25)}%`;
    } else {
        return `${100 - (Math.abs(stages) * 10)}%`;
    }
};

/**
 * Calculate Speed Skill modifier from combat stages
 * +1 per 2 positive stages, -1 per 3 negative stages (min 1)
 */
export const getSpeedSkillMod = (spdStages) => {
    if (spdStages >= 0) {
        return Math.floor(spdStages / 2);
    } else {
        return -Math.floor(Math.abs(spdStages) / 3);
    }
};

/**
 * Calculate STAB bonus - OFFICIAL P:TA HANDBOOK
 * You get the bonus AT the listed level
 */
export const calculateSTAB = (level) => {
    if (level >= 100) return 20;
    if (level >= 95) return 19;
    if (level >= 90) return 18;
    if (level >= 85) return 17;
    if (level >= 80) return 16;
    if (level >= 75) return 15;
    if (level >= 70) return 14;
    if (level >= 65) return 13;
    if (level >= 60) return 12;
    if (level >= 55) return 11;
    if (level >= 50) return 10;
    if (level >= 45) return 9;
    if (level >= 40) return 8;
    if (level >= 35) return 7;
    if (level >= 30) return 6;
    if (level >= 25) return 5;
    if (level >= 20) return 4;
    if (level >= 15) return 3;
    if (level >= 10) return 2;
    if (level >= 5) return 1;
    return 0;
};

/**
 * Get actual stats including added stats and nature
 */
export const getActualStats = (pokemon) => {
    if (!pokemon) return { hp: 1, atk: 1, def: 1, satk: 1, sdef: 1, spd: 1 };
    
    const base = pokemon.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };
    const added = pokemon.addedStats || { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 };
    
    const combinedStats = {
        hp:   (base.hp   || 0) + (added.hp   || 0),
        atk:  (base.atk  || 0) + (added.atk  || 0),
        def:  (base.def  || 0) + (added.def  || 0),
        satk: (base.satk || 0) + (added.satk || 0),
        sdef: (base.sdef || 0) + (added.sdef || 0),
        spd:  (base.spd  || 0) + (added.spd  || 0),
    };
    
    // Apply nature modifications
    return applyNature(combinedStats, pokemon.nature);
};

/**
 * Calculate Pokemon HP: Level + (HP stat × 3)
 */
export const calculatePokemonHP = (pokemon) => {
    if (!pokemon) return 0;
    const actualStats = getActualStats(pokemon);
    return pokemon.level + (actualStats.hp * POKEMON_HP_MULTIPLIER);
};

/**
 * Parse dice notation string (e.g., "2d6+5", "3d12+14", "1d20")
 */
export const parseDice = (diceStr) => {
    if (!diceStr) return { count: 0, sides: 0, bonus: 0 };
    const match = diceStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!match) return { count: 0, sides: 0, bonus: 0 };
    const sign = match[3] === '-' ? -1 : 1;
    return {
        count: parseInt(match[1]) || 0,
        sides: parseInt(match[2]) || 0,
        bonus: match[4] ? sign * (parseInt(match[4]) || 0) : 0
    };
};

/**
 * Parse the Accuracy Check number out of a move's frequency string (e.g. "Battle - 4" -> 4).
 * A "- None" suffix (per PHB2, e.g. Magnet Bomb "cannot miss") means no Accuracy Check applies —
 * returns null so callers can treat the move as an automatic hit instead of defaulting to AC 2.
 */
export const parseACFromFrequency = (freq) => {
    if (!freq) return 2;
    if (/[-–]\s*None\b/i.test(freq)) return null;
    const match = freq.match(/[-–]\s*(\d+)/);
    return match ? parseInt(match[1]) : 2;
};

/**
 * Parse a move description for an extended crit range (e.g. "Critical Hit on 18-20").
 * Returns the lowest roll that counts as a crit (default 20).
 */
export const parseCritThreshold = (description = '') => {
    const match = (description || '').match(/Critical Hit on (\d+)[-–]20/i);
    return match ? parseInt(match[1]) : 20;
};

/**
 * Parse an item's effect string for an HP heal formula.
 * Handles dice notation ("2d6+3 HP", "2d6 + 3 HP") and fractions ("1/2 Max HP").
 * Returns { type: 'dice', formula } | { type: 'fraction', num, denom } | { type: 'none' }
 */
export const parseHealFormula = (effectStr = '') => {
    const diceMatch = effectStr.match(/(\d+d\d+(?:\s*[+]\s*\d+)?)\s*HP/i);
    if (diceMatch) return { type: 'dice', formula: diceMatch[1].replace(/\s+/g, '') };
    const fracMatch = effectStr.match(/(\d+)\/(\d+)\s*Max\s*HP/i);
    if (fracMatch) return { type: 'fraction', num: parseInt(fracMatch[1]), denom: parseInt(fracMatch[2]) };
    return { type: 'none' };
};

const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };
const STATS = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];

/**
 * Returns an array of human-readable violation strings for a Pokémon's current
 * stat allocation (addedStats vs baseStats). Empty array = no violations.
 * Base Relation rule (PH2 p.257): if base(A) > base(B), total(A) must be > total(B).
 */
export const getBaseRelationViolations = (pokemon) => {
    const base = applyNature(pokemon?.baseStats || {}, pokemon?.nature);
    const added = pokemon?.addedStats || {};
    const totals = {};
    for (const s of STATS) totals[s] = (base[s] || 0) + (added[s] || 0);
    const seen = new Set();
    for (const sA of STATS) {
        for (const sB of STATS) {
            if (sA === sB) continue;
            if ((base[sA] || 0) > (base[sB] || 0) && totals[sA] <= totals[sB]) {
                const key = `${sA}>${sB}`;
                if (!seen.has(key)) {
                    seen.add(key);
                }
            }
        }
    }
    return [...seen].map(key => {
        const [sA, sB] = key.split('>');
        return `${STAT_LABELS[sA]} (base ${base[sA] || 0}) must exceed ${STAT_LABELS[sB]} (base ${base[sB] || 0})`;
    });
};
