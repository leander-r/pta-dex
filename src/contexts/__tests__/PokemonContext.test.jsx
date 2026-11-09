// ============================================================
// PokemonContext Tests
// ============================================================
// Network-backed loaders are mocked (see GameDataContext.test.jsx) so these
// tests are deterministic. Renders the real provider chain PokemonContext
// actually depends on (UI > Modal > GameData > Trainer > Data > Pokemon)
// rather than hand-isolating it, since its logic is genuinely cross-context.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { UIProvider } from '../UIContext.jsx';
import { ModalProvider, useModal } from '../ModalContext.jsx';
import { GameDataProvider, useGameData } from '../GameDataContext.jsx';
import { TrainerProvider, useTrainerContext } from '../TrainerContext.jsx';
import { DataProvider } from '../DataContext.jsx';
import { PokemonProvider, usePokemonContext } from '../PokemonContext.jsx';
import toast from '../../utils/toast.js';

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
                    <DataProvider>
                        <PokemonProvider>{children}</PokemonProvider>
                    </DataProvider>
                </TrainerProvider>
            </GameDataProvider>
        </ModalProvider>
    </UIProvider>
);

const renderAll = () => renderHook(() => ({
    pokemon: usePokemonContext(),
    trainer: useTrainerContext(),
    modal: useModal(),
    gameData: useGameData(),
}), { wrapper });

const basePoke = (id, overrides = {}) => ({
    id, name: `Poke${id}`, species: 'Bulbasaur', level: 1, exp: 0, highestLevelReached: 1,
    types: ['Grass'], moves: [], addedStats: {}, statAllocationHistory: [], statPointsAvailable: 0,
    ...overrides,
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('PokemonContext', () => {
    describe('addPokemon', () => {
        it('adds a blank Pokémon to the party when there is room', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([]));

            let added;
            act(() => { added = result.current.pokemon.addPokemon(); });

            expect(result.current.trainer.party).toHaveLength(1);
            expect(result.current.trainer.party[0].id).toBe(added.id);
            expect(result.current.pokemon.editingPokemon).toBe(added.id);
        });

        it('adds to reserve and switches the view when the party is full', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([1, 2, 3, 4, 5, 6].map(id => basePoke(id))));
            act(() => result.current.pokemon.setPokemonView('party'));

            act(() => result.current.pokemon.addPokemon());

            expect(result.current.trainer.party).toHaveLength(6);
            expect(result.current.trainer.reserve).toHaveLength(1);
            expect(result.current.pokemon.pokemonView).toBe('reserve');
        });
    });

    describe('updatePokemon', () => {
        it('syncs level from exp and grants level-up stat points', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1)]));

            act(() => result.current.pokemon.updatePokemon(1, { exp: 150 })); // -> level 5 per pokemonExpChart

            const p = result.current.trainer.party[0];
            expect(p.level).toBe(5);
            expect(p.highestLevelReached).toBe(5);
            expect(p.statPointsAvailable).toBe(4); // 4 new levels' worth of points (1 -> 5)
        });

        it('trims added stats that exceed the pool when leveling down', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, {
                level: 5, highestLevelReached: 5,
                addedStats: { atk: 4 },
                statAllocationHistory: ['atk', 'atk', 'atk', 'atk'],
            })]));

            // Level down to 2: max possible points = 1, so 3 of the 4 allocated must be stripped.
            act(() => result.current.pokemon.updatePokemon(1, { level: 2 }));

            const p = result.current.trainer.party[0];
            expect(p.level).toBe(2);
            expect(p.addedStats.atk).toBe(1);
            expect(p.statAllocationHistory).toHaveLength(1);
            expect(p.statPointsAvailable).toBe(0);
        });
    });

    describe('learnMove', () => {
        it('adds a new move with data merged in from GAME_DATA when available', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1)]));

            act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', type: 'Normal', level: 1 }));

            const moves = result.current.trainer.party[0].moves;
            expect(moves).toHaveLength(1);
            expect(moves[0].name).toBe('Tackle');
        });

        it('does not add a move the Pokémon already knows (case-insensitive)', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, { moves: [{ name: 'tackle', type: 'Normal' }] })]));

            act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', type: 'Normal', level: 1 }));

            expect(result.current.trainer.party[0].moves).toHaveLength(1);
        });

        it('replaces the move at replaceIndex and records it in moveHistory', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, { moves: [{ name: 'Growl', type: 'Normal' }] })]));

            act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', type: 'Normal', level: 5 }, 0));

            const p = result.current.trainer.party[0];
            expect(p.moves[0].name).toBe('Tackle');
            expect(p.moveHistory).toHaveLength(1);
            expect(p.moveHistory[0].name).toBe('Growl');
        });
    });

    describe('forgetMovesAboveLevel', () => {
        it('removes natural moves learned above the new level', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, {
                level: 10,
                moves: [
                    { name: 'Tackle', source: 'natural', learnedAtLevel: 1 },
                    { name: 'Vine Whip', source: 'natural', learnedAtLevel: 8 },
                ],
            })]));

            act(() => result.current.pokemon.forgetMovesAboveLevel(1, 5, true));

            const moves = result.current.trainer.party[0].moves;
            expect(moves.map(m => m.name)).toEqual(['Tackle']);
        });

        it('regression: restores a replaced move from history instead of deleting the slot outright (history lookup compared the wrong field)', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, {
                level: 10,
                moves: [{ name: 'Tackle', source: 'natural', learnedAtLevel: 8 }],
                moveHistory: [{ name: 'Growl', type: 'Normal', source: 'natural', replacedAtLevel: 8, slotIndex: 0 }],
            })]));

            act(() => result.current.pokemon.forgetMovesAboveLevel(1, 5, true));

            const moves = result.current.trainer.party[0].moves;
            expect(moves.map(m => m.name)).toEqual(['Growl']);
        });
    });

    describe('deletePokemon', () => {
        it('asks for confirmation, removes the Pokémon, and the toast Undo action restores it', () => {
            const { result } = renderAll();
            act(() => result.current.trainer.setParty([basePoke(1, { name: 'Bulby' })]));
            const toastSpy = vi.spyOn(toast, 'show');

            act(() => result.current.pokemon.deletePokemon(1));
            expect(result.current.modal.confirmModal.title).toBe('Release Pokémon');

            act(() => result.current.modal.confirmModal.onConfirm());
            expect(result.current.trainer.party).toHaveLength(0);
            expect(toastSpy).toHaveBeenCalled();

            const undoAction = toastSpy.mock.calls[0][3];
            act(() => undoAction.onClick());
            expect(result.current.trainer.party).toHaveLength(1);
            expect(result.current.trainer.party[0].name).toBe('Bulby');
        });
    });

    describe('getEvolutionOptions', () => {
        it('returns no evolution data for a species with no evolution chain', () => {
            const { result } = renderAll();
            const opts = result.current.pokemon.getEvolutionOptions({ species: 'TestMon', level: 10 });
            expect(opts).toEqual({ canEvolve: [], canDevolve: null });
        });

        it('flags a level-gated evolution as not-yet-available below the requirement, available at/above it', () => {
            const { result } = renderAll();
            act(() => result.current.gameData.setCustomSpecies([{
                species: 'TestMon',
                evolvesTo: [{ species: 'TestMon2', method: 'level', requirement: 16 }],
            }]));

            const tooLow = result.current.pokemon.getEvolutionOptions({ species: 'TestMon', level: 10 });
            expect(tooLow.canEvolve[0]).toMatchObject({ species: 'TestMon2', canEvolveNow: false, reason: 'Needs Level 16' });

            const highEnough = result.current.pokemon.getEvolutionOptions({ species: 'TestMon', level: 16 });
            expect(highEnough.canEvolve[0]).toMatchObject({ species: 'TestMon2', canEvolveNow: true, reason: '' });
        });

        it('reports a devolve target when evolvesFrom is present', () => {
            const { result } = renderAll();
            act(() => result.current.gameData.setCustomSpecies([{
                species: 'TestMon2',
                evolvesFrom: { species: 'TestMon', method: 'level', requirement: 16 },
            }]));

            const opts = result.current.pokemon.getEvolutionOptions({ species: 'TestMon2', level: 16 });
            expect(opts.canDevolve).toMatchObject({ species: 'TestMon', method: 'level', requirement: 16 });
        });
    });
});
