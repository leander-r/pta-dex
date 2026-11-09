// ============================================================
// GameDataContext Tests
// ============================================================
// Network-backed loaders (pokedex fetch + GAME_DATA fetch) are mocked so these
// tests are deterministic and don't hit the network or IndexedDB.

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { GameDataProvider, useGameData } from '../GameDataContext.jsx';

const MOCK_POKEDEX = [
    { species: 'Bulbasaur', id: 1, types: ['Grass', 'Poison'], levelUpMoves: [{ move: 'Tackle', level: 1 }, { move: 'Vine Whip', level: 5 }, { move: 'Razor Leaf', level: 10 }] },
    { species: 'Charmander', id: 4, types: ['Fire'], levelUpMoves: [{ move: 'Scratch', level: 1 }] },
];

vi.mock('../../data/pokedexLoader.js', () => ({
    loadPokedexFromGitHub: vi.fn((setPokedex, setPokedexLoading) => {
        setPokedex(MOCK_POKEDEX);
        setPokedexLoading(false);
        return Promise.resolve();
    }),
}));

vi.mock('../../data/gameDataLoader.js', () => ({
    gameDataLoadPromise: Promise.resolve(true),
}));

const wrapper = ({ children }) => <GameDataProvider>{children}</GameDataProvider>;
const renderGameData = () => renderHook(() => useGameData(), { wrapper });

describe('GameDataContext', () => {
    it('loads the mocked pokedex and clears the loading flag', async () => {
        const { result } = renderGameData();
        await waitFor(() => expect(result.current.pokedexLoading).toBe(false));
        expect(result.current.pokedex).toHaveLength(2);
    });

    describe('filteredSpecies', () => {
        it('returns the full pokedex with no search term', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));
            expect(result.current.filteredSpecies).toHaveLength(2);
        });

        it('filters by species name, type, or dex number', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));

            act(() => result.current.setSpeciesSearch('char'));
            expect(result.current.filteredSpecies.map(p => p.species)).toEqual(['Charmander']);

            act(() => result.current.setSpeciesSearch('poison'));
            expect(result.current.filteredSpecies.map(p => p.species)).toEqual(['Bulbasaur']);

            act(() => result.current.setSpeciesSearch('4'));
            expect(result.current.filteredSpecies.map(p => p.species)).toEqual(['Charmander']);
        });
    });

    describe('getLevelUpMovesForSpecies', () => {
        it('prefers a custom species entry over the pokedex when both exist', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));

            act(() => result.current.setCustomSpecies([
                { species: 'Bulbasaur', levelUpMoves: [{ move: 'Custom Move', level: 1 }] },
            ]));

            expect(result.current.getLevelUpMovesForSpecies('Bulbasaur')).toEqual([{ move: 'Custom Move', level: 1 }]);
        });

        it('falls back to the pokedex when there is no matching custom species', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));
            expect(result.current.getLevelUpMovesForSpecies('Charmander')).toEqual([{ move: 'Scratch', level: 1 }]);
        });
    });

    describe('getMovesForLevelRange', () => {
        it('returns moves learned leveling up between two levels (exclusive/inclusive)', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));

            const moves = result.current.getMovesForLevelRange('Bulbasaur', 1, 10);
            expect(moves.map(m => m.move)).toEqual(['Vine Whip', 'Razor Leaf']);
        });

        it('returns the same set of moves when leveling down across that range', async () => {
            const { result } = renderGameData();
            await waitFor(() => expect(result.current.pokedexLoading).toBe(false));

            const moves = result.current.getMovesForLevelRange('Bulbasaur', 10, 1);
            expect(moves.map(m => m.move)).toEqual(['Vine Whip', 'Razor Leaf']);
        });
    });
});
