// ============================================================
// DataContext Tests — import/migration path
// ============================================================
// Covers importData()'s full-backup and single-trainer branches: legacy
// field migration (pokemon[] -> party/reserve split, class/advancedClass ->
// classes[], skills[] -> skills{}), the sanitizeImportedTrainer() wiring
// (previously only exercised in isolation via exportUtils.test.js, not
// through this actual import entry point), and the existing-progress
// confirm gate.
//
// Renders the real provider chain DataContext depends on (UI > Modal >
// GameData > Trainer > Data), same pattern as PokemonContext.test.jsx.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { UIProvider } from '../UIContext.jsx';
import { ModalProvider, useModal } from '../ModalContext.jsx';
import { GameDataProvider, useGameData } from '../GameDataContext.jsx';
import { TrainerProvider, useTrainerContext } from '../TrainerContext.jsx';
import { DataProvider, useData } from '../DataContext.jsx';

vi.mock('../../data/pokedexLoader.js', () => ({
    loadPokedexFromGitHub: vi.fn((setPokedex, setPokedexLoading) => {
        setPokedex([]);
        setPokedexLoading(false);
        return Promise.resolve();
    }),
}));

vi.mock('../../data/gameDataLoader.js', () => ({
    gameDataLoadPromise: Promise.resolve(true),
}));

const wrapper = ({ children }) => (
    <UIProvider>
        <ModalProvider>
            <GameDataProvider>
                <TrainerProvider>
                    <DataProvider>{children}</DataProvider>
                </TrainerProvider>
            </GameDataProvider>
        </ModalProvider>
    </UIProvider>
);

const renderAll = () => renderHook(() => ({
    data: useData(),
    trainer: useTrainerContext(),
    modal: useModal(),
    gameData: useGameData(),
}), { wrapper });

/** A File whose FileReader.readAsText() result is `obj` as JSON — mirrors the real import flow. */
const jsonFile = (obj) => new File([JSON.stringify(obj)], 'backup.json', { type: 'application/json' });

// DataContext auto-loads from localStorage['pta-enhanced-save-data'] on mount and
// debounce-autosaves back to it (AUTOSAVE_DEBOUNCE_MS). Without unmounting between
// tests, a prior test's pending autosave timer can fire mid-test and leave stale data
// for the next test's fresh mount to load — explicit cleanup() cancels those pending
// effects, and clearing localStorage guards against anything that still slips through.
beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('importData — full-backup path (data.trainers)', () => {
    it('applies immediately (no confirm) when there is no existing progress to lose, and sanitizes HTML out of name/notes', async () => {
        const { result } = renderAll();

        act(() => {
            result.current.data.importData(jsonFile({
                trainers: [{
                    id: 1, name: '<b>Ash</b>', notes: '<script>alert(1)</script>Gym notes',
                    party: [], reserve: [],
                }],
                activeTrainerId: 1,
            }));
        });

        // The default trainer array already has length 1 before the import (a fresh
        // app always starts with one default trainer) — waiting on array length alone
        // would pass instantly on that pre-import state, before the async FileReader
        // callback actually runs. Wait on the imported id instead, which only appears
        // post-import.
        await waitFor(() => {
            expect(result.current.trainer.trainers[0].id).toBe(1);
        });
        expect(result.current.modal.confirmModal.show).toBe(false);
        expect(result.current.trainer.trainers[0].name).toBe('Ash');
        expect(result.current.trainer.trainers[0].notes).not.toContain('<script>');
    });

    it('splits a legacy flat pokemon[] array into party (first 6) and reserve (the rest)', async () => {
        const { result } = renderAll();
        const pokemon = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, species: 'Rattata', name: `Mon${i + 1}` }));

        act(() => {
            result.current.data.importData(jsonFile({
                trainers: [{ id: 1, name: 'Ash', pokemon }],
                activeTrainerId: 1,
            }));
        });

        await waitFor(() => expect(result.current.trainer.trainers[0].id).toBe(1));
        expect(result.current.trainer.trainers[0].party).toHaveLength(6);
        expect(result.current.trainer.trainers[0].reserve).toHaveLength(2);
        expect(result.current.trainer.trainers[0].party[0].name).toBe('Mon1');
        expect(result.current.trainer.trainers[0].reserve[0].name).toBe('Mon7');
    });

    it('requires confirmation before replacing data when the current trainer already has progress, and does nothing until confirmed', async () => {
        const { result } = renderAll();

        // Give the default trainer some progress so hasExistingProgress is true.
        act(() => result.current.trainer.setParty([{ id: 'p1', species: 'Bulbasaur', name: 'Bulby' }]));
        const originalTrainerId = result.current.trainer.trainers[0].id;

        act(() => {
            result.current.data.importData(jsonFile({
                trainers: [{ id: 999, name: 'NewTrainer', party: [], reserve: [] }],
                activeTrainerId: 999,
            }));
        });

        // The confirm prompt is raised from inside the async FileReader callback, not
        // synchronously from the importData() call itself — wait for it rather than
        // asserting immediately.
        await waitFor(() => expect(result.current.modal.confirmModal.show).toBe(true));
        expect(result.current.trainer.trainers[0].id).toBe(originalTrainerId);

        act(() => result.current.modal.confirmModal.onConfirm());

        await waitFor(() => {
            expect(result.current.trainer.trainers[0].name).toBe('NewTrainer');
        });
    });
});

describe('importData — single-trainer path (data.trainer)', () => {
    it('migrates legacy class/advancedClass fields into a classes[] array', async () => {
        const { result } = renderAll();

        act(() => {
            result.current.data.importData(jsonFile({
                trainer: { id: 1, name: 'Ash', class: 'Ace Trainer', advancedClass: 'Pokémon Ranger', party: [], reserve: [] },
            }));
        });

        await waitFor(() => {
            expect(result.current.trainer.trainers[0].classes).toEqual(['Ace Trainer', 'Pokémon Ranger']);
        });
    });

    it('sanitizes HTML out of the imported trainer\'s name, same as the full-backup path', async () => {
        const { result } = renderAll();

        act(() => {
            result.current.data.importData(jsonFile({
                trainer: { id: 1, name: '<img src=x onerror=alert(1)>Misty', party: [], reserve: [] },
            }));
        });

        await waitFor(() => {
            expect(result.current.trainer.trainers[0].name).toBe('Misty');
        });
        expect(result.current.trainer.trainers[0].name).not.toContain('<img');
    });

    it('falls back to a top-level pokemon[] array for party/reserve when the trainer object has none', async () => {
        const { result } = renderAll();
        const pokemon = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, species: 'Rattata', name: `Mon${i + 1}` }));

        act(() => {
            result.current.data.importData(jsonFile({
                trainer: { id: 1, name: 'Ash' },
                pokemon,
            }));
        });

        await waitFor(() => {
            expect(result.current.trainer.trainers[0].party).toHaveLength(6);
        });
        expect(result.current.trainer.trainers[0].reserve).toHaveLength(1);
    });
});
