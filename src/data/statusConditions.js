// ============================================================
// Status Condition Definitions — PH2 p.403
// ============================================================
// Single source of truth for all status afflictions.
// NOTE: Fainted is NOT a status affliction — it is an HP state handled by HPTracker.
// A Pokémon or Trainer can suffer up to 2 status afflictions at a time (PH2 p.403).

export const STATUS_CONDITIONS = [
    {
        key: 'burned',
        label: 'Burned',
        icon: '🔥',
        color: '#f44336',
        mechanic: 'DEF treated as −2 combat stages for damage calculations. Takes damage at end of each round.'
    },
    {
        key: 'poisoned',
        label: 'Poisoned',
        icon: '☠️',
        color: '#9c27b0',
        mechanic: 'SDEF treated as −2 combat stages for damage calculations. Takes damage at end of each round.'
    },
    {
        key: 'badlyPoisoned',
        label: 'Badly Poisoned',
        icon: '💀',
        color: '#6a1b9a',
        mechanic: 'SDEF treated as −2 combat stages for damage calculations. Damage increases each round.'
    },
    {
        key: 'frozen',
        label: 'Frozen',
        icon: '🧊',
        color: '#42a5f5',
        mechanic: 'Cannot act. Roll 1d20 at start of turn — on 11–20: thaw and act normally.'
    },
    {
        key: 'paralyzed',
        label: 'Paralyzed',
        icon: '⚡',
        color: '#ffc107',
        mechanic: 'Speed halved. Each turn roll 1d20 — on 1–10: cannot act this turn.'
    },
    {
        key: 'asleep',
        label: 'Asleep',
        icon: '💤',
        color: '#607d8b',
        mechanic: 'Cannot act. Roll 1d20 at start of turn — on 11–20: wake up and act normally.'
    },
    {
        key: 'confused',
        label: 'Confused',
        icon: '💫',
        color: '#ff9800',
        mechanic: '50% chance each turn to attack itself instead of the intended target.'
    },
    {
        key: 'infatuated',
        label: 'Infatuated',
        icon: '💕',
        color: '#e91e63',
        mechanic: 'Each turn roll 1d20 — 1–10: cannot act freely (must target infatuating Pokémon); 20: cured. Also cured by switching out. Opposing gender only.'
    },
    {
        key: 'flinched',
        label: 'Flinched',
        icon: '😵',
        color: '#795548',
        mechanic: 'Cannot act this turn (single-turn effect from last round\'s hit).'
    },
];
