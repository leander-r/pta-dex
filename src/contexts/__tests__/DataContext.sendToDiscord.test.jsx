// ============================================================
// DataContext.sendToDiscord Tests
// ============================================================
// Sibling context hooks are mocked directly (same pattern as GameDataContext's
// own tests) so DataProvider can mount without a full provider stack. Scope is
// narrow: just the three-way branch in sendToDiscord that decides whether to
// post a composed battle-screen image, a data-URL avatar attachment, or plain
// JSON — not the rest of DataContext's save/load/import surface.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { DataProvider, useData } from '../DataContext.jsx';

vi.mock('../UIContext.jsx', () => ({
    useUI: () => ({ triggerSaveIndicator: vi.fn() }),
}));
vi.mock('../ModalContext.jsx', () => ({
    useModal: () => ({ showConfirm: vi.fn() }),
}));
vi.mock('../TrainerContext.jsx', () => ({
    useTrainerContext: () => ({
        trainers: [], setTrainers: vi.fn(), activeTrainerId: null, setActiveTrainerId: vi.fn(),
    }),
}));
vi.mock('../GameDataContext.jsx', () => ({
    useGameData: () => ({ customSpecies: [], setCustomSpecies: vi.fn(), pokedex: [] }),
}));

const mockRenderBattleScreenImage = vi.fn();
vi.mock('../../utils/battleScreenCanvas.js', () => ({
    renderBattleScreenImage: (...args) => mockRenderBattleScreenImage(...args),
}));

const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;

const POKEMON_ROLL = {
    type: 'pokemon', pokemon: 'Rowdy', move: 'Tackle', moveType: 'Normal', category: 'Physical',
    accRoll: 10, accModifier: 0, modifiedAccRoll: 10, moveAC: 2, acWasOverridden: false,
    isHit: true, isCrit: false, isStatus: false,
    dice: '2d6', rolls: [3, 4], diceTotal: 7, statBonus: 0, stabBonus: 0, total: 7,
    typeColor: 0xA8A878, attackerCurrentHP: 20, attackerMaxHP: 30, activeStatuses: [],
};

beforeEach(() => {
    localStorage.setItem('pta-discord-webhook', JSON.stringify({
        url: 'https://discord.test/api/webhooks/1/abc', enabled: true, showSettings: false,
    }));
    mockRenderBattleScreenImage.mockReset();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
});

afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('DataContext.sendToDiscord', () => {
    it('posts a multipart FormData with the rendered image for a pokemon roll', async () => {
        const blob = new Blob(['fake-png'], { type: 'image/png' });
        mockRenderBattleScreenImage.mockResolvedValue(blob);

        const { result } = renderHook(() => useData(), { wrapper });
        await waitFor(() => expect(result.current).toBeDefined());

        await result.current.sendToDiscord(POKEMON_ROLL, 'Ash');

        expect(mockRenderBattleScreenImage).toHaveBeenCalledWith(POKEMON_ROLL);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, options] = global.fetch.mock.calls[0];
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.body.get('files[0]')).toBeInstanceOf(Blob);
        const sentPayload = JSON.parse(options.body.get('payload_json'));
        expect(sentPayload.embeds[0].image.url).toBe('attachment://battle.png');
        expect(sentPayload.embeds[0].thumbnail).toBeUndefined();
        expect(sentPayload.embeds[0].fields.find(f => f.name === 'Rowdy HP')).toBeUndefined();
    });

    it('falls back to plain JSON when image composition resolves null', async () => {
        mockRenderBattleScreenImage.mockResolvedValue(null);

        const { result } = renderHook(() => useData(), { wrapper });
        await waitFor(() => expect(result.current).toBeDefined());

        await result.current.sendToDiscord(POKEMON_ROLL, 'Ash');

        expect(mockRenderBattleScreenImage).toHaveBeenCalled();
        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(typeof options.body).toBe('string');
    });

    it('never calls renderBattleScreenImage for a non-pokemon roll type', async () => {
        const { result } = renderHook(() => useData(), { wrapper });
        await waitFor(() => expect(result.current).toBeDefined());

        await result.current.sendToDiscord({ type: 'custom', dice: '1d20', rolls: [15], bonus: 0, total: 15 }, 'Ash');

        expect(mockRenderBattleScreenImage).not.toHaveBeenCalled();
        const [, options] = global.fetch.mock.calls[0];
        expect(typeof options.body).toBe('string');
    });
});
