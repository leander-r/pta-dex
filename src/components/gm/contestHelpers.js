// ============================================================
// Contest Runner — constants and pure helpers
// ============================================================
// Extracted from ContestRunner.jsx (split out for file-size/maintainability —
// ContestRunner.jsx had grown to ~1500 lines). Pure data/functions only, no
// JSX or component state, so this carries zero behavior-change risk.

import { parseDice } from '../../utils/dataUtils.js';

// ── Constants ──────────────────────────────────────────────────────────────

export const CONTEST_TYPES = [
    { id: 'Cool',   color: '#2196f3', icon: '😎' },
    { id: 'Beauty', color: '#e91e63', icon: '💎' },
    { id: 'Cute',   color: '#ff9800', icon: '🌸' },
    { id: 'Smart',  color: '#4caf50', icon: '🔮' },
    { id: 'Tough',  color: '#795548', icon: '💪' },
];

export const TYPE_ADJACENT = {
    Cool:   ['Beauty', 'Tough'],
    Beauty: ['Cool',   'Cute'],
    Cute:   ['Beauty', 'Smart'],
    Smart:  ['Cute',   'Tough'],
    Tough:  ['Smart',  'Cool'],
};

export const getTypeRelation = (moveType, contestType) => {
    if (!moveType || !contestType) return 'adjacent';
    if (moveType === contestType) return 'same';
    if (TYPE_ADJACENT[contestType]?.includes(moveType)) return 'adjacent';
    return 'opposite';
};

export const ctColor = (id) => CONTEST_TYPES.find(t => t.id === id)?.color || '#667eea';

// ── Contest effect keywords ─────────────────────────────────────────────────

export const KEYWORD_SET = new Set([
    'Round Starter', 'Round Ender', 'Get Ready!', 'Reliable', 'Torrential Appeal',
    'Reflective Appeal', 'Inversed Appeal', 'Final Appeal', 'Catching Up',
    'Special Attention', 'Attention Grabber', 'Big Show', 'Incentives', 'Excitement',
    'Hold That Thought', 'Scrambler', 'Quick Set', 'Slow Set', 'Good Show!',
    'Seen Nothing Yet', 'Interrupting Appeal', 'Unsettling', 'No Effect',
    'Crowd Pleaser', 'Incredible', 'Start Set', 'End Set',
]);

export const normalizeKeyword = (effect) => {
    if (!effect?.trim()) return null;
    const t = effect.trim();
    if (KEYWORD_SET.has(t)) return t;
    const tl = t.toLowerCase();
    for (const kw of KEYWORD_SET) {
        if (kw.toLowerCase() === tl) return kw;
    }
    return null;
};

export const KEYWORD_DESC = {
    'Round Starter':      '+2d4 if you appeal first this round',
    'Round Ender':        '+2d4 if you appeal last this round',
    'Get Ready!':         'Next appeal: 2× dice (if max voltage: 14d4 total)',
    'Reliable':           'Using this move again next round: normal dice + extra 1d4',
    'Torrential Appeal':  '1d4 / 2d4 / 3d4 based on turn position',
    'Reflective Appeal':  '1d4 per voltage the judge currently has',
    'Inversed Appeal':    '1d4 per voltage the judge is missing (6 − voltage)',
    'Final Appeal':       '2× dice in the final round',
    'Catching Up':        '+3d4 if you have the lowest total appeal',
    'Special Attention':  '+3d4 if first to target this judge this round',
    'Attention Grabber':  'Halve previous contestant\'s appeal for this judge; add difference to yours',
    'Big Show':           '15d4 if all contestants target same judge (4th/5th turn only)',
    'Incentives':         '+2d4 if you raise this judge\'s voltage',
    'Excitement':         'This judge\'s voltage cannot decrease this round',
    'Hold That Thought':  'This judge\'s voltage cannot increase this round',
    'Scrambler':          'Next round\'s turn order is randomized',
    'Quick Set':          'You go first in the next round',
    'Slow Set':           'You go last in the next round',
    'Good Show!':         '+3d4 if this judge\'s voltage was raised in each of the last 2 turns',
    'Seen Nothing Yet':   '+3d4 if max voltage was reached this or last round',
    'Interrupting Appeal':'Goes before all others this round regardless of order',
    'Unsettling':         'All judges lose 1 voltage',
    'No Effect':          'No special contest effect',
    'Crowd Pleaser':      'Raises the target judge\'s voltage by 2 regardless of contest type',
    'Incredible':         'Raises all judges\' voltage by 1 regardless of contest type',
    'Start Set':          'Perform first, second, or third next round (Feature-modified — choose when used)',
    'End Set':            'Perform third, fourth, or last next round (Feature-modified — choose when used)',
};

export const KEYWORD_COLOR = {
    'Round Starter':      '#4caf50', 'Round Ender':       '#4caf50',
    'Final Appeal':       '#4caf50', 'Catching Up':       '#4caf50',
    'Special Attention':  '#4caf50', 'Good Show!':        '#4caf50',
    'Seen Nothing Yet':   '#4caf50', 'Incentives':        '#4caf50',
    'Get Ready!':         '#e91e63', 'Reliable':          '#e91e63',
    'Torrential Appeal':  '#2196f3', 'Reflective Appeal': '#2196f3', 'Inversed Appeal': '#2196f3',
    'Attention Grabber':  '#f44336', 'Big Show':          '#f44336',
    'Excitement':         '#ff9800', 'Hold That Thought': '#ff9800', 'Unsettling': '#ff9800',
    'Scrambler':          '#9c27b0', 'Quick Set':         '#9c27b0',
    'Slow Set':           '#9c27b0', 'Interrupting Appeal':'#9c27b0',
    'Start Set':          '#9c27b0', 'End Set':           '#9c27b0',
    'No Effect':          '#9e9e9e',
    'Crowd Pleaser':      '#ff9800', 'Incredible':        '#ff9800',
};

// ── Dice helpers ───────────────────────────────────────────────────────────

export const rollD4s = (count) =>
    Array.from({ length: Math.max(0, Math.floor(count)) }, () => Math.floor(Math.random() * 4) + 1);

export const rollDiceStr = (diceStr) => {
    const { count, sides, bonus } = parseDice(diceStr);
    if (!count || !sides) return { rolls: [], bonus: 0, total: 0 };
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    return { rolls, bonus, total: rolls.reduce((a, b) => a + b, 0) + bonus };
};

export const parsePasteInput = (text) => {
    if (!text?.trim()) return null;
    const parts = text.split('|').map(s => s.trim());
    if (parts.length >= 4) {
        const score = parseInt(parts[3]);
        if (isNaN(score)) return null;
        return { name: parts[0], moveName: parts[1], moveContestType: parts[2], score, effect: parts[4] || '' };
    }
    if (parts.length === 3) {
        const score = parseInt(parts[2]);
        if (isNaN(score)) return null;
        return { name: parts[0], moveName: parts[1], moveContestType: '', score, effect: '' };
    }
    return null;
};
