// ============================================================
// Discord Embed Builders
// ============================================================
// Shared logic for building rich Discord embeds from roll data.

import { DISCORD_COLORS, CONTEST_COLORS_INT } from './discordColors.js';
import { getOffensiveEffectiveness } from '../data/typeChart.js';

// Pokémon-game-style coloured HP bar using square emoji — unlike the ANSI
// escape codes this used to rely on, emoji render identically on every
// Discord client (desktop, mobile, web), so there's no code-block fallback
// to worry about.
// Green ≥ 66 %  |  Yellow ≥ 33 %  |  Red > 0 %  |  Empty at 0 %
const hpBar = (current, max, blocks = 10) => {
    const pct    = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    const filled = Math.round(pct * blocks);
    const fillEmoji = pct > 0.66 ? '🟩' : pct > 0.33 ? '🟨' : pct > 0 ? '🟥' : '⬛';
    return `${fillEmoji.repeat(filled)}${'⬛'.repeat(blocks - filled)}`;
};

// HP bar + "current/max" label, flagging a low-HP warning at/below 25%.
const hpFieldValue = (current, max) => {
    const pct = max > 0 ? current / max : 0;
    const warning = pct > 0 && pct <= 0.25 ? ' ⚠️ Critical!' : '';
    return `${hpBar(current, max)} ${current}/${max}${warning}`;
};

const STATUS_EMOJI = {
    burned: '🔥', frozen: '🧊', paralyzed: '⚡', poisoned: '☠️',
    asleep: '💤', confused: '💫', flinched: '😵', fainted: '✖️',
};

// Summarizes a move's offensive type chart as a compact field — turns the
// "apply type effectiveness yourself" disclaimer into actual usable info.
const typeMatchupField = (moveType) => {
    const { superEffective, notVeryEffective, noEffect } = getOffensiveEffectiveness(moveType);
    if (!superEffective.length && !notVeryEffective.length && !noEffect.length) return null;

    const lines = [];
    if (superEffective.length)   lines.push(`⬆️ Super: ${superEffective.join(', ')}`);
    if (notVeryEffective.length) lines.push(`⬇️ Weak: ${notVeryEffective.join(', ')}`);
    if (noEffect.length)         lines.push(`🚫 No effect: ${noEffect.join(', ')}`);

    return { name: '🧭 Type Matchup', value: lines.join('\n'), inline: true };
};

export const buildPokemonEmbed = (roll, trainerName) => {
    const hit  = roll.isHit;
    const crit = roll.isCrit;
    const miss = !hit;

    const icon   = miss ? '❌' : crit ? '💥' : roll.isStatus ? '✨' : '⚔️';
    const suffix = crit ? ' — CRITICAL HIT!' : '';
    const title  = `${icon} ${roll.pokemon} used ${roll.move}!${suffix}`;
    const color  = miss ? DISCORD_COLORS.MISS : crit ? DISCORD_COLORS.CRIT : (roll.typeColor || DISCORD_COLORS.DEFAULT_MOVE);

    // One-line battle summary as description
    const acOverride = roll.acWasOverridden ? ' *(DM)*' : '';
    const modStr = roll.accModifier !== 0
        ? ` ${roll.accModifier > 0 ? '+' : ''}${roll.accModifier} = ${roll.modifiedAccRoll}`
        : '';
    const typeStr = `${roll.moveType} · ${roll.category}`;

    const critLabel = roll.critThreshold && roll.critThreshold < 20
        ? `Natural ${roll.accRoll}! (Crit on ${roll.critThreshold}–20)`
        : `Natural ${roll.accRoll}!`;

    let description;
    if (crit) {
        const dmgStr = roll.total ? ` · **${roll.total} damage**` : '';
        description = `🎯 ${critLabel} vs AC ${roll.moveAC}${acOverride} · ${typeStr}${dmgStr}`;
    } else if (roll.isStatus) {
        description = `${hit ? '✅ Hit' : '✗ Miss'} · Roll ${roll.accRoll}${modStr} vs AC ${roll.moveAC}${acOverride} · ${typeStr} · ${hit ? 'Effect applies!' : 'No effect'}`;
    } else if (miss) {
        description = `✗ Miss · Roll ${roll.accRoll}${modStr} vs AC ${roll.moveAC}${acOverride} · ${typeStr}`;
    } else {
        const dmgStr = roll.total ? ` · **${roll.total} damage**` : '';
        description = `✅ Hit · Roll ${roll.accRoll}${modStr} vs AC ${roll.moveAC}${acOverride} · ${typeStr}${dmgStr}`;
    }

    const fields = [];

    // Damage breakdown (any hit that rolled dice, including status-category moves with damage)
    if (hit && roll.dice) {
        const diceBonus = roll.diceBonus ?? 0;
        const parts = [`[${roll.rolls.join(', ')}] = ${roll.diceTotal}`];
        if (diceBonus)      parts.push(`${diceBonus} (base)`);
        if (roll.statBonus) parts.push(`${roll.statBonus} (stat)`);
        if (roll.stabBonus) parts.push(`${roll.stabBonus} (STAB)`);
        const formula = parts.join(' + ');
        const notation = diceBonus ? `${roll.dice}+${diceBonus}` : roll.dice;
        fields.push({
            name: crit ? '🎲 Damage (Crit — double dice)' : '🎲 Damage',
            value: `\`${notation}: ${formula} = ${roll.total}\``,
            inline: false,
        });
    }

    // Effect field for status-category moves that also deal damage
    if (hit && roll.category === 'Status' && roll.dice) {
        fields.push({ name: '✨ Effect', value: 'Applies!', inline: true });
    }

    // Move's rules text — same "Target / Effect" + "Description" split shown in the app's
    // own move-detail popup (DetailModal.jsx), so Discord readers get the same info without
    // needing to alt-tab back to the app to see what the move actually does.
    if (roll.moveEffect) {
        fields.push({ name: '🎯 Target / Effect', value: roll.moveEffect, inline: false });
    }
    if (roll.moveDescription) {
        fields.push({ name: '📖 Description', value: roll.moveDescription, inline: false });
    }

    // Active combat stages relevant to this roll (non-zero only)
    if (roll.relevantStages?.length > 0) {
        const ordinal = n => {
            const i = Number(n); // guard against string values from old history entries
            const s = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
            return `${i}${s}`;
        };
        const stageStr = roll.relevantStages.filter(s => s.stage != null && s.stage !== 0).map(({ label, stage, bonus, base, boosted, isFlat }) => {
            const stageNum  = Number(stage);
            const abs       = Math.abs(stageNum);
            const sign      = stageNum >= 0 ? '+' : '−';
            const bonusSign = bonus >= 0 ? '+' : '−';
            const bonusAbs  = Math.abs(bonus);
            if (isFlat) {
                return `**${label}** ${sign}${ordinal(abs)} Combat Stage = ${bonusSign}${bonusAbs} to roll`;
            }
            return `**${label}** ${sign}${ordinal(abs)} Combat Stage = ${base} ${bonusSign} ${bonusAbs} = **${boosted}**`;
        }).join('\n');
        fields.push({ name: '📊 Combat Stages', value: stageStr, inline: false });
    }

    // Attacker HP bar
    if (roll.attackerMaxHP > 0) {
        fields.push({
            name: `${roll.pokemon} HP`,
            value: hpFieldValue(roll.attackerCurrentHP, roll.attackerMaxHP),
            inline: false,
        });
    }

    // Type matchup chart for the move (only meaningful once it's landed/dealt damage)
    if (hit && roll.dice && roll.moveType) {
        const matchup = typeMatchupField(roll.moveType);
        if (matchup) fields.push(matchup);
    }

    // Status conditions
    if (roll.activeStatuses?.length > 0) {
        fields.push({
            name: 'Status',
            value: roll.activeStatuses.map(s => `${STATUS_EMOJI[s] || '•'} ${s}`).join('  '),
            inline: true,
        });
    }

    // Status penalties (burn/poison/paralysis stat modifiers)
    if (roll.statusPenalties?.length > 0) {
        fields.push({
            name: '⚠️ Status Penalties',
            value: roll.statusPenalties.map(p => `**${p.status}**: ${p.penalty}`).join('\n'),
            inline: true,
        });
    }

    // Mega form
    if (roll.megaEvolved && roll.megaFormName) {
        fields.push({ name: 'Mega', value: roll.megaFormName, inline: true });
    }

    const embed = {
        author: { name: trainerName },
        title,
        description,
        color,
        fields,
        timestamp: new Date().toISOString(),
    };

    // PHB2's damage steps 3-4 (defender's Defense/Sp.Def, then Weakness/Resistance) aren't
    // applied here — the app doesn't track an opposing Pokémon's stats/types, so this is
    // still a manual step for whoever's tracking the target. Now that the move's own type
    // chart is a field above, this just needs to flag the missing Defense step.
    if (hit && roll.dice) {
        embed.footer = { text: "⚠ Before target's Defense" };
    }

    // On a crit, promote the sprite from a small thumbnail to a large image so the
    // moment actually stands out instead of just getting a different title/color.
    if (roll.pokemonSpriteUrl) {
        if (crit) embed.image = { url: roll.pokemonSpriteUrl };
        else embed.thumbnail = { url: roll.pokemonSpriteUrl };
    }

    return embed;
};

export const buildTrainerSkillEmbed = (roll, trainerName) => {
    // Untrained skills apply no stat bonus at all (total = plain 1d20) — showing the raw
    // stat modifier unconditionally implied it was added when it wasn't. And showing it
    // alongside "+{bonus} trained" double-counted the modifier for every trained roll: the
    // stored bonus already folds the modifier in (Rank 1 = 2+mod, Rank 2 = 4+2×mod), so
    // "+2 ATK · +4 trained" read as rollTotal+2+4 when the real total only adds +4.
    const trainedStr = roll.hasSkill && roll.bonus > 0
        ? ` · +${roll.bonus} trained (stat ${roll.modifier >= 0 ? '+' : ''}${roll.modifier} ${roll.skillStat})`
        : '';
    const description = `**Total: ${roll.total}** · [${roll.rolls.join(', ')}]${trainedStr}`;

    const fields = [];
    if (roll.trainerMaxHP > 0) {
        fields.push({
            name: 'Trainer HP',
            value: hpFieldValue(roll.trainerCurrentHP, roll.trainerMaxHP),
            inline: false,
        });
    }

    const embed = {
        author: { name: trainerName },
        title: `📚 ${roll.skill} Check`,
        description,
        color: DISCORD_COLORS.SKILL,
        fields,
        timestamp: new Date().toISOString(),
    };
    if (roll.trainerAvatarUrl) embed.thumbnail = { url: roll.trainerAvatarUrl };
    return embed;
};

export const buildHealEmbed = (roll, trainerName) => {
    let description = `**+${roll.amount} HP** healed`;
    if (roll.rolls?.length > 0) {
        const bonusPart = roll.bonus > 0 ? ` + ${roll.bonus}` : '';
        description += ` · ${roll.formula}: [${roll.rolls.join(', ')}]${bonusPart} = ${roll.amount}`;
    } else if (roll.formula) {
        description += ` · ${roll.formula}`;
    }

    const fields = [];
    if (roll.hpMax > 0) {
        const barBefore = hpBar(roll.hpBefore ?? roll.hpAfter, roll.hpMax);
        const barAfter  = hpBar(roll.hpAfter  ?? roll.hpBefore, roll.hpMax);
        const fullMark  = roll.hpAfter >= roll.hpMax ? ' ✨ Full!' : '';
        fields.push({
            name: `${roll.pokemon} HP`,
            value: `Before ${barBefore} ${roll.hpBefore}/${roll.hpMax}\nAfter  ${barAfter} ${roll.hpAfter}/${roll.hpMax}${fullMark}`,
            inline: false,
        });
    }

    const embed = {
        author: { name: trainerName },
        title: `🩹 ${roll.pokemon} used ${roll.item}`,
        description,
        color: DISCORD_COLORS.HEAL,
        fields,
        timestamp: new Date().toISOString(),
    };

    if (roll.pokemonSpriteUrl) {
        embed.thumbnail = { url: roll.pokemonSpriteUrl };
    }

    return embed;
};

export const buildStatusCureEmbed = (roll, trainerName) => {
    const embed = {
        author: { name: trainerName },
        title: `✨ ${roll.pokemon} used ${roll.item}`,
        description: `**Cured:** ${roll.cured}`,
        color: DISCORD_COLORS.STATUS_CURE,
        timestamp: new Date().toISOString(),
    };
    if (roll.pokemonSpriteUrl) {
        embed.thumbnail = { url: roll.pokemonSpriteUrl };
    }
    return embed;
};

export const buildContestEmbed = (roll, trainerName) => {
    const bonusStr = roll.bonus ? ` ${roll.bonus > 0 ? '+' : ''}${roll.bonus}` : '';
    const color = CONTEST_COLORS_INT[roll.contestType] || DISCORD_COLORS.SKILL;
    let description = `🎲 [${(roll.rolls || []).join(', ')}]${bonusStr} = **${roll.total}**`;
    if (roll.contestEffect) description += `\n*${roll.contestEffect}*`;
    return {
        author: { name: trainerName },
        title: `🎭 ${roll.pokemon} — ${roll.moveName}`,
        description,
        color,
        footer: roll.contestType ? { text: `${roll.contestType} Appeal · ${roll.contestDice}` } : undefined,
        timestamp: new Date().toISOString(),
    };
};

// Posted by GM after each appeal turn in ContestRunner
export const buildContestTurnEmbed = ({ contestType, round, participantName, moveName, appeal, judgeIdx, voltageChange, newVoltage, isSameMove, isMaxVoltage, effect }) => {
    const color = CONTEST_COLORS_INT[contestType] || DISCORD_COLORS.SKILL;
    const CONTEST_ICONS = { Cool: '😎', Beauty: '💎', Cute: '🌸', Smart: '🔮', Tough: '💪' };
    const icon = CONTEST_ICONS[contestType] || '🎭';

    let description;
    if (isSameMove) {
        description = `**${participantName}** repeated **${moveName}** — **0 appeal** (same move penalty)`;
    } else {
        description = `**${participantName}** used **${moveName}** → **${appeal} appeal**`;
        if (effect) description += `\n*${effect}*`;
    }

    const fields = [];
    if (judgeIdx != null) {
        let judgeVal = `Judge ${judgeIdx + 1} · Voltage now **${newVoltage}**`;
        if (voltageChange > 0) judgeVal += ' ⚡▲';
        if (voltageChange < 0) judgeVal += ' ⚡▼';
        if (isMaxVoltage) judgeVal += ' 🔥 MAX VOLTAGE!';
        fields.push({ name: 'Judge', value: judgeVal, inline: true });
    }

    return {
        title: `${icon} Round ${round} Appeal`,
        description,
        color,
        fields,
        footer: { text: `${contestType} Contest` },
        timestamp: new Date().toISOString(),
    };
};

// Posted by GM at the end of a contest
export const buildContestResultsEmbed = ({ contestType, participants, getTotal }) => {
    const color = CONTEST_COLORS_INT[contestType] || DISCORD_COLORS.SKILL;
    const CONTEST_ICONS = { Cool: '😎', Beauty: '💎', Cute: '🌸', Smart: '🔮', Tough: '💪' };
    const icon = CONTEST_ICONS[contestType] || '🎭';
    const sorted = [...participants].sort((a, b) => getTotal(b) - getTotal(a));
    const medals = ['🥇', '🥈', '🥉'];

    const fields = sorted.map((p, idx) => {
        const rounds = p.rounds.map((r, i) => `R${i + 1}:${r.appeal}`).join('  ');
        return {
            name: `${medals[idx] || `#${idx + 1}`} ${p.name}`,
            value: `**${getTotal(p)} total** · ${rounds}`,
            inline: false,
        };
    });

    return {
        title: `🏆 ${icon} ${contestType} Contest — Final Results`,
        description: `Winner: **${sorted[0]?.name}** with **${getTotal(sorted[0] || {})} appeal**!`,
        color,
        fields,
        timestamp: new Date().toISOString(),
    };
};

export const buildTrainerAttackEmbed = (roll, trainerName) => {
    const hitStr = roll.isCrit ? '⚡ CRITICAL HIT!' : roll.isHit ? 'Hit!' : 'Miss!';
    let description;
    if (roll.isHit) {
        const parts = [`[${roll.rolls.join(', ')}] = ${roll.diceTotal}`];
        if ((roll.diceBonus ?? 0) > 0) parts.push(`+${roll.diceBonus} (base)`);
        if (roll.statMod !== 0) parts.push(`${roll.statMod > 0 ? '+' : ''}${roll.statMod} (${roll.statModLabel})`);
        description = `**${hitStr}** · AC roll: **${roll.accRoll}** vs AC ${roll.weaponAC}\n**${roll.total} damage** · ${parts.join(' ')}`;
    } else {
        description = `**Miss!** · AC roll: **${roll.accRoll}** vs AC ${roll.weaponAC}`;
    }

    const fields = [];
    if (roll.trainerMaxHP > 0) {
        fields.push({ name: 'Trainer HP', value: hpFieldValue(roll.trainerCurrentHP, roll.trainerMaxHP), inline: false });
    }
    fields.push({ name: 'Weapon', value: `${roll.weapon} (${roll.weaponSource}) · DB${roll.db}: ${roll.dice}`, inline: false });

    const embed = {
        author: { name: trainerName },
        title: `⚔ ${roll.trainer} — ${roll.weapon}`,
        description,
        color: DISCORD_COLORS.TRAINER_ATTACK,
        fields,
        timestamp: new Date().toISOString(),
    };
    if (roll.isHit) embed.footer = { text: "⚠ Before target's Defense" };
    if (roll.trainerAvatarUrl) embed.thumbnail = { url: roll.trainerAvatarUrl };
    return embed;
};

export const buildCustomEmbed = (roll, trainerName) => {
    const bonusStr = roll.bonus ? ` + ${roll.bonus}` : '';
    return {
        author: { name: trainerName },
        title: `🎲 Custom Roll: ${roll.dice}`,
        description: `[${roll.rolls.join(', ')}]${bonusStr} = **${roll.total}**`,
        color: DISCORD_COLORS.CUSTOM,
        timestamp: new Date().toISOString(),
    };
};

export const buildEmbed = (roll, trainerName) => {
    if (roll.type === 'pokemon')       return buildPokemonEmbed(roll, trainerName);
    if (roll.type === 'trainer_skill')  return buildTrainerSkillEmbed(roll, trainerName);
    if (roll.type === 'trainer_attack') return buildTrainerAttackEmbed(roll, trainerName);
    if (roll.type === 'heal')           return buildHealEmbed(roll, trainerName);
    if (roll.type === 'status_cure')    return buildStatusCureEmbed(roll, trainerName);
    if (roll.type === 'custom')        return buildCustomEmbed(roll, trainerName);
    if (roll.type === 'contest')       return buildContestEmbed(roll, trainerName);
    return null;
};
