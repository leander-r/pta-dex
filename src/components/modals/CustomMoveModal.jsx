// ============================================================
// Custom Move Modal Component
// ============================================================
// Modal for creating custom Pokemon moves

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal, usePokemonContext } from '../../contexts/index.js';
import toast from '../../utils/toast.js';
import { MAX_NATURAL_MOVES, MAX_TAUGHT_MOVES, MAX_TOTAL_MOVES } from '../../data/constants.js';

const TYPE_LIST = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

// The real movepool stores Frequency and Accuracy Check combined into one string
// (e.g. "Center - 4"), which made picking one out of a list of pre-combined options
// like "Center - 2" (but not "Center - 4") the only way to set a move's AC here.
// Split into two plain fields instead and recombine them on submit.
const FREQUENCY_BASE_OPTIONS = ['At-Will', 'EOT', 'Battle', 'Center', 'Daily'];

// Mirrors ModalContext's customMove initial state — this modal's form state
// is never otherwise reset, so reopening it after creating one move shows
// that move's data still filled in.
const DEFAULT_CUSTOM_MOVE = { name: '', type: 'Normal', category: 'Physical', frequency: 'At-Will', ac: '2', cannotMiss: false, damage: '', range: 'Melee', effect: '', description: '', source: 'natural' };

/**
 * CustomMoveModal - Modal for creating custom Pokemon moves
 * Uses UIContext for modal state, PokemonContext for pokemon data
 */
const CustomMoveModal = () => {
    // Get from contexts
    const { showCustomMoveModal, setShowCustomMoveModal, customMove, setCustomMove, customMoveForPokemon } = useModal();
    const { party, reserve, updatePokemon } = usePokemonContext();

    const handleClose = () => {
        setShowCustomMoveModal(false);
        setCustomMove(DEFAULT_CUSTOM_MOVE);
    };

    const { modalRef } = useModalKeyboard(showCustomMoveModal, handleClose);

    if (!showCustomMoveModal) return null;

    // Combine party and reserve for searching
    const allPokemon = [...(party || []), ...(reserve || [])];

    const handleAddMove = () => {
        if (!customMove.name || !customMoveForPokemon) return;

        const targetPoke = allPokemon.find(p => p.id === customMoveForPokemon);
        if (!targetPoke) return;

        // Check for duplicate move
        const alreadyKnows = targetPoke.moves.some(m =>
            m.name?.toLowerCase() === customMove.name?.toLowerCase()
        );
        if (alreadyKnows) {
            toast.warning(`${targetPoke.name || targetPoke.species} already knows ${customMove.name}!`);
            return;
        }

        // Check move limits
        const source = customMove.source === 'taught' ? 'taught' : 'natural';
        const naturalMoves = targetPoke.moves.filter(m => m.source === 'natural').length;
        const taughtMoves = targetPoke.moves.filter(m => m.source === 'taught').length;

        if (source === 'natural' && naturalMoves >= MAX_NATURAL_MOVES) {
            toast.warning(`This Pokemon already has ${MAX_NATURAL_MOVES} Natural moves.`);
            return;
        }
        if (source === 'taught' && taughtMoves >= MAX_TAUGHT_MOVES) {
            toast.warning(`This Pokemon already has ${MAX_TAUGHT_MOVES} Taught moves.`);
            return;
        }
        if (targetPoke.moves.length >= MAX_TOTAL_MOVES) {
            toast.warning(`This Pokemon already has ${MAX_TOTAL_MOVES} moves.`);
            return;
        }

        const { ac, cannotMiss, frequency, ...moveFields } = customMove;
        const combinedFrequency = cannotMiss ? `${frequency} - None` : (ac ? `${frequency} - ${ac}` : frequency);

        updatePokemon(customMoveForPokemon, {
            moves: [...targetPoke.moves, { ...moveFields, frequency: combinedFrequency, source }]
        });

        handleClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 'min(95vw, 550px)', width: '100%', maxHeight: 'min(90vh, 700px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-move-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                        color: 'white',
                        margin: '-25px -25px 0 -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <h3
                        id="custom-move-modal-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '800',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>⚔️</span>
                        Create Custom Move
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.35)';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>
                <div className="modal-content" style={{ overflowY: 'auto', flex: 1 }}>
                    <div className="form-group">
                        <label>Move Name *</label>
                        <input
                            type="text"
                            value={customMove.name}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Thunder Claw"
                        />
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={customMove.type}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, type: e.target.value }))}
                            >
                                {TYPE_LIST.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={customMove.category}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="Physical">Physical</option>
                                <option value="Special">Special</option>
                                <option value="Status">Status</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Frequency</label>
                            <select
                                value={customMove.frequency}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, frequency: e.target.value }))}
                            >
                                {FREQUENCY_BASE_OPTIONS.map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Accuracy Check</label>
                            <input
                                type="number"
                                min="1"
                                value={customMove.cannotMiss ? '' : customMove.ac}
                                disabled={customMove.cannotMiss}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, ac: e.target.value }))}
                                placeholder="e.g., 2, 4"
                                style={{ opacity: customMove.cannotMiss ? 0.5 : 1 }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', fontWeight: 'normal', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={customMove.cannotMiss}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, cannotMiss: e.target.checked }))}
                                />
                                Cannot miss (no Accuracy Check)
                            </label>
                        </div>
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Damage Dice</label>
                            <input
                                type="text"
                                value={customMove.damage}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, damage: e.target.value }))}
                                placeholder="e.g., 2d10+8 or leave empty for Status"
                            />
                        </div>

                        <div className="form-group">
                            <label>Range</label>
                            <input
                                type="text"
                                value={customMove.range}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, range: e.target.value }))}
                                placeholder="e.g., Melee, Ranged 6, Self"
                            />
                        </div>
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Move Source</label>
                            <select
                                value={customMove.source}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, source: e.target.value }))}
                            >
                                <option value="natural">Natural / Level-Up</option>
                                <option value="taught">Taught / TM / Tutor</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Effect Tags</label>
                        <input
                            type="text"
                            value={customMove.effect}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, effect: e.target.value }))}
                            placeholder="e.g., 1 Target, Burst, Column, Push"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={customMove.description}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe any special effects, conditions, or rules for this move..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!customMove.name}
                            onClick={handleAddMove}
                        >
                            Add Move
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomMoveModal;
