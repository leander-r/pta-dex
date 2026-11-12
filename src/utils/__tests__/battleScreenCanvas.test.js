import { describe, it, expect } from 'vitest';
import { pickHpBarColor } from '../battleScreenCanvas.js';

// Real Canvas2D rendering isn't exercised here — jsdom's canvas getContext('2d')
// returns null (no `canvas` package/polyfill installed in this project), so
// renderBattleScreenImage itself can't produce real pixels in this test
// environment. This covers the one piece of genuinely pure, directly testable
// logic: the HP bar color thresholds, which must mirror discordEmbeds.js's
// existing hpBar bands exactly (that's the function this module's HUD replaces).

describe('pickHpBarColor', () => {
    it('is green above 66%', () => {
        expect(pickHpBarColor(67, 100)).toBe('#4CAF50');
        expect(pickHpBarColor(100, 100)).toBe('#4CAF50');
    });

    it('is yellow between 34% and 66% inclusive of the boundary', () => {
        expect(pickHpBarColor(66, 100)).toBe('#FFC107');
        expect(pickHpBarColor(34, 100)).toBe('#FFC107');
    });

    it('is red between 1% and 33% inclusive of the boundary', () => {
        expect(pickHpBarColor(33, 100)).toBe('#F44336');
        expect(pickHpBarColor(1, 100)).toBe('#F44336');
    });

    it('is null (empty) at exactly 0%', () => {
        expect(pickHpBarColor(0, 100)).toBeNull();
    });

    it('is null when max is 0 (no HP tracked)', () => {
        expect(pickHpBarColor(0, 0)).toBeNull();
    });

    it('clamps current above max to the green band', () => {
        expect(pickHpBarColor(150, 100)).toBe('#4CAF50');
    });
});
