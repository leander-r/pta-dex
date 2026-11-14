// ============================================================
// MoveLearnModal Component Tests
// ============================================================
// Regression coverage for the a11y fix added this morning: a visible ×
// close button, and keyboard (Enter/Space) activation on the new-move-name
// row and each current-move row, matching their existing onClick handlers
// (see commit a5a9476).

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MoveLearnModal from '../MoveLearnModal.jsx';
import { ModalContext, GameDataContext, PokemonContext } from '../../../contexts/index.js';

afterEach(cleanup);

const GAME_DATA = {
    moves: {
        Tackle: { type: 'Normal', category: 'Physical', damage: '1d6', frequency: 'At-Will' },
        Growl: { type: 'Normal', category: 'Status', damage: '', frequency: 'At-Will' },
    },
};

const moveLearnData = {
    pokemonId: 'p1',
    pokemonName: 'Bulby',
    newMove: { move: 'Tackle', type: 'Normal', level: 5, source: 'natural' },
    currentMoves: [{ name: 'Growl', source: 'natural' }],
    inParty: true,
    source: 'natural',
};

const renderModal = ({ showDetail = vi.fn(), setShowMoveLearnModal = vi.fn(), setMoveLearnData = vi.fn() } = {}) => {
    const modalValue = {
        showDetail,
        showMoveLearnModal: true,
        setShowMoveLearnModal,
        moveLearnData,
        setMoveLearnData,
    };
    const pokemonValue = {
        learnMove: vi.fn(),
        updatePokemon: vi.fn(),
        party: [{ id: 'p1', moves: [{ name: 'Growl', source: 'natural' }], moveHistory: [] }],
        reserve: [],
    };
    render(
        <ModalContext.Provider value={modalValue}>
            <GameDataContext.Provider value={{ GAME_DATA }}>
                <PokemonContext.Provider value={pokemonValue}>
                    <MoveLearnModal />
                </PokemonContext.Provider>
            </GameDataContext.Provider>
        </ModalContext.Provider>
    );
    return { showDetail, setShowMoveLearnModal, setMoveLearnData };
};

describe('MoveLearnModal — a11y fixes', () => {
    it('renders a visible, keyboard-reachable close button that closes the modal', () => {
        const { setShowMoveLearnModal, setMoveLearnData } = renderModal();
        fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(setShowMoveLearnModal).toHaveBeenCalledWith(false);
        expect(setMoveLearnData).toHaveBeenCalledWith(null);
    });

    it('pressing Enter on the new-move row shows move details, same as clicking it', () => {
        const { showDetail } = renderModal();
        const row = screen.getByText('Tackle').closest('[role="button"]');
        expect(row).toHaveAttribute('tabIndex', '0');

        fireEvent.keyDown(row, { key: 'Enter' });

        expect(showDetail).toHaveBeenCalledWith('move', 'Tackle', expect.objectContaining({ type: 'Normal' }));
    });

    it('pressing Space on a current-move row shows that move\'s details', () => {
        const { showDetail } = renderModal();
        const row = screen.getByText('Growl').closest('[role="button"]');
        expect(row).toHaveAttribute('tabIndex', '0');

        fireEvent.keyDown(row, { key: ' ' });

        expect(showDetail).toHaveBeenCalledWith('move', 'Growl', expect.objectContaining({ type: 'Normal' }));
    });

    it('a non-activation key does not trigger showDetail', () => {
        const { showDetail } = renderModal();
        const row = screen.getByText('Tackle').closest('[role="button"]');

        fireEvent.keyDown(row, { key: 'Tab' });

        expect(showDetail).not.toHaveBeenCalled();
    });
});
