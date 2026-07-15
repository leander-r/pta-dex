// ============================================================
// Contest Panel — rolls contest appeal for a Pokémon's moves
// Used inside BattleTab when the player switches to Contest mode.
// ============================================================

import React, { useState, useEffect } from 'react';
import { parseDice } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';

const CONTEST_COLORS = {
    Cool:   '#2196f3',
    Beauty: '#e91e63',
    Cute:   '#ff9800',
    Smart:  '#4caf50',
    Tough:  '#795548',
};

const ContestPanel = ({ selectedPokemon, gameData, onRoll }) => {
    const [selectedMove, setSelectedMove] = useState(null);
    const [roll, setRoll] = useState(null);
    const [typeFilter, setTypeFilter] = useState('All');

    // Reset selection and result when the active Pokémon changes
    useEffect(() => {
        setSelectedMove(null);
        setRoll(null);
        setTypeFilter('All');
    }, [selectedPokemon?.id]);

    if (!selectedPokemon) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a Pokémon to see its contest moves.
            </div>
        );
    }

    // Enrich each learned move with game data contest fields
    const moves = (selectedPokemon.moves || []).map(m => {
        const gd = gameData?.moves?.[m.name] || {};
        return {
            name:          m.name,
            contestType:   gd.contestType   || m.contestType   || '',
            contestDice:   gd.contestDice   || m.contestDice   || null,
            contestEffect: gd.contestEffect || m.contestEffect || '',
        };
    });

    // Only show moves that have at least some contest data
    const contestMoves = moves.filter(m => m.contestType || m.contestDice || m.contestEffect);

    // Only show type filter when moves span multiple contest types
    const presentTypes = [...new Set(contestMoves.map(m => m.contestType).filter(Boolean))];
    const showFilter = presentTypes.length > 1;
    const filteredMoves = contestMoves.filter(m => typeFilter === 'All' || m.contestType === typeFilter);

    const rollAppeal = () => {
        if (!selectedMove) return;
        let rolls, bonus, total;
        if (selectedMove.contestDice) {
            const parsed = parseDice(selectedMove.contestDice);
            if (!parsed.count || !parsed.sides) { toast.warning('Could not parse contest dice.'); return; }
            rolls = Array.from({ length: parsed.count }, () => Math.floor(Math.random() * parsed.sides) + 1);
            bonus = parsed.bonus;
            total = rolls.reduce((a, b) => a + b, 0) + bonus;
        } else {
            // No-dice move: 0 base appeal, keyword still fires
            rolls = [];
            bonus = 0;
            total = 0;
        }
        setRoll({ rolls, bonus, total });
        onRoll?.({
            type: 'contest',
            pokemon: selectedPokemon.name || selectedPokemon.species,
            moveName: selectedMove.name,
            contestType: selectedMove.contestType,
            contestDice: selectedMove.contestDice || null,
            contestEffect: selectedMove.contestEffect,
            contestTypeColor: CONTEST_COLORS[selectedMove.contestType] || '#667eea',
            rolls, bonus, total,
            timestamp: Date.now(),
        });
    };

    const copyForGM = () => {
        if (!roll || !selectedMove) return;
        const name = selectedPokemon.name || selectedPokemon.species;
        // Format: Name | Move | ContestType | Score | Effect (effect optional)
        const parts = [name, selectedMove.name, selectedMove.contestType || '', roll.total];
        if (selectedMove.contestEffect) parts.push(selectedMove.contestEffect);
        navigator.clipboard.writeText(parts.join(' | '))
            .then(() => toast.success('Copied! Paste this in GM Tools → Contests during your turn.'));
    };

    const color = CONTEST_COLORS[selectedMove?.contestType] || '#667eea';
    const rollableSelected = !!selectedMove;
    const noDiceSelected = selectedMove && !selectedMove.contestDice;

    return (
        <div>
            {/* Contest type quick-filter — only shown when moves span multiple types */}
            {showFilter && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {['All', ...presentTypes].map(t => {
                        const c = CONTEST_COLORS[t];
                        const isActive = typeFilter === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                style={{
                                    padding: '3px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                    border: `1.5px solid ${c || 'var(--border-medium)'}`,
                                    background: isActive ? (c || 'var(--text-secondary)') : 'transparent',
                                    color: isActive ? 'white' : c || 'var(--text-secondary)',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Move list */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Select Contest Move</div>
                <div style={{ maxHeight: filteredMoves.length > 4 ? 240 : undefined, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {filteredMoves.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                            {moves.length === 0
                                ? 'No moves learned yet.'
                                : contestMoves.length === 0
                                ? `None of ${selectedPokemon.name || selectedPokemon.species}'s moves have contest data.`
                                : 'No moves match this filter.'}
                        </div>
                    )}
                    {filteredMoves.map((move, idx) => {
                        const c = CONTEST_COLORS[move.contestType] || '#9e9e9e';
                        const isSelected = selectedMove?.name === move.name;

                        // No-dice moves — selectable, but yield 0 base appeal (keyword still fires)
                        if (!move.contestDice) {
                            return (
                                <button
                                    key={idx}
                                    onClick={() => { setSelectedMove(move); setRoll(null); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                                        border: isSelected ? `2px solid ${c}` : '1px dashed var(--border-medium)',
                                        background: isSelected ? `${c}22` : 'var(--surface-bg)',
                                        color: 'var(--text-primary)',
                                        textAlign: 'left', width: '100%',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{move.name}</div>
                                        {move.contestEffect && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{move.contestEffect}</div>
                                        )}
                                    </div>
                                    {move.contestType && (
                                        <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: c, color: 'white', flexShrink: 0 }}>
                                            {move.contestType}
                                        </span>
                                    )}
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>✦ effect only</span>
                                </button>
                            );
                        }

                        // Rollable moves — interactive buttons
                        return (
                            <button
                                key={idx}
                                onClick={() => { setSelectedMove(move); setRoll(null); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                                    border: isSelected ? `2px solid ${c}` : '1px solid var(--border-light)',
                                    background: isSelected ? `${c}22` : 'var(--surface-bg)',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left', width: '100%',
                                    transition: 'all 0.12s',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{move.name}</div>
                                    {move.contestEffect && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{move.contestEffect}</div>
                                    )}
                                </div>
                                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: c, color: 'white', flexShrink: 0 }}>
                                    {move.contestType}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>
                                    🎲 {move.contestDice}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Roll button */}
            <button
                onClick={rollAppeal}
                disabled={!rollableSelected}
                style={{
                    width: '100%', padding: 14, borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 15,
                    background: rollableSelected ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'var(--collapsed-btn-bg)',
                    color: rollableSelected ? 'white' : 'var(--collapsed-btn-text)',
                    cursor: rollableSelected ? 'pointer' : 'not-allowed',
                    marginBottom: roll ? 10 : 0,
                    transition: 'background var(--transition-normal), opacity var(--transition-fast)',
                }}
            >
                {noDiceSelected
                    ? `✦ Apply Effect (${selectedMove.name})`
                    : rollableSelected
                    ? `🎭 Roll Appeal (${selectedMove.contestDice})`
                    : 'Select a move to roll'}
            </button>

            {/* Result */}
            {roll && selectedMove && (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: `${color}14`, border: `1.5px solid ${color}55` }}>
                    {/* Score + breakdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 1 }}>
                                {selectedMove.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {selectedMove.contestType} Appeal
                            </div>
                            {roll.rolls.length > 0 && (
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                    [{roll.rolls.join(', ')}]{roll.bonus !== 0 ? ` ${roll.bonus > 0 ? '+' : ''}${roll.bonus}` : ''}
                                </div>
                            )}
                            {selectedMove.contestEffect && (
                                <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 3 }}>
                                    ✦ {selectedMove.contestEffect}
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1, flexShrink: 0 }}>
                            {roll.total}
                        </div>
                    </div>

                    {/* Copy button */}
                    <button
                        onClick={copyForGM}
                        title={(() => {
                            const parts = [selectedPokemon.name || selectedPokemon.species, selectedMove.name, selectedMove.contestType || '', roll.total];
                            if (selectedMove.contestEffect) parts.push(selectedMove.contestEffect);
                            return `Copies: ${parts.join(' | ')}`;
                        })()}
                        style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: `1px solid ${color}55`, background: `${color}18`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                        📋 Copy for GM
                    </button>

                    {/* GM workflow hint */}
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                        When it's your turn: give your GM the copied result, tell them which judge you're targeting
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestPanel;
