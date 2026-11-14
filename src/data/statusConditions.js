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
        mechanic: 'Cannot act. Once per turn, in place of your action, roll 1d20 to thaw: DC 16 (DC 11 for Ice/Fighting/Fire types). Any Fire/Fighting/Rock/Steel damage move that hits you also thaws you.'
    },
    {
        key: 'paralyzed',
        label: 'Paralyzed',
        icon: '⚡',
        color: '#ffc107',
        mechanic: 'Speed halved. Roll 1d20 to act: DC 6 on the first round, rising by 1 each round (6→7→…→16 cap). On a failed roll, no Move or Shift.'
    },
    {
        key: 'asleep',
        label: 'Asleep',
        icon: '💤',
        color: '#607d8b',
        mechanic: 'Cannot act. Roll 1d20 to wake: DC 16 on the first round, dropping by 2 each round (16→14→12→10→8→6 cap).'
    },
    {
        key: 'confused',
        label: 'Confused',
        icon: '💫',
        color: '#ff9800',
        mechanic: 'Before acting, roll 1d20: 1–10 deals 2× your STAB to yourself instead of acting (no Weakness/Resistance/Defense/SDef applied); 11–15 act normally; 16–20 cures the confusion.'
    },
    {
        key: 'infatuated',
        label: 'Infatuated',
        icon: '💕',
        color: '#e91e63',
        mechanic: 'Before acting, roll 1d20: 1–10 you may not target the Pokémon you\'re infatuated with; 11–19 act normally; 20 cures it. Pokémon only, opposite gender.'
    },
    {
        key: 'flinched',
        label: 'Flinched',
        icon: '😵',
        color: '#795548',
        mechanic: 'Cannot act this turn (single-turn effect from last round\'s hit).'
    },
];
