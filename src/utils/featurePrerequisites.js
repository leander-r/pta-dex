// ============================================================
// FEATURE PREREQUISITE PARSING
// ============================================================
// Feature prerequisites in the game data are free text (e.g. "Ace Trainer,
// Improved Attacks +, 18 ATK, 18 SATK"), not structured data. This module
// extracts only the parts that can be checked with confidence — a required
// class, a required prior feature, a stat minimum, or a level minimum — and
// leaves anything else (narrative/situational clauses like "has suffered a
// Mach Punch attack", OR conditions, money costs) unparsed and unchecked
// rather than guessing. Unparsed clauses never block a pick; this is meant
// to surface likely-missed requirements, not to be a complete rules engine.

const STAT_ABBR = { ATK: 'atk', DEF: 'def', SATK: 'satk', SDEF: 'sdef', SPD: 'spd', HP: 'hp' };
const STAT_LABEL = { atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD', hp: 'HP' };

const LEVEL_RE = /^Level\s+(\d+)$/i;
const STAT_RE = /^(\d+)\s+(ATK|DEF|SATK|SDEF|SPD|HP)(\s+Stat)?$/i;

/**
 * Parse a feature's prerequisites string into checkable requirements.
 * classNames/featureNames are Sets of known names from GAME_DATA, used to
 * recognize which comma-separated clauses refer to a class or a feature.
 */
export const parsePrerequisites = (prereqString, { classNames, featureNames } = {}) => {
    const result = { classes: [], features: [], stats: [], level: null, unparsed: [] };
    if (!prereqString || typeof prereqString !== 'string') return result;

    const parts = prereqString.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
        const levelMatch = part.match(LEVEL_RE);
        if (levelMatch) {
            result.level = Math.max(result.level ?? 0, parseInt(levelMatch[1], 10));
            continue;
        }

        const statMatch = part.match(STAT_RE);
        if (statMatch) {
            result.stats.push({ stat: STAT_ABBR[statMatch[2].toUpperCase()], value: parseInt(statMatch[1], 10) });
            continue;
        }

        if (classNames?.has(part)) {
            result.classes.push(part);
            continue;
        }

        if (featureNames?.has(part)) {
            result.features.push(part);
            continue;
        }

        result.unparsed.push(part);
    }
    return result;
};

/**
 * Check a parsed set of requirements against a trainer, returning a list of
 * human-readable descriptions of anything NOT met (empty array = fully met,
 * ignoring any unparsed clauses — those are never treated as unmet).
 */
export const getUnmetPrerequisites = (prereqString, trainer, { classNames, featureNames } = {}) => {
    const parsed = parsePrerequisites(prereqString, { classNames, featureNames });
    const unmet = [];

    const heldClasses = trainer?.classes || [];
    const heldFeatureNames = new Set((trainer?.features || []).map(f => (typeof f === 'object' ? f.name : f)));

    parsed.classes.forEach(cls => {
        if (!heldClasses.includes(cls)) unmet.push(`${cls} class`);
    });
    parsed.features.forEach(feat => {
        if (!heldFeatureNames.has(feat)) unmet.push(`"${feat}" feature`);
    });
    parsed.stats.forEach(({ stat, value }) => {
        const actual = trainer?.stats?.[stat] ?? 10;
        if (actual < value) unmet.push(`${STAT_LABEL[stat]} ${value}+ (currently ${actual})`);
    });
    if (parsed.level !== null && (trainer?.level || 0) < parsed.level) {
        unmet.push(`Level ${parsed.level}+ (currently ${trainer?.level || 0})`);
    }

    return unmet;
};
