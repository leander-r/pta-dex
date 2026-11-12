import { describe, it, expect } from 'vitest';
import {
    buildEmbed, buildPokemonEmbed, buildTrainerSkillEmbed, buildHealEmbed, buildCustomEmbed,
    buildStatusCureEmbed, buildContestEmbed, buildContestTurnEmbed, buildContestResultsEmbed,
    buildTrainerAttackEmbed,
} from '../discordEmbeds.js';

// ── Shared roll fixtures ──────────────────────────────────────

const BASE_POKEMON_HIT = {
    type: 'pokemon',
    pokemon: 'Rowdy', move: 'High Horsepower', moveType: 'Ground', category: 'Physical',
    accRoll: 6, accModifier: 0, modifiedAccRoll: 6, moveAC: 2, acWasOverridden: false,
    isHit: true, isCrit: false, isStatus: false,
    dice: '4d12+16', rolls: [9, 12, 8, 8], diceTotal: 37, statBonus: 14, stabBonus: 4, total: 71,
    typeColor: 0xE2BF65,
    attackerCurrentHP: 35, attackerMaxHP: 50,
    activeStatuses: [],
    megaEvolved: false, megaFormName: null,
};

const BASE_POKEMON_MISS = {
    ...BASE_POKEMON_HIT,
    accRoll: 1, modifiedAccRoll: 1,
    isHit: false, isCrit: false,
    rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0,
};

const BASE_POKEMON_CRIT = {
    ...BASE_POKEMON_HIT,
    accRoll: 20, modifiedAccRoll: 20, isCrit: true,
    dice: '8d12+16', rolls: [9, 12, 8, 8, 10, 11, 7, 9], diceTotal: 74, total: 106,
};

const BASE_TRAINER_SKILL = {
    type: 'trainer_skill',
    skill: 'Perception', skillStat: 'WIS',
    rolls: [4, 6], modifier: 3, hasSkill: true, bonus: 5, total: 18,
    trainerCurrentHP: 45, trainerMaxHP: 50,
};

const BASE_HEAL = {
    type: 'heal',
    pokemon: 'Rowdy', item: 'Potion',
    formula: '2d6+5', rolls: [4, 6], bonus: 5, amount: 20,
    hpBefore: 25, hpAfter: 45, hpMax: 50,
};

const BASE_CUSTOM = {
    type: 'custom',
    dice: '2d6', rolls: [3, 5], rollTotal: 8, bonus: 2, total: 10,
};

// ── buildEmbed router ─────────────────────────────────────────

describe('buildEmbed', () => {
    it('routes pokemon type', () => {
        const e = buildEmbed(BASE_POKEMON_HIT, 'Ash');
        expect(e).not.toBeNull();
        expect(e.title).toContain('High Horsepower');
    });

    it('routes trainer_skill type', () => {
        const e = buildEmbed(BASE_TRAINER_SKILL, 'Ash');
        expect(e.title).toContain('Perception');
    });

    it('routes heal type', () => {
        const e = buildEmbed(BASE_HEAL, 'Ash');
        expect(e.title).toContain('Potion');
    });

    it('routes custom type', () => {
        const e = buildEmbed(BASE_CUSTOM, 'Ash');
        expect(e.title).toContain('2d6');
    });

    it('returns null for unknown type', () => {
        expect(buildEmbed({ type: 'unknown' }, 'Ash')).toBeNull();
    });
});

// ── Pokemon embeds ────────────────────────────────────────────

describe('buildPokemonEmbed — hit', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_HIT, 'Ash');

    it('title contains pokemon and move', () => {
        expect(embed.title).toContain('Rowdy');
        expect(embed.title).toContain('High Horsepower');
    });

    it('uses type color', () => {
        expect(embed.color).toBe(0xE2BF65);
    });

    it('description shows hit accuracy and type', () => {
        expect(embed.description).toContain('Hit');
        expect(embed.description).toContain('6');
        expect(embed.description).toContain('AC 2');
        expect(embed.description).toContain('Ground');
        expect(embed.description).toContain('Physical');
    });

    it('description shows damage total', () => {
        expect(embed.description).toContain('71 damage');
    });

    it('shows damage breakdown field', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField).toBeTruthy();
        expect(dmgField.value).toContain('14 (stat)');
        expect(dmgField.value).toContain('4 (STAB)');
        expect(dmgField.value).toContain('= 71');
    });

    it('shows HP bar field', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('35/50');
    });

    it('HP bar uses monospace block characters', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField.value).toMatch(/█/);
        expect(hpField.value).toMatch(/░/);
    });

    it('shows type matchup field', () => {
        const matchupField = embed.fields.find(f => f.name === 'Type Matchup');
        expect(matchupField).toBeTruthy();
        expect(matchupField.value).toContain('Electric');
        expect(matchupField.value).toContain('Flying');
    });

    it('no status field when no active statuses', () => {
        const fieldNames = embed.fields.map(f => f.name);
        expect(fieldNames).not.toContain('Status');
    });

    it('no mega field when not mega evolved', () => {
        const fieldNames = embed.fields.map(f => f.name);
        expect(fieldNames).not.toContain('Mega');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('no thumbnail when pokemonSpriteUrl is absent', () => {
        expect(embed.thumbnail).toBeUndefined();
    });
});

describe('buildPokemonEmbed — with sprite URL', () => {
    const roll  = { ...BASE_POKEMON_HIT, pokemonSpriteUrl: 'https://example.com/1.png' };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('thumbnail uses pokemonSpriteUrl', () => {
        expect(embed.thumbnail).toBeDefined();
        expect(embed.thumbnail.url).toBe('https://example.com/1.png');
    });

    // DataContext.sendToDiscord strips this thumbnail + the HP field only after a
    // composed battle-screen image successfully renders — buildPokemonEmbed itself
    // must always produce both, as the complete fallback when that image fails.
    it('still includes the HP field alongside the thumbnail (fallback contract)', () => {
        expect(embed.fields.find(f => f.name === 'Rowdy HP')).toBeTruthy();
    });
});

describe('buildPokemonEmbed — miss', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_MISS, 'Ash');

    it('description shows miss', () => {
        expect(embed.description).toContain('Miss');
    });

    it('uses gray color', () => {
        expect(embed.color).toBe(0x95A5A6);
    });

    it('has no damage field', () => {
        expect(embed.fields.find(f => f.name.includes('Damage'))).toBeUndefined();
    });

    it('still shows HP bar', () => {
        expect(embed.fields.find(f => f.name === 'Rowdy HP')).toBeTruthy();
    });
});

describe('buildPokemonEmbed — crit', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_CRIT, 'Ash');

    it('title has crit suffix', () => {
        expect(embed.title).toContain('CRITICAL HIT');
    });

    it('uses amber color', () => {
        expect(embed.color).toBe(0xFF6F00);
    });

    it('description shows Natural 20', () => {
        expect(embed.description).toContain('Natural 20');
    });

    it('damage field label mentions Crit', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField.name).toContain('Crit');
    });
});

describe('buildPokemonEmbed — status move hit', () => {
    const roll  = { ...BASE_POKEMON_HIT, isStatus: true, dice: null, rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('description shows effect applies', () => {
        expect(embed.description).toContain('applies');
    });

    it('no damage field', () => {
        expect(embed.fields.find(f => f.name.includes('Damage'))).toBeUndefined();
    });
});

describe('buildPokemonEmbed — with active statuses', () => {
    const roll  = { ...BASE_POKEMON_HIT, activeStatuses: ['burned', 'paralyzed'] };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows status field', () => {
        const sf = embed.fields.find(f => f.name === 'Status');
        expect(sf).toBeTruthy();
        expect(sf.value).toContain('Burned');
        expect(sf.value).toContain('Paralyzed');
    });
});

describe('buildPokemonEmbed — mega evolved', () => {
    const roll  = { ...BASE_POKEMON_HIT, megaEvolved: true, megaFormName: 'Mega Rayquaza' };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows mega field', () => {
        const mf = embed.fields.find(f => f.name === 'Mega');
        expect(mf).toBeTruthy();
        expect(mf.value).toBe('Mega Rayquaza');
    });
});

describe('buildPokemonEmbed — DM AC override', () => {
    const roll  = { ...BASE_POKEMON_HIT, acWasOverridden: true };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('description mentions DM', () => {
        expect(embed.description).toContain('DM');
    });
});

describe('buildPokemonEmbed — accuracy modifier', () => {
    const roll  = { ...BASE_POKEMON_HIT, accModifier: 2, modifiedAccRoll: 8 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('description shows modifier and modified roll', () => {
        expect(embed.description).toContain('+2');
        expect(embed.description).toContain('8');
    });
});

// ── Trainer skill embed ───────────────────────────────────────

describe('buildTrainerSkillEmbed', () => {
    const embed = buildTrainerSkillEmbed(BASE_TRAINER_SKILL, 'Ash');

    it('title contains skill name', () => {
        expect(embed.title).toContain('Perception');
    });

    it('description shows total', () => {
        expect(embed.description).toContain('18');
    });

    it('description shows rolls', () => {
        expect(embed.description).toContain('4');
        expect(embed.description).toContain('6');
    });

    it('description shows trained bonus when trained', () => {
        expect(embed.description).toContain('+5 trained');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('shows trainer HP bar', () => {
        const hpField = embed.fields.find(f => f.name === 'Trainer HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('45/50');
        expect(hpField.value).toMatch(/█/);
    });
});

// ── Heal embed ────────────────────────────────────────────────

describe('buildHealEmbed', () => {
    const embed = buildHealEmbed(BASE_HEAL, 'Ash');

    it('title contains pokemon and item', () => {
        expect(embed.title).toContain('Rowdy');
        expect(embed.title).toContain('Potion');
    });

    it('uses green color', () => {
        expect(embed.color).toBe(0x4CAF50);
    });

    it('description shows healed amount', () => {
        expect(embed.description).toContain('+20 HP');
    });

    it('description shows dice roll breakdown', () => {
        expect(embed.description).toContain('20');
        expect(embed.description).toContain('[4, 6]');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('shows before and after HP bars', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('25/50');
        expect(hpField.value).toContain('45/50');
    });

    it('marks Full when healed to max', () => {
        const fullHeal = { ...BASE_HEAL, hpAfter: 50 };
        const e = buildHealEmbed(fullHeal, 'Ash');
        expect(e.fields.find(f => f.name === 'Rowdy HP').value).toContain('Full');
    });

    it('does not mark Full when not at max', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField.value).not.toContain('Full');
    });
});

// ── Custom embed ──────────────────────────────────────────────

describe('buildCustomEmbed', () => {
    const embed = buildCustomEmbed(BASE_CUSTOM, 'Ash');

    it('title contains dice notation', () => {
        expect(embed.title).toContain('2d6');
    });

    it('description shows total', () => {
        expect(embed.description).toContain('10');
    });

    it('description shows rolls', () => {
        expect(embed.description).toContain('3');
    });

    it('description shows bonus when present', () => {
        expect(embed.description).toContain('+ 2');
    });

    it('no bonus in description when bonus is 0', () => {
        const e = buildCustomEmbed({ ...BASE_CUSTOM, bonus: 0 }, 'Ash');
        expect(e.description).not.toContain('+');
    });
});

// ── No-emoji regression guard ─────────────────────────────────
// Encodes the actual goal: embed text should read like plain battle-style
// copy (what the games themselves print), not emoji-decorated UI chrome.

describe('build*Embed — no decorative emoji', () => {
    // Deliberately excludes plain arrow/dash/dot punctuation (e.g. '→', '—', '·') that
    // the embeds use legitimately as text separators, not as emoji decoration.
    const EMOJI_RANGE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

    const BASE_STATUS_CURE = { type: 'status_cure', pokemon: 'Rowdy', item: 'Antidote', cured: 'Poisoned' };

    const BASE_CONTEST = {
        type: 'contest', pokemon: 'Rowdy', moveName: 'Tail Whip', contestType: 'Cute',
        rolls: [4, 5], bonus: 2, total: 11, contestDice: '2d6', contestEffect: 'Crowd cheers!',
    };

    const BASE_CONTEST_TURN = {
        contestType: 'Cool', round: 2, participantName: 'Rowdy', moveName: 'Flamethrower',
        appeal: 7, judgeIdx: 0, voltageChange: 1, newVoltage: 3, isSameMove: false, isMaxVoltage: false, effect: 'Nice!',
    };

    const BASE_CONTEST_RESULTS = {
        contestType: 'Smart',
        participants: [
            { name: 'Rowdy', rounds: [{ appeal: 7 }, { appeal: 8 }] },
            { name: 'Sparky', rounds: [{ appeal: 5 }, { appeal: 6 }] },
        ],
        getTotal: (p) => p.rounds.reduce((sum, r) => sum + r.appeal, 0),
    };

    const BASE_TRAINER_ATTACK = {
        type: 'trainer_attack', trainer: 'Ash', weapon: 'Poké Ball', weaponSource: 'thrown', db: 2,
        dice: '2d8+6', rolls: [5, 6], diceTotal: 11, diceBonus: 6, statMod: 2, statModLabel: 'ATK',
        isHit: true, isCrit: false, accRoll: 15, weaponAC: 10, total: 19,
        trainerCurrentHP: 40, trainerMaxHP: 50,
    };

    const fixtures = [
        ['buildPokemonEmbed (hit)', buildPokemonEmbed(BASE_POKEMON_HIT, 'Ash')],
        ['buildPokemonEmbed (miss)', buildPokemonEmbed(BASE_POKEMON_MISS, 'Ash')],
        ['buildPokemonEmbed (crit)', buildPokemonEmbed(BASE_POKEMON_CRIT, 'Ash')],
        ['buildPokemonEmbed (with status)', buildPokemonEmbed({ ...BASE_POKEMON_HIT, activeStatuses: ['burned', 'badlyPoisoned'] }, 'Ash')],
        ['buildTrainerSkillEmbed', buildTrainerSkillEmbed(BASE_TRAINER_SKILL, 'Ash')],
        ['buildHealEmbed', buildHealEmbed(BASE_HEAL, 'Ash')],
        ['buildStatusCureEmbed', buildStatusCureEmbed(BASE_STATUS_CURE, 'Ash')],
        ['buildCustomEmbed', buildCustomEmbed(BASE_CUSTOM, 'Ash')],
        ['buildContestEmbed', buildContestEmbed(BASE_CONTEST, 'Ash')],
        ['buildContestTurnEmbed', buildContestTurnEmbed(BASE_CONTEST_TURN)],
        ['buildContestResultsEmbed', buildContestResultsEmbed(BASE_CONTEST_RESULTS)],
        ['buildTrainerAttackEmbed', buildTrainerAttackEmbed(BASE_TRAINER_ATTACK, 'Ash')],
    ];

    it.each(fixtures)('%s contains no emoji characters', (_name, embed) => {
        expect(JSON.stringify(embed)).not.toMatch(EMOJI_RANGE);
    });
});
