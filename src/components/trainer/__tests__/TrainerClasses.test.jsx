// ============================================================
// TrainerClasses Component Tests
// ============================================================
// Regression coverage for the advanced-class prerequisite enforcement added
// in commit c6b1154 — a class's `baseClass` field was only ever read for
// display before that fix, so any advanced class could be taken with zero
// prior classes. Previously this gate had only a single e2e test
// (trainer.spec.js) guarding it; this adds direct unit coverage.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TrainerClasses from '../TrainerClasses.jsx';
import { TrainerContext, GameDataContext, ModalContext, UIContext } from '../../../contexts/index.js';
import toast from '../../../utils/toast.js';

afterEach(cleanup);

const TRAINER_CLASSES = {
    'Ace Trainer': { type: 'base', skillPool: ['Browbeat', 'Sprint', 'Concentration', 'Healing', 'Investigate', 'Perception', 'Acrobatics', 'Stealth'] },
    'Black Belt': { type: 'advanced', baseClass: 'Martial Artist', skillPool: ['Brawl'] },
    'Juggler': { type: 'advanced', baseClass: 'Ace Trainer', skillPool: ['Acrobatics'] },
};

const makeTrainer = () => ({
    level: 12, // maxClasses = 3, room for one more
    classes: ['Ace Trainer'],
    featPoints: 5,
    skills: {},
    classSkills: {},
    classFeatCosts: {},
    features: [],
});

const renderClasses = (trainer) =>
    render(
        <TrainerContext.Provider value={{ trainer, setTrainer: vi.fn() }}>
            <GameDataContext.Provider value={{ GAME_DATA: { trainerClasses: TRAINER_CLASSES } }}>
                <ModalContext.Provider value={{ showConfirm: vi.fn() }}>
                    <UIContext.Provider value={{ showHelp: vi.fn() }}>
                        <TrainerClasses />
                    </UIContext.Provider>
                </ModalContext.Provider>
            </GameDataContext.Provider>
        </TrainerContext.Provider>
    );

// The panel starts collapsed once a trainer already has a class — expand it
// so the "Add a class" select/button are actually in the DOM.
const expandPanel = () => fireEvent.click(screen.getByLabelText('Expand Classes'));

describe('TrainerClasses — advanced class prerequisite enforcement', () => {
    it('blocks adding an advanced class whose base class is missing, with a warning toast', () => {
        renderClasses(makeTrainer());
        expandPanel();

        const warnings = [];
        const unsubscribe = toast.subscribe(t => { if (t.type === 'warning') warnings.push(t.message); });

        fireEvent.change(screen.getByLabelText('Add a class'), { target: { value: 'Black Belt' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));

        expect(warnings).toContain('Black Belt requires the Martial Artist class first!');
        // Blocked before reaching skill selection
        expect(screen.queryByText(/skill.*from the class skill pool/i)).not.toBeInTheDocument();

        unsubscribe();
    });

    it('renders a locked advanced class option as disabled with a "(requires X)" label', () => {
        renderClasses(makeTrainer());
        expandPanel();

        const option = screen.getByRole('option', { name: /Black Belt \(requires Martial Artist\)/ });
        expect(option).toBeDisabled();
    });

    it('allows adding an advanced class once its base class is already held', () => {
        renderClasses(makeTrainer());
        expandPanel();

        const warnings = [];
        const unsubscribe = toast.subscribe(t => { if (t.type === 'warning') warnings.push(t.message); });

        fireEvent.change(screen.getByLabelText('Add a class'), { target: { value: 'Juggler' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));

        expect(warnings).toEqual([]);
        // Prerequisite satisfied -> proceeds to skill selection for the new class
        expect(screen.getByText(/skill.*from the class skill pool/i)).toBeInTheDocument();

        unsubscribe();
    });
});
