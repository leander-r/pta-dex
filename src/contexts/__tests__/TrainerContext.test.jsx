// ============================================================
// TrainerContext Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { UIProvider } from '../UIContext.jsx';
import { ModalProvider } from '../ModalContext.jsx';
import { TrainerProvider, useTrainerContext } from '../TrainerContext.jsx';
import toast from '../../utils/toast.js';

const wrapper = ({ children }) => (
    <UIProvider>
        <ModalProvider>
            <TrainerProvider>{children}</TrainerProvider>
        </ModalProvider>
    </UIProvider>
);

const renderTrainer = () => renderHook(() => useTrainerContext(), { wrapper });

const poke = (id, overrides = {}) => ({ id, name: `Poke${id}`, species: 'Bulbasaur', level: 1, types: ['Grass'], ...overrides });

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('TrainerContext', () => {
    it('defaults to a fresh level-0 trainer with base stats and 30 creation points', () => {
        const { result } = renderTrainer();
        expect(result.current.trainer.level).toBe(0);
        expect(result.current.trainer.stats.atk).toBe(6);
        expect(result.current.trainer.statPoints).toBe(30);
    });

    describe('calculateModifier', () => {
        it('returns 0 at the neutral value (10)', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, atk: 10 } })));
            expect(result.current.calculateModifier('atk')).toBe(0);
        });

        it('returns a positive modifier above neutral, floor((v-10)/2)', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, atk: 15 } })));
            expect(result.current.calculateModifier('atk')).toBe(2); // floor(5/2)
        });

        it('returns a negative modifier below neutral, -(10-v)', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, atk: 6 } })));
            expect(result.current.calculateModifier('atk')).toBe(-4);
        });
    });

    describe('calculateMaxHP', () => {
        it('is hp*4 + level*4 with no relevant features', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, hp: 10 }, level: 5 })));
            expect(result.current.calculateMaxHP()).toBe(10 * 4 + 5 * 4);
        });

        it('adds (atkMod+defMod)*5 for Improved Martial Endurance', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, hp: 10, atk: 14, def: 14 }, // mod 2 each
                level: 0,
                features: ['Improved Martial Endurance'],
            })));
            // base: 10*4 = 40, bonus: (2+2)*5 = 20
            expect(result.current.calculateMaxHP()).toBe(60);
        });

        it('adds defMod*3 for Mystic Veil', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, hp: 10, def: 16 }, // mod 3
                level: 0,
                features: ['Mystic Veil'],
            })));
            expect(result.current.calculateMaxHP()).toBe(40 + 9); // 3*3
        });
    });

    describe('updateTrainerStat', () => {
        it('spends creation points for an increase within the cap', () => {
            const { result } = renderTrainer();
            act(() => result.current.updateTrainerStat('atk', 12));
            expect(result.current.trainer.stats.atk).toBe(12);
            expect(result.current.trainer.statPoints).toBe(30 - 6);
            expect(result.current.trainer.levelStatPoints).toBe(0);
        });

        it('refuses to drop a stat below the base value (6)', () => {
            const { result } = renderTrainer();
            act(() => result.current.updateTrainerStat('atk', 5));
            expect(result.current.trainer.stats.atk).toBe(6);
        });

        it('splits spend across creation and level points when crossing the cap', () => {
            const { result } = renderTrainer();
            // Seed a small creation pool + a level pool to force a split spend.
            act(() => result.current.setTrainer(prev => ({ ...prev, statPoints: 5, levelStatPoints: 10 })));
            act(() => result.current.updateTrainerStat('atk', 20)); // 6 -> 20, diff 14, cap 14
            expect(result.current.trainer.stats.atk).toBe(20);
            expect(result.current.trainer.statPoints).toBe(0);     // all 5 creation points used
            expect(result.current.trainer.levelStatPoints).toBe(1); // 10 - 9 used
        });

        it('refuses the change when neither pool has enough points', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, statPoints: 2, levelStatPoints: 0 })));
            act(() => result.current.updateTrainerStat('atk', 20)); // needs far more than 2 points total
            expect(result.current.trainer.stats.atk).toBe(6); // unchanged
        });

        it('refunds to the level pool when decreasing a stat that was above the cap', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, atk: 20 }, statPoints: 0, levelStatPoints: 1 })));
            act(() => result.current.updateTrainerStat('atk', 15));
            expect(result.current.trainer.stats.atk).toBe(15);
            expect(result.current.trainer.levelStatPoints).toBe(6); // 1 + 5 refunded
            expect(result.current.trainer.statPoints).toBe(0);
        });
    });

    describe('undoStatAllocation', () => {
        it('restores stats/statPoints/levelStatPoints from before the last change', () => {
            const { result } = renderTrainer();
            act(() => result.current.updateTrainerStat('atk', 12));
            expect(result.current.canUndoStat).toBe(true);

            act(() => result.current.undoStatAllocation());
            expect(result.current.trainer.stats.atk).toBe(6);
            expect(result.current.trainer.statPoints).toBe(30);
            expect(result.current.canUndoStat).toBe(false);
        });
    });

    describe('levelUpTrainer', () => {
        it('blocks leaving level 0 until creation points are spent and a class is picked', () => {
            const { result } = renderTrainer();
            const warnSpy = vi.spyOn(toast, 'warning');
            act(() => result.current.levelUpTrainer());
            expect(result.current.trainer.level).toBe(0);
            expect(warnSpy).toHaveBeenCalled();
        });

        it('advances to level 1 and grants that level\'s stat/feat points once creation is complete', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, statPoints: 0, classes: ['Ace Trainer'] })));
            act(() => result.current.levelUpTrainer());
            expect(result.current.trainer.level).toBe(1);
            expect(result.current.trainer.levelStatPoints).toBe(1); // progression[1].stats
            expect(result.current.trainer.featPoints).toBe(1);      // progression[1].feats
        });

        it('refuses to exceed the max trainer level', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, level: 50 })));
            const warnSpy = vi.spyOn(toast, 'warning');
            act(() => result.current.levelUpTrainer());
            expect(result.current.trainer.level).toBe(50);
            expect(warnSpy).toHaveBeenCalled();
        });
    });

    describe('levelDownTrainer', () => {
        it('refuses to go below level 1', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, level: 1 })));
            const warnSpy = vi.spyOn(toast, 'warning');
            act(() => result.current.levelDownTrainer());
            expect(result.current.trainer.level).toBe(1);
            expect(warnSpy).toHaveBeenCalled();
        });

        it('steps back to level 1 from level 2, returning that level\'s stat points to the pool', () => {
            const { result } = renderTrainer();
            act(() => result.current.setTrainer(prev => ({ ...prev, statPoints: 0, classes: ['Ace Trainer'] })));
            act(() => result.current.levelUpTrainer()); // -> level 1
            act(() => result.current.levelUpTrainer()); // -> level 2
            expect(result.current.trainer.level).toBe(2);

            act(() => result.current.levelDownTrainer());
            expect(result.current.trainer.level).toBe(1);
        });

        it('refuses to level down when more level-stat points are spent than the lower level allows', () => {
            const { result } = renderTrainer();
            // statPoints left at the full 30 (0 creation spent) so all 14 points on `atk`
            // are attributed to the level pool — level 1 only grants 1, so this must block.
            act(() => result.current.setTrainer(prev => ({
                ...prev, level: 2, statPoints: 30, levelStatPoints: 14,
                stats: { ...prev.stats, atk: 20 },
            })));
            const warnSpy = vi.spyOn(toast, 'warning');
            act(() => result.current.levelDownTrainer());
            expect(result.current.trainer.level).toBe(2); // unchanged
            expect(warnSpy).toHaveBeenCalled();
        });
    });

    describe('party/reserve movement', () => {
        it('moveToReserve and moveToParty move a Pokémon between lists', () => {
            const { result } = renderTrainer();
            act(() => result.current.setParty([poke(1), poke(2)]));
            act(() => result.current.setReserve([]));

            act(() => result.current.moveToReserve(1));
            expect(result.current.party.map(p => p.id)).toEqual([2]);
            expect(result.current.reserve.map(p => p.id)).toEqual([1]);

            act(() => result.current.moveToParty(1));
            expect(result.current.party.map(p => p.id)).toEqual([2, 1]);
            expect(result.current.reserve).toEqual([]);
        });

        it('refuses to move a Pokémon into a full party', () => {
            const { result } = renderTrainer();
            act(() => result.current.setParty([1, 2, 3, 4, 5, 6].map(poke)));
            act(() => result.current.setReserve([poke(7)]));

            const warnSpy = vi.spyOn(toast, 'warning');
            act(() => result.current.moveToParty(7));
            expect(result.current.party).toHaveLength(6);
            expect(result.current.reserve).toHaveLength(1);
            expect(warnSpy).toHaveBeenCalled();
        });

        it('movePokemonUp/movePokemonDown swap adjacent party members', () => {
            const { result } = renderTrainer();
            act(() => result.current.setParty([poke(1), poke(2), poke(3)]));

            act(() => result.current.movePokemonUp(2, true));
            expect(result.current.party.map(p => p.id)).toEqual([2, 1, 3]);

            act(() => result.current.movePokemonDown(2, true));
            expect(result.current.party.map(p => p.id)).toEqual([1, 2, 3]);
        });

        it('reorderPokemon moves a dragged item to the drop target position', () => {
            const { result } = renderTrainer();
            act(() => result.current.setParty([poke(1), poke(2), poke(3)]));

            act(() => result.current.reorderPokemon(1, 3, true)); // drag id1 onto id3
            expect(result.current.party.map(p => p.id)).toEqual([2, 3, 1]);
        });

        it('sortPokemonList sorts party by name ascending/descending', () => {
            const { result } = renderTrainer();
            act(() => result.current.setParty([
                poke(1, { name: 'Charmander' }),
                poke(2, { name: 'Abra' }),
                poke(3, { name: 'Bulbasaur' }),
            ]));

            act(() => result.current.sortPokemonList(true, 'name', 'asc'));
            expect(result.current.party.map(p => p.name)).toEqual(['Abra', 'Bulbasaur', 'Charmander']);

            act(() => result.current.sortPokemonList(true, 'name', 'desc'));
            expect(result.current.party.map(p => p.name)).toEqual(['Charmander', 'Bulbasaur', 'Abra']);
        });
    });
});
