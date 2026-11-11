// ============================================================
// DISCORD EMBED COLORS
// ============================================================
// Centralizes the decimal color ints used by src/utils/discordEmbeds.js.
// Derived from the app's own TYPE_COLORS/STAT_COLORS where a semantic match
// exists, so Discord embeds stay in sync with the app's palette.

import { STAT_COLORS } from './typeUtils.js';

/** Convert a CSS hex color string ("#RRGGBB") to the decimal int Discord's embed `color` field expects. */
export const hexToDiscordColor = (hex) => parseInt((hex || '#667eea').replace('#', ''), 16);

export const DISCORD_COLORS = {
    MISS: 0x95A5A6,
    CRIT: 0xFF6F00,
    DEFAULT_MOVE: 0xF5A623,
    SKILL: 0x667EEA,
    HEAL: hexToDiscordColor(STAT_COLORS.HP),
    STATUS_CURE: hexToDiscordColor(STAT_COLORS.SATK),
    TRAINER_ATTACK: 0xE53935,
    CUSTOM: 0x95A5A6,
};

export const CONTEST_COLORS_INT = {
    Cool: 0x2196F3, Beauty: 0xE91E63, Cute: 0xFF9800, Smart: 0x4CAF50, Tough: 0x795548,
};
