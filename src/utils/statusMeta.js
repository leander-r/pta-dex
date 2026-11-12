// ============================================================
// STATUS DISPLAY METADATA
// ============================================================
// Derives short labels/abbreviations/colors for status conditions from the
// single source of truth (src/data/statusConditions.js) — used by Discord
// embed text (label) and the battle-screen canvas badges (abbrev + color).

import { STATUS_CONDITIONS } from '../data/statusConditions.js';

const ABBREVIATIONS = {
    burned: 'BRN',
    poisoned: 'PSN',
    badlyPoisoned: 'TOX',
    frozen: 'FRZ',
    paralyzed: 'PAR',
    asleep: 'SLP',
    confused: 'CNF',
    infatuated: 'INF',
    flinched: 'FLN',
};

export const STATUS_META = Object.fromEntries(
    STATUS_CONDITIONS.map(({ key, label, color }) => [
        key,
        { label, color, abbrev: ABBREVIATIONS[key] || label.slice(0, 3).toUpperCase() },
    ])
);
