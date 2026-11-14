// ============================================================
// CustomSpeciesModal Component Tests
// ============================================================
// Regression coverage for the keyboard-accessibility fix added to the
// ability/move picker rows (previously click-only divs with no keyboard
// equivalent — see commit a5a9476).

import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CustomSpeciesModal from '../CustomSpeciesModal.jsx';
import { ModalContext, GameDataContext } from '../../../contexts/index.js';
import { GAME_DATA } from '../../../data/configs.js';

afterEach(cleanup);

const MODAL_BASE = {
    showCustomSpeciesModal: true,
    setShowCustomSpeciesModal: vi.fn(),
    editingCustomSpeciesId: null,
    setEditingCustomSpeciesId: vi.fn(),
    showConfirm: vi.fn(),
};

const GAME_DATA_BASE = {
    customSpecies: [],
    setCustomSpecies: vi.fn(),
    pokedex: [],
};

const renderModal = () =>
    render(
        <ModalContext.Provider value={MODAL_BASE}>
            <GameDataContext.Provider value={GAME_DATA_BASE}>
                <CustomSpeciesModal />
            </GameDataContext.Provider>
        </ModalContext.Provider>
    );

describe('CustomSpeciesModal — ability/move picker keyboard access', () => {
    let originalAbilities;
    let originalMoves;

    beforeEach(() => {
        originalAbilities = GAME_DATA.abilities;
        originalMoves = GAME_DATA.moves;
        GAME_DATA.abilities = { 'Test Ability': 'A test ability description.' };
        GAME_DATA.moves = { 'Test Move': { type: 'Normal', category: 'Status', damage: '', frequency: 'At-Will' } };
    });

    afterEach(() => {
        GAME_DATA.abilities = originalAbilities;
        GAME_DATA.moves = originalMoves;
    });

    it('pressing Enter on an ability picker row adds the ability, same as clicking it', () => {
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: '+ Basic' }));

        const row = screen.getByText('Test Ability').closest('[role="button"]');
        expect(row).toHaveAttribute('tabIndex', '0');
        fireEvent.keyDown(row, { key: 'Enter' });

        expect(screen.getByLabelText('Remove Test Ability')).toBeInTheDocument();
    });

    it('pressing Space on an ability picker row adds the ability', () => {
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: '+ Basic' }));

        const row = screen.getByText('Test Ability').closest('[role="button"]');
        fireEvent.keyDown(row, { key: ' ' });

        expect(screen.getByLabelText('Remove Test Ability')).toBeInTheDocument();
    });

    it('pressing Enter on a move picker row adds the move, same as clicking it', () => {
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: '+ Add Move' }));

        const row = screen.getByText('Test Move').closest('[role="button"]');
        expect(row).toHaveAttribute('tabIndex', '0');
        fireEvent.keyDown(row, { key: 'Enter' });

        expect(screen.getByLabelText('Remove Test Move')).toBeInTheDocument();
    });

    it('a non-activation key (e.g. Tab) on a picker row does nothing', () => {
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: '+ Basic' }));

        const row = screen.getByText('Test Ability').closest('[role="button"]');
        fireEvent.keyDown(row, { key: 'Tab' });

        expect(screen.queryByLabelText('Remove Test Ability')).not.toBeInTheDocument();
    });
});
