// ============================================================
// Contest Runner — PTA Player's Handbook 2, Contests chapter
// ============================================================
// GM tool for running Pokémon Contests.
// 5 contest types × 5 rounds. Each participant rolls their move's
// appeal dice; highest cumulative appeal wins.

import React, { useState, useMemo } from 'react';
import { parseDice } from '../../utils/dataUtils.js';
import { useGameData } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

const CONTEST_TYPES = [
    { id: 'Cool',   color: '#2196f3', icon: '😎' },
    { id: 'Beauty', color: '#e91e63', icon: '💎' },
    { id: 'Cute',   color: '#ff9800', icon: '🌸' },
    { id: 'Smart',  color: '#4caf50', icon: '🔮' },
    { id: 'Tough',  color: '#795548', icon: '💪' },
];

const TOTAL_ROUNDS = 5;

const rollDice = (diceStr) => {
    const { count, sides, bonus } = parseDice(diceStr);
    if (!count || !sides) return null;
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0) + bonus;
    return { rolls, bonus, total, diceStr };
};

const ContestRunner = () => {
    const { GAME_DATA } = useGameData();
    const [contestType, setContestType] = useState('');
    const [participants, setParticipants] = useState([]); // { id, name, moveName, diceStr, rounds: [] }
    const [round, setRound] = useState(0); // 0=setup, 1–5=active, 6=results
    const [newName, setNewName] = useState('');
    const [newMove, setNewMove] = useState('');

    // Find matching contest moves in GAME_DATA for current contestType
    const contestMoves = useMemo(() => {
        if (!contestType || !GAME_DATA?.moves) return {};
        return Object.fromEntries(
            Object.entries(GAME_DATA.moves)
                .filter(([, m]) => m.contestType === contestType && m.contestDice)
                .map(([name, m]) => [name, m.contestDice])
        );
    }, [contestType, GAME_DATA?.moves]);

    // Resolve dice string for a move name
    const resolveDice = (moveName) => {
        if (!moveName.trim()) return '';
        const key = Object.keys(GAME_DATA?.moves || {}).find(
            k => k.toLowerCase() === moveName.trim().toLowerCase()
        );
        return key ? (GAME_DATA.moves[key].contestDice || '') : '';
    };

    const handleAddParticipant = () => {
        if (!newName.trim()) { toast.warning('Enter a name.'); return; }
        const diceStr = resolveDice(newMove) || '1d4'; // fallback
        setParticipants(prev => [...prev, {
            id: Date.now(),
            name: newName.trim(),
            moveName: newMove.trim() || '—',
            diceStr,
            rounds: []
        }]);
        setNewName('');
        setNewMove('');
    };

    const handleRemoveParticipant = (id) => {
        setParticipants(prev => prev.filter(p => p.id !== id));
    };

    const handleStart = () => {
        if (!contestType) { toast.warning('Select a contest type first.'); return; }
        if (participants.length < 2) { toast.warning('Need at least 2 participants.'); return; }
        setRound(1);
    };

    const handleRollAll = () => {
        if (round < 1 || round > TOTAL_ROUNDS) return;
        setParticipants(prev => prev.map(p => {
            if (p.rounds.length >= round) return p; // already rolled this round
            const result = rollDice(p.diceStr);
            return result ? { ...p, rounds: [...p.rounds, result] } : p;
        }));
    };

    const handleRollOne = (id) => {
        setParticipants(prev => prev.map(p => {
            if (p.id !== id || p.rounds.length >= round) return p;
            const result = rollDice(p.diceStr);
            return result ? { ...p, rounds: [...p.rounds, result] } : p;
        }));
    };

    const allRolledThisRound = participants.length > 0 && participants.every(p => p.rounds.length >= round);

    const handleNextRound = () => {
        if (!allRolledThisRound) { toast.warning('All participants must roll before advancing.'); return; }
        if (round >= TOTAL_ROUNDS) {
            setRound(6); // show results
        } else {
            setRound(r => r + 1);
        }
    };

    const handleReset = () => {
        setRound(0);
        setParticipants([]);
        setContestType('');
    };

    const getTotal = (p) => p.rounds.reduce((sum, r) => sum + r.total, 0);

    const sortedByAppeal = [...participants].sort((a, b) => getTotal(b) - getTotal(a));

    const typeInfo = CONTEST_TYPES.find(t => t.id === contestType);

    // ── Setup phase ──────────────────────────────────────────────
    if (round === 0) {
        return (
            <div>
                <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                    🎭 Contest Runner
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Run a 5-round Pokémon Contest. Each participant rolls their move's appeal dice each round.
                    Highest cumulative appeal wins. Source: PTA Player's Handbook 2, Contests chapter.
                </p>

                {/* Contest type */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">🏆 Contest Type</h3>
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {CONTEST_TYPES.map(ct => (
                            <button
                                key={ct.id}
                                onClick={() => setContestType(ct.id)}
                                style={{
                                    padding: '8px 18px', borderRadius: 8, border: '2px solid',
                                    borderColor: contestType === ct.id ? ct.color : 'var(--border-light)',
                                    background: contestType === ct.id ? ct.color : 'var(--surface-bg)',
                                    color: contestType === ct.id ? 'white' : 'var(--text-primary)',
                                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {ct.icon} {ct.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add participants */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">👥 Participants</h3>
                    <div style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Pokémon / trainer name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                                style={{ flex: 2, minWidth: 120, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <input
                                type="text"
                                placeholder="Move name (optional)..."
                                value={newMove}
                                onChange={e => setNewMove(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                                style={{ flex: 2, minWidth: 140, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <button
                                onClick={handleAddParticipant}
                                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#667eea', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Move lookup hint */}
                        {contestType && newMove.trim() && (() => {
                            const found = resolveDice(newMove);
                            if (!found) return (
                                <div style={{ fontSize: 12, color: '#e65100', marginBottom: 8 }}>
                                    ⚠ Move not found for {contestType} contest — will use 1d4 default.
                                </div>
                            );
                            return (
                                <div style={{ fontSize: 12, color: '#2e7d32', marginBottom: 8 }}>
                                    ✓ Found: {newMove.trim()} → Appeal {found}
                                </div>
                            );
                        })()}

                        {/* Participant list */}
                        {participants.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                                No participants yet. Add at least 2 to start.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {participants.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', borderRadius: 8,
                                        background: 'var(--bg-light, #f5f5f5)', border: '1px solid var(--border-light)'
                                    }}>
                                        <span style={{ fontWeight: 700, flex: 1, fontSize: 14 }}>{p.name}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {p.moveName !== '—' ? `${p.moveName} ` : ''}<strong>{p.diceStr}</strong>
                                        </span>
                                        <button
                                            onClick={() => handleRemoveParticipant(p.id)}
                                            style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                                            aria-label={`Remove ${p.name}`}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available contest moves reference */}
                        {contestType && Object.keys(contestMoves).length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                                    {contestType} moves in game data:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {Object.entries(contestMoves).slice(0, 30).map(([name, dice]) => (
                                        <span
                                            key={name}
                                            onClick={() => setNewMove(name)}
                                            title={`Click to use ${name}`}
                                            style={{
                                                padding: '2px 8px', borderRadius: 10, fontSize: 11,
                                                background: typeInfo ? `${typeInfo.color}22` : 'var(--surface-bg)',
                                                border: `1px solid ${typeInfo ? typeInfo.color + '55' : 'var(--border-light)'}`,
                                                color: 'var(--text-primary)', cursor: 'pointer'
                                            }}
                                        >
                                            {name} <strong>({dice})</strong>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    disabled={!contestType || participants.length < 2}
                    style={{
                        width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                        background: !contestType || participants.length < 2
                            ? 'var(--border-light)' : `linear-gradient(135deg, ${typeInfo?.color || '#667eea'}, ${typeInfo?.color || '#764ba2'}dd)`,
                        color: !contestType || participants.length < 2 ? 'var(--text-muted)' : 'white',
                        fontWeight: 800, fontSize: 15, cursor: !contestType || participants.length < 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {typeInfo?.icon} Start {contestType || '...'} Contest
                </button>
            </div>
        );
    }

    // ── Results phase ─────────────────────────────────────────────
    if (round === 6) {
        const winner = sortedByAppeal[0];
        return (
            <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
                    <h3 style={{ fontWeight: 800, fontSize: 22, color: typeInfo?.color || '#667eea', margin: 0 }}>
                        {typeInfo?.icon} {contestType} Contest Results
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
                        Winner: <strong>{winner.name}</strong> with {getTotal(winner)} appeal!
                    </p>
                </div>

                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">📊 Final Standings</h3>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sortedByAppeal.map((p, idx) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 8,
                                background: idx === 0 ? `${typeInfo?.color || '#667eea'}22` : 'var(--surface-bg)',
                                border: `1px solid ${idx === 0 ? (typeInfo?.color || '#667eea') + '66' : 'var(--border-light)'}`
                            }}>
                                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-muted)', width: 28 }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                </span>
                                <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                                    {p.rounds.map((r, i) => (
                                        <span key={i} style={{ marginLeft: 6 }}>R{i + 1}: <strong>{r.total}</strong></span>
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: 22, fontWeight: 800,
                                    color: idx === 0 ? (typeInfo?.color || '#667eea') : 'var(--text-primary)',
                                    minWidth: 40, textAlign: 'right'
                                }}>{getTotal(p)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleReset}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                    ↺ New Contest
                </button>
            </div>
        );
    }

    // ── Active round phase ────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{typeInfo?.icon}</span>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 800, color: typeInfo?.color || '#667eea' }}>
                        {contestType} Contest
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        Round {round} of {TOTAL_ROUNDS}
                    </p>
                </div>
                {/* Round progress */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                        <div key={i} style={{
                            width: 24, height: 8, borderRadius: 4,
                            background: i + 1 < round
                                ? (typeInfo?.color || '#667eea')
                                : i + 1 === round
                                    ? (typeInfo?.color || '#667eea') + '88'
                                    : 'var(--border-light)'
                        }} />
                    ))}
                </div>
            </div>

            {/* Participants */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-header font-bold" style={{ margin: 0 }}>🎲 Round {round} Rolls</h3>
                    <button
                        onClick={handleRollAll}
                        disabled={allRolledThisRound}
                        style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: allRolledThisRound ? 'var(--border-light)' : `linear-gradient(135deg, ${typeInfo?.color || '#667eea'}, ${typeInfo?.color || '#764ba2'}cc)`,
                            color: allRolledThisRound ? 'var(--text-muted)' : 'white',
                            fontWeight: 700, fontSize: 13, cursor: allRolledThisRound ? 'default' : 'pointer'
                        }}
                    >
                        Roll All
                    </button>
                </div>
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {participants.map(p => {
                        const thisRound = p.rounds[round - 1];
                        const total = getTotal(p);
                        return (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', borderRadius: 8,
                                background: thisRound ? `${typeInfo?.color || '#667eea'}18` : 'var(--surface-bg)',
                                border: `1px solid ${thisRound ? (typeInfo?.color || '#667eea') + '55' : 'var(--border-light)'}`
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {p.moveName !== '—' ? `${p.moveName} · ` : ''}{p.diceStr}
                                    </div>
                                </div>

                                {/* Roll result */}
                                {thisRound ? (
                                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: typeInfo?.color || '#667eea' }}>
                                            {thisRound.total}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                            [{thisRound.rolls.join(',')}]{thisRound.bonus ? `+${thisRound.bonus}` : ''}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleRollOne(p.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: 6, border: 'none',
                                            background: typeInfo?.color || '#667eea',
                                            color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                                        }}
                                    >
                                        Roll
                                    </button>
                                )}

                                {/* Running total */}
                                <div style={{ textAlign: 'right', minWidth: 48 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Standings so far */}
            {participants.some(p => p.rounds.length > 0) && (
                <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: 'var(--surface-bg)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Current Standings</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {sortedByAppeal.map((p, idx) => (
                            <span key={p.id} style={{
                                padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                background: idx === 0 ? (typeInfo?.color || '#667eea') : 'var(--bg-light)',
                                color: idx === 0 ? 'white' : 'var(--text-primary)'
                            }}>
                                {idx === 0 ? '🥇 ' : ''}{p.name}: {getTotal(p)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleNextRound}
                disabled={!allRolledThisRound}
                style={{
                    width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                    background: !allRolledThisRound
                        ? 'var(--border-light)' : `linear-gradient(135deg, ${typeInfo?.color || '#667eea'}, ${typeInfo?.color || '#764ba2'}dd)`,
                    color: !allRolledThisRound ? 'var(--text-muted)' : 'white',
                    fontWeight: 800, fontSize: 15,
                    cursor: !allRolledThisRound ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                {round < TOTAL_ROUNDS ? `Next Round (${round + 1}/${TOTAL_ROUNDS})` : '🏆 View Results'}
            </button>
        </div>
    );
};

export default ContestRunner;
