// ============================================================
// Contest Runner — PTA Player's Handbook 2, Contests chapter
// Rules implemented:
//   • 3 Judges with Voltage (1–6)
//   • Judge targeting per turn
//   • Type relations: same (+1 voltage, +1d4) / opposite (-1 voltage) / adjacent (no effect)
//   • Max voltage bonus: raise judge to 6 → +4d4 that round
//   • Turn order: odd rounds low→high appeal; even rounds high→low
//   • Move repetition: same move twice in a row = 0 appeal (voltage still changes)
//   • Introduction stage bonuses
//   • Rounds = number of participants (standard)
// ============================================================

import React, { useState, useMemo } from 'react';
import { parseDice } from '../../utils/dataUtils.js';
import { useGameData } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

// ── Constants ──────────────────────────────────────────────────────────────

const CONTEST_TYPES = [
    { id: 'Cool',   color: '#2196f3', icon: '😎' },
    { id: 'Beauty', color: '#e91e63', icon: '💎' },
    { id: 'Cute',   color: '#ff9800', icon: '🌸' },
    { id: 'Smart',  color: '#4caf50', icon: '🔮' },
    { id: 'Tough',  color: '#795548', icon: '💪' },
];

// Type pentagon: Cool – Beauty – Cute – Smart – Tough
// Adjacent = neighbors on pentagon, Opposite = 2 steps away
const TYPE_ADJACENT = {
    Cool:   ['Beauty', 'Tough'],
    Beauty: ['Cool',   'Cute'],
    Cute:   ['Beauty', 'Smart'],
    Smart:  ['Cute',   'Tough'],
    Tough:  ['Smart',  'Cool'],
};

// 'same' | 'adjacent' | 'opposite'
const getTypeRelation = (moveType, contestType) => {
    if (!moveType || !contestType) return 'adjacent';
    if (moveType === contestType) return 'same';
    if (TYPE_ADJACENT[contestType]?.includes(moveType)) return 'adjacent';
    return 'opposite';
};

const ctColor = (id) => CONTEST_TYPES.find(t => t.id === id)?.color || '#667eea';
const ctIcon  = (id) => CONTEST_TYPES.find(t => t.id === id)?.icon  || '🎭';

// ── Dice helpers ───────────────────────────────────────────────────────────

const rollD4s = (count) =>
    Array.from({ length: count }, () => Math.floor(Math.random() * 4) + 1);

const rollDiceStr = (diceStr) => {
    const { count, sides, bonus } = parseDice(diceStr);
    if (!count || !sides) return { rolls: [], bonus: 0, total: 0 };
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    return { rolls, bonus, total: rolls.reduce((a, b) => a + b, 0) + bonus };
};

// ── Sub-components ─────────────────────────────────────────────────────────

const VoltageBar = ({ voltage, color }) => (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
                width: 12, height: 12, borderRadius: 2,
                background: i < voltage ? color : 'var(--border-light)',
                border: `1px solid ${i < voltage ? color : 'var(--border-medium, #ccc)'}`,
                transition: 'background 0.2s',
                boxShadow: i < voltage ? `0 0 4px ${color}66` : 'none',
            }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2, fontWeight: 700 }}>
            {voltage}/6
        </span>
    </div>
);

const JudgeCard = ({ judge, color, selected, onSelect, disabled }) => (
    <button
        onClick={() => !disabled && onSelect(judge.id)}
        disabled={disabled}
        style={{
            flex: 1, padding: '10px 8px', borderRadius: 8,
            border: `2px solid ${selected ? color : 'var(--border-light)'}`,
            background: selected ? `${color}18` : 'var(--surface-bg)',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.15s',
            textAlign: 'center',
        }}
        title={`Appeal to Judge ${judge.id} (Voltage ${judge.voltage}/6)`}
    >
        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? color : 'var(--text-primary)', marginBottom: 4 }}>
            Judge {judge.id}
        </div>
        <VoltageBar voltage={judge.voltage} color={color} />
        {judge.voltage === 6 && (
            <div style={{ fontSize: 10, color: '#ff9800', fontWeight: 700, marginTop: 2 }}>MAX ⚡</div>
        )}
    </button>
);

// ── Main component ─────────────────────────────────────────────────────────

const ContestRunner = () => {
    const { GAME_DATA } = useGameData();

    // Setup state
    const [contestType, setContestType] = useState('');
    const [participants, setParticipants] = useState([]);
    const [newName, setNewName] = useState('');
    const [newMove, setNewMove] = useState('');
    const [newIntro, setNewIntro] = useState('0');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);

    // Appeal state
    const [manualScore, setManualScore] = useState(''); // manual score input for current turn
    const [phase, setPhase] = useState('setup'); // 'setup' | 'appeal' | 'results'
    const [round, setRound] = useState(0);
    const [judges, setJudges] = useState([
        { id: 1, voltage: 1 },
        { id: 2, voltage: 1 },
        { id: 3, voltage: 1 },
    ]);
    const [turnOrder, setTurnOrder] = useState([]);   // participant IDs in appeal order
    const [turnIdx,   setTurnIdx]   = useState(0);    // which position we're at
    const [pendingJudge, setPendingJudge] = useState(null); // judge selected, not yet rolled
    const [lastMoves, setLastMoves] = useState({});   // { [participantId]: moveName }
    const [log, setLog] = useState([]);               // { text, color }

    // numRounds = number of participants (standard rule)
    const numRounds = participants.length || 4;

    // ── Move data helpers ──────────────────────────────────────────────────

    const contestMoves = useMemo(() => {
        if (!contestType || !GAME_DATA?.moves) return {};
        return Object.fromEntries(
            Object.entries(GAME_DATA.moves)
                .filter(([, m]) => m.contestType === contestType && m.contestDice)
                .map(([name, m]) => [name, { dice: m.contestDice, keyword: m.contestEffect || '' }])
        );
    }, [contestType, GAME_DATA?.moves]);

    const resolveMoveData = (moveName) => {
        if (!moveName?.trim() || !GAME_DATA?.moves) return null;
        const key = Object.keys(GAME_DATA.moves).find(
            k => k.toLowerCase() === moveName.trim().toLowerCase()
        );
        return key ? GAME_DATA.moves[key] : null;
    };

    // ── Setup actions ──────────────────────────────────────────────────────

    const handleAddParticipant = () => {
        if (!newName.trim()) { toast.warning('Enter a participant name.'); return; }
        const moveData = resolveMoveData(newMove);
        setParticipants(prev => [...prev, {
            id: Date.now(),
            name: newName.trim(),
            moveName:        newMove.trim() || '—',
            diceStr:         moveData?.contestDice  || '1d4',
            moveContestType: moveData?.contestType  || '',
            contestKeyword:  moveData?.contestEffect || '',
            introBonus:      parseInt(newIntro) || 0,
            rounds:          [],
        }]);
        setNewName(''); setNewMove(''); setNewIntro('0');
    };

    const handleRemoveParticipant = (id) =>
        setParticipants(prev => prev.filter(p => p.id !== id));

    // Parse pasted player results. Each line: "Name | Move" or "Name | Move | Score"
    const handleImport = () => {
        const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
        let added = 0;
        for (const line of lines) {
            const parts = line.split('|').map(s => s.trim());
            const name = parts[0];
            if (!name) continue;
            const moveName = parts[1] || '';
            const moveData = resolveMoveData(moveName);
            setParticipants(prev => [...prev, {
                id: Date.now() + Math.random(),
                name,
                moveName:        moveName || '—',
                diceStr:         moveData?.contestDice  || '1d4',
                moveContestType: moveData?.contestType  || '',
                contestKeyword:  moveData?.contestEffect || '',
                introBonus:      0,
                rounds:          [],
            }]);
            added++;
        }
        if (added > 0) {
            toast.success(`Imported ${added} participant${added > 1 ? 's' : ''}.`);
            setImportText('');
            setShowImport(false);
        } else {
            toast.warning('No valid lines found. Use "Name | Move" format.');
        }
    };

    const computeTurnOrder = (pList, rnd) => {
        const sorted = [...pList].sort((a, b) => {
            const diff = getTotal(a) - getTotal(b);
            return rnd % 2 === 1 ? diff : -diff; // odd: low→high; even: high→low
        });
        return sorted.map(p => p.id);
    };

    const handleStart = () => {
        if (!contestType) { toast.warning('Select a contest type first.'); return; }
        if (participants.length < 2) { toast.warning('Need at least 2 participants.'); return; }
        const order = computeTurnOrder(participants, 1);
        setTurnOrder(order);
        setTurnIdx(0);
        setRound(1);
        setPhase('appeal');
        setLog([]);
        setJudges([{ id: 1, voltage: 1 }, { id: 2, voltage: 1 }, { id: 3, voltage: 1 }]);
        setLastMoves({});
        setPendingJudge(null);
    };

    // ── Appeal actions ─────────────────────────────────────────────────────

    const getTotal = (p) =>
        (p.introBonus || 0) + p.rounds.reduce((sum, r) => sum + r.appeal, 0);

    const currentParticipantId = turnOrder[turnIdx];
    const currentParticipant   = participants.find(p => p.id === currentParticipantId);
    const allDoneThisRound     = turnIdx >= participants.length;

    // manualOverride: number provided by GM (player's reported score). If set, skip dice.
    const handleRoll = (manualOverride = null) => {
        if (!pendingJudge || !currentParticipant) return;

        const p      = currentParticipant;
        const judge  = judges.find(j => j.id === pendingJudge);
        const typeRel = getTypeRelation(p.moveContestType, contestType);
        const isSameMove = p.moveName !== '—' && lastMoves[p.id] === p.moveName;

        let appeal = 0;
        let baseRolls = [], baseBonus = 0;
        let typeBonusRolls = [];
        let maxVoltageBonusRolls = [];

        if (isSameMove) {
            appeal = 0;
        } else if (manualOverride !== null) {
            // GM entered the player's reported score — use it directly, no dice breakdown
            appeal = manualOverride;
        } else {
            const base = rollDiceStr(p.diceStr);
            baseRolls = base.rolls;
            baseBonus = base.bonus;
            appeal = base.total;

            // +1d4 type bonus when move matches contest type
            if (typeRel === 'same') {
                typeBonusRolls = rollD4s(1);
                appeal += typeBonusRolls[0];
            }
        }

        // Voltage change
        let newVoltage = judge.voltage;
        let voltageChange = 0;
        if (typeRel === 'same' && judge.voltage < 6) {
            newVoltage = judge.voltage + 1;
            voltageChange = +1;
            // Max voltage bonus: +4d4 to the performer who raised it to 6
            if (newVoltage === 6) {
                maxVoltageBonusRolls = rollD4s(4);
                appeal += maxVoltageBonusRolls.reduce((a, b) => a + b, 0);
            }
        } else if (typeRel === 'opposite' && judge.voltage > 1) {
            newVoltage = judge.voltage - 1;
            voltageChange = -1;
        }

        // Commit judge voltage
        const newJudges = judges.map(j =>
            j.id === pendingJudge ? { ...j, voltage: newVoltage } : j
        );
        setJudges(newJudges);

        // Record result
        const roundResult = {
            judgeId: pendingJudge,
            appeal,
            baseRolls, baseBonus,
            typeBonusRolls,
            maxVoltageBonusRolls,
            isSameMove,
            typeRel,
            voltageChange,
        };
        setParticipants(prev => prev.map(p2 =>
            p2.id === p.id ? { ...p2, rounds: [...p2.rounds, roundResult] } : p2
        ));
        setLastMoves(prev => ({ ...prev, [p.id]: p.moveName }));

        // Log entry
        let logParts = [`${p.name} → J${pendingJudge}: `];
        if (isSameMove) {
            logParts.push('SAME MOVE — 0 appeal');
        } else if (manualOverride !== null) {
            logParts.push(`[manual] = ${appeal}`);
        } else {
            logParts.push(`[${baseRolls.join(',')}]${baseBonus ? `+${baseBonus}` : ''}`);
            if (typeBonusRolls.length) logParts.push(`+[${typeBonusRolls[0]}] type bonus`);
            if (maxVoltageBonusRolls.length)
                logParts.push(`+[${maxVoltageBonusRolls.join(',')}] MAX VOLTAGE`);
            logParts.push(`= ${appeal}`);
        }
        if (voltageChange !== 0)
            logParts.push(`· J${pendingJudge} ⚡${voltageChange > 0 ? '▲' : '▼'}${newVoltage}`);

        const logColor = maxVoltageBonusRolls.length
            ? '#ff9800'
            : voltageChange > 0 ? '#4caf50' : voltageChange < 0 ? '#f44336' : 'var(--text-secondary)';

        setLog(prev => [...prev, { text: logParts.join(' '), color: logColor }]);
        setPendingJudge(null);
        setManualScore('');
        setTurnIdx(ti => ti + 1);
    };

    const handleNextRound = () => {
        const nextRound = round + 1;
        if (nextRound > numRounds) {
            setPhase('results');
            return;
        }
        const updatedParticipants = participants; // already updated via setParticipants above
        const order = computeTurnOrder(updatedParticipants, nextRound);
        setTurnOrder(order);
        setTurnIdx(0);
        setPendingJudge(null);
        setRound(nextRound);
    };

    const handleReset = () => {
        setPhase('setup');
        setRound(0);
        setParticipants([]);
        setContestType('');
        setJudges([{ id: 1, voltage: 1 }, { id: 2, voltage: 1 }, { id: 3, voltage: 1 }]);
        setTurnOrder([]);
        setTurnIdx(0);
        setPendingJudge(null);
        setLastMoves({});
        setLog([]);
        setManualScore('');
        setImportText('');
        setShowImport(false);
    };

    const sortedByAppeal = [...participants].sort((a, b) => getTotal(b) - getTotal(a));
    const typeInfo = CONTEST_TYPES.find(t => t.id === contestType);
    const color    = typeInfo?.color || '#667eea';

    // ── Setup phase ────────────────────────────────────────────────────────

    if (phase === 'setup') {
        const movePreview = resolveMoveData(newMove);
        const moveMatchesContest = movePreview?.contestType === contestType;

        return (
            <div>
                <h3 style={{ marginBottom: 4, fontWeight: 700 }}>🎭 Contest Runner</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Runs a full PTA contest: 3 judges with Voltage, type-based appeal bonuses, and alternating
                    turn order. Rounds equal number of participants (standard rule).
                </p>

                {/* Contest type selector */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">🏆 Contest Type</h3>
                    <div style={{ padding: '10px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {CONTEST_TYPES.map(ct => (
                            <button
                                key={ct.id}
                                onClick={() => setContestType(ct.id)}
                                style={{
                                    padding: '8px 18px', borderRadius: 8,
                                    border: `2px solid ${contestType === ct.id ? ct.color : 'var(--border-light)'}`,
                                    background: contestType === ct.id ? ct.color : 'var(--surface-bg)',
                                    color: contestType === ct.id ? 'white' : 'var(--text-primary)',
                                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {ct.icon} {ct.id}
                            </button>
                        ))}
                    </div>
                    {contestType && (
                        <div style={{ padding: '0 16px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
                            <strong>Adjacent</strong> (no voltage effect): {TYPE_ADJACENT[contestType]?.join(', ')} &nbsp;·&nbsp;
                            <strong>Opposite</strong> (−1 voltage):&nbsp;
                            {CONTEST_TYPES.filter(t => t.id !== contestType && !TYPE_ADJACENT[contestType]?.includes(t.id)).map(t => t.id).join(', ')}
                        </div>
                    )}
                </div>

                {/* Add participants */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 className="card-header font-bold">👥 Participants</h3>
                        <button
                            onClick={() => setShowImport(v => !v)}
                            style={{ margin: '0 16px 0 0', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-light)', background: showImport ? '#667eea' : 'var(--surface-bg)', color: showImport ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                            📋 Import from players
                        </button>
                    </div>
                    {showImport && (
                        <div style={{ padding: '0 16px 10px' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Paste player results (one per line): <code style={{ fontSize: 11 }}>Name | Move</code>
                                <br />Players can copy from the move detail view in the app.
                            </div>
                            <textarea
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                placeholder={"Ash's Pikachu | Thunderbolt\nMisty's Starmie | Psybeam\nBrock's Onix | Rock Slide"}
                                rows={4}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                            <button
                                onClick={handleImport}
                                disabled={!importText.trim()}
                                style={{ marginTop: 6, padding: '7px 16px', borderRadius: 6, border: 'none', background: importText.trim() ? '#667eea' : 'var(--border-light)', color: importText.trim() ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: importText.trim() ? 'pointer' : 'not-allowed' }}
                            >
                                + Add All
                            </button>
                        </div>
                    )}
                    <div style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <input
                                type="text"
                                placeholder="Name (Pokémon / trainer)..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                                style={{ flex: 2, minWidth: 120, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <input
                                type="text"
                                placeholder="Contest move (optional)..."
                                value={newMove}
                                onChange={e => setNewMove(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                                style={{ flex: 2, minWidth: 140, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <input
                                type="number"
                                placeholder="Intro bonus"
                                value={newIntro}
                                onChange={e => setNewIntro(e.target.value)}
                                title="Introduction stage bonus (accessories, grooming, held items)"
                                min="0"
                                style={{ width: 80, padding: '7px 8px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center' }}
                            />
                            <button
                                onClick={handleAddParticipant}
                                style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#667eea', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Move preview */}
                        {newMove.trim() && (
                            <div style={{ fontSize: 12, marginBottom: 8,
                                color: movePreview ? (moveMatchesContest ? '#2e7d32' : 'var(--text-secondary)') : '#e65100'
                            }}>
                                {movePreview
                                    ? `✓ ${newMove.trim()} · ${movePreview.contestType} · ${movePreview.contestDice || '1d4'}${movePreview.contestEffect ? ` · ${movePreview.contestEffect}` : ''}${!moveMatchesContest && contestType ? ` (${getTypeRelation(movePreview.contestType, contestType)} type — ${getTypeRelation(movePreview.contestType, contestType) === 'opposite' ? '−1 voltage' : 'no voltage effect'})` : ''}`
                                    : `⚠ Move not found — will use 1d4 fallback`
                                }
                            </div>
                        )}

                        {/* Participant list */}
                        {participants.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                                No participants yet. Add at least 2 to start.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {participants.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '7px 12px', borderRadius: 8,
                                        background: 'var(--bg-light, #f5f5f5)', border: '1px solid var(--border-light)'
                                    }}>
                                        <span style={{ fontWeight: 700, flex: 1, fontSize: 14 }}>{p.name}</span>
                                        {p.introBonus > 0 && (
                                            <span style={{ fontSize: 11, color: '#ff9800', fontWeight: 700 }}>+{p.introBonus} intro</span>
                                        )}
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {p.moveName !== '—'
                                                ? <>{p.moveName} <span style={{ color: ctColor(p.moveContestType), fontWeight: 700 }}>({p.diceStr})</span></>
                                                : <span style={{ fontStyle: 'italic' }}>no move · 1d4</span>
                                            }
                                        </span>
                                        {p.contestKeyword && (
                                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${ctColor(p.moveContestType)}22`, color: ctColor(p.moveContestType), fontWeight: 700 }}>
                                                {p.contestKeyword}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveParticipant(p.id)}
                                            style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                                            aria-label={`Remove ${p.name}`}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Contest moves reference chips */}
                        {contestType && Object.keys(contestMoves).length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>
                                    {contestType} moves — click to fill:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                                    {Object.entries(contestMoves).map(([name, { dice, keyword }]) => (
                                        <span
                                            key={name}
                                            onClick={() => setNewMove(name)}
                                            title={keyword || undefined}
                                            style={{
                                                padding: '2px 8px', borderRadius: 10, fontSize: 11,
                                                background: `${color}18`, border: `1px solid ${color}44`,
                                                color: 'var(--text-primary)', cursor: 'pointer',
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
                            ? 'var(--border-light)'
                            : `linear-gradient(135deg, ${color}, ${color}cc)`,
                        color: !contestType || participants.length < 2 ? 'var(--text-muted)' : 'white',
                        fontWeight: 800, fontSize: 15,
                        cursor: !contestType || participants.length < 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {typeInfo?.icon} Start {contestType || '...'} Contest ({participants.length} rounds)
                </button>
            </div>
        );
    }

    // ── Results phase ──────────────────────────────────────────────────────

    if (phase === 'results') {
        const winner = sortedByAppeal[0];
        return (
            <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 40 }}>🏆</div>
                    <h3 style={{ fontWeight: 800, fontSize: 20, color, margin: '4px 0' }}>
                        {typeInfo?.icon} {contestType} Contest Results
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                        Winner: <strong>{winner?.name}</strong> with {getTotal(winner || {})} appeal!
                    </p>
                </div>

                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">📊 Final Standings</h3>
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {sortedByAppeal.map((p, idx) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 8,
                                background: idx === 0 ? `${color}18` : 'var(--surface-bg)',
                                border: `1px solid ${idx === 0 ? color + '66' : 'var(--border-light)'}`,
                            }}>
                                <span style={{ fontSize: 18, width: 28 }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                </span>
                                <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                                {p.introBonus > 0 && (
                                    <span style={{ fontSize: 11, color: '#ff9800' }}>+{p.introBonus} intro</span>
                                )}
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                                    {p.rounds.map((r, i) => (
                                        <span key={i}>R{i + 1}:&nbsp;
                                            <strong style={{ color: r.isSameMove ? '#f44336' : r.maxVoltageBonusRolls?.length ? '#ff9800' : 'var(--text-primary)' }}>
                                                {r.appeal}
                                            </strong>
                                        </span>
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: 22, fontWeight: 800, minWidth: 40, textAlign: 'right',
                                    color: idx === 0 ? color : 'var(--text-primary)',
                                }}>
                                    {getTotal(p)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Round log */}
                {log.length > 0 && (
                    <div className="card-orange" style={{ marginBottom: 14 }}>
                        <h3 className="card-header font-bold">📜 Appeal Log</h3>
                        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                            {log.map((entry, i) => (
                                <div key={i} style={{ fontSize: 12, color: entry.color, fontFamily: 'monospace' }}>
                                    {entry.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleReset}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                    ↺ New Contest
                </button>
            </div>
        );
    }

    // ── Appeal phase ───────────────────────────────────────────────────────

    const isSameMove = currentParticipant &&
        currentParticipant.moveName !== '—' &&
        lastMoves[currentParticipant.id] === currentParticipant.moveName;

    const typeRel = currentParticipant
        ? getTypeRelation(currentParticipant.moveContestType, contestType)
        : 'adjacent';

    return (
        <div>
            {/* Header: contest type + round progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>{typeInfo?.icon}</span>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color }}>
                        {contestType} Contest
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        Round {round} of {numRounds} &nbsp;·&nbsp;
                        {round % 2 === 1 ? 'Lowest→Highest appeal order' : 'Highest→Lowest appeal order'}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {Array.from({ length: numRounds }, (_, i) => (
                        <div key={i} style={{
                            width: 22, height: 8, borderRadius: 4,
                            background: i + 1 < round ? color : i + 1 === round ? color + '88' : 'var(--border-light)'
                        }} />
                    ))}
                </div>
            </div>

            {/* Judges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {judges.map(j => (
                    <JudgeCard
                        key={j.id}
                        judge={j}
                        color={color}
                        selected={pendingJudge === j.id}
                        onSelect={setPendingJudge}
                        disabled={allDoneThisRound || !currentParticipant}
                    />
                ))}
            </div>

            {/* Current turn */}
            {!allDoneThisRound && currentParticipant ? (
                <div style={{
                    padding: '14px 16px', borderRadius: 10, marginBottom: 14,
                    background: `${color}12`, border: `2px solid ${color}55`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 800, fontSize: 16 }}>{currentParticipant.name}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 10 }}>
                                {currentParticipant.moveName !== '—'
                                    ? <>{currentParticipant.moveName}
                                        <span style={{ color: ctColor(currentParticipant.moveContestType), fontWeight: 700, marginLeft: 6 }}>
                                            {currentParticipant.diceStr}
                                        </span>
                                        {currentParticipant.contestKeyword && (
                                            <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                                [{currentParticipant.contestKeyword}]
                                            </span>
                                        )}
                                    </>
                                    : <span style={{ fontStyle: 'italic' }}>no move · 1d4</span>
                                }
                            </span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                            Total so far: <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{getTotal(currentParticipant)}</strong>
                        </div>
                    </div>

                    {/* Type relation hint */}
                    {currentParticipant.moveContestType && (
                        <div style={{ fontSize: 12, marginBottom: 10,
                            color: typeRel === 'same' ? '#2e7d32' : typeRel === 'opposite' ? '#c62828' : 'var(--text-muted)'
                        }}>
                            {typeRel === 'same'    && `✓ ${currentParticipant.moveContestType} move in a ${contestType} contest → +1d4 bonus + raises judge voltage`}
                            {typeRel === 'opposite' && `⚠ ${currentParticipant.moveContestType} move in a ${contestType} contest → lowers judge voltage`}
                            {typeRel === 'adjacent' && `${currentParticipant.moveContestType} move → no voltage effect`}
                            {isSameMove && <span style={{ color: '#c62828', fontWeight: 700, marginLeft: 8 }}>SAME MOVE AS LAST ROUND — 0 appeal!</span>}
                        </div>
                    )}
                    {isSameMove && !currentParticipant.moveContestType && (
                        <div style={{ fontSize: 12, color: '#c62828', fontWeight: 700, marginBottom: 10 }}>
                            ⚠ Same move as last round — 0 appeal (voltage still changes)
                        </div>
                    )}

                    {/* Judge select prompt + Roll / Manual entry */}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {pendingJudge ? `Appealing to Judge ${pendingJudge}` : '← Select a judge above, then roll or enter score'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Manual score input */}
                        <input
                            type="number"
                            min="0"
                            placeholder="Player's score…"
                            value={manualScore}
                            onChange={e => setManualScore(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && pendingJudge && manualScore !== '') {
                                    const v = parseInt(manualScore);
                                    if (!isNaN(v)) handleRoll(v);
                                }
                            }}
                            disabled={!pendingJudge}
                            title="Enter the player's reported appeal score, or leave blank and click Roll"
                            style={{
                                width: 110, padding: '8px 10px', borderRadius: 7,
                                border: `1.5px solid ${pendingJudge ? color + '88' : 'var(--border-light)'}`,
                                background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                fontSize: 14, fontWeight: 700, textAlign: 'center',
                                opacity: pendingJudge ? 1 : 0.5,
                            }}
                        />
                        <button
                            onClick={() => { const v = parseInt(manualScore); if (!isNaN(v)) handleRoll(v); }}
                            disabled={!pendingJudge || manualScore === '' || isNaN(parseInt(manualScore))}
                            style={{
                                padding: '9px 16px', borderRadius: 7, border: 'none',
                                background: pendingJudge && manualScore !== '' && !isNaN(parseInt(manualScore))
                                    ? `linear-gradient(135deg, #4caf50, #388e3c)`
                                    : 'var(--border-light)',
                                color: pendingJudge && manualScore !== '' ? 'white' : 'var(--text-muted)',
                                fontWeight: 700, fontSize: 13,
                                cursor: pendingJudge && manualScore !== '' ? 'pointer' : 'not-allowed',
                            }}
                        >
                            ✓ Set Score
                        </button>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or</span>
                        <button
                            onClick={() => handleRoll()}
                            disabled={!pendingJudge}
                            style={{
                                marginLeft: 'auto',
                                padding: '9px 24px', borderRadius: 7, border: 'none',
                                background: pendingJudge ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'var(--border-light)',
                                color: pendingJudge ? 'white' : 'var(--text-muted)',
                                fontWeight: 800, fontSize: 15,
                                cursor: pendingJudge ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s',
                            }}
                        >
                            🎲 Roll Appeal
                        </button>
                    </div>
                </div>
            ) : (
                /* All rolled — show Next Round button */
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 14,
                    background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4caf50', marginBottom: 8 }}>
                        ✓ All participants have appealed this round
                    </div>
                    <button
                        onClick={handleNextRound}
                        style={{
                            padding: '10px 28px', borderRadius: 7, border: 'none',
                            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                            color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        {round < numRounds ? `Next Round (${round + 1}/${numRounds}) →` : '🏆 View Results'}
                    </button>
                </div>
            )}

            {/* Turn order list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {turnOrder.map((id, pos) => {
                    const p = participants.find(x => x.id === id);
                    if (!p) return null;
                    const done = pos < turnIdx;
                    const isCurrent = pos === turnIdx;
                    const rResult = done ? p.rounds[p.rounds.length - 1] : null;
                    return (
                        <div key={id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '7px 12px', borderRadius: 8,
                            background: isCurrent ? `${color}18` : done ? 'var(--surface-bg)' : 'var(--bg-light, #f9f9f9)',
                            border: `1px solid ${isCurrent ? color + '66' : 'var(--border-light)'}`,
                            opacity: done && !isCurrent ? 0.7 : 1,
                        }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 20 }}>
                                {done ? '✓' : isCurrent ? '▶' : `${pos + 1}`}
                            </span>
                            <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 13, flex: 1 }}>{p.name}</span>
                            {done && rResult && (
                                <span style={{ fontSize: 12 }}>
                                    J{rResult.judgeId} &nbsp;
                                    <strong style={{
                                        color: rResult.isSameMove ? '#f44336' : rResult.maxVoltageBonusRolls?.length ? '#ff9800' : 'var(--text-primary)'
                                    }}>
                                        {rResult.isSameMove ? '0 (same)' : `+${rResult.appeal}`}
                                    </strong>
                                    {rResult.voltageChange !== 0 && (
                                        <span style={{ marginLeft: 6, color: rResult.voltageChange > 0 ? '#4caf50' : '#f44336', fontSize: 11 }}>
                                            J{rResult.judgeId} ⚡{rResult.voltageChange > 0 ? '▲' : '▼'}
                                        </span>
                                    )}
                                </span>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right', color }}>
                                {getTotal(p)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Recent log entries */}
            {log.length > 0 && (
                <div style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                    maxHeight: 90, overflowY: 'auto',
                }}>
                    {log.slice(-5).map((entry, i) => (
                        <div key={i} style={{ fontSize: 11, color: entry.color, fontFamily: 'monospace', lineHeight: '1.6' }}>
                            {entry.text}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContestRunner;
