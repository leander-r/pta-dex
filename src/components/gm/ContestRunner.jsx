// ============================================================
// Contest Runner — PTA Player's Handbook 2, Contests chapter
// Rules implemented:
//   • 3 Judges with Voltage (1–6)
//   • Judge targeting per turn (player declares, GM selects)
//   • Type relations: same (+1 voltage, +1d4) / opposite (-1 voltage) / adjacent (no effect)
//   • Max voltage bonus: raise judge to 6 → +4d4 that round
//   • Turn order: odd rounds low→high appeal; even rounds high→low
//   • Move repetition: same move twice in a row = 0 appeal (voltage still changes)
//   • Rounds = number of participants (standard)
//
// Workflow:
//   Setup  → GM enters participant names only (Trainer + Pokémon)
//   Appeal → Player rolls in Dice Roller → copies result → GM pastes here
//            GM selects which judge the player declared → Confirm
//            NPC entries: GM picks move and rolls directly
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

const TYPE_ADJACENT = {
    Cool:   ['Beauty', 'Tough'],
    Beauty: ['Cool',   'Cute'],
    Cute:   ['Beauty', 'Smart'],
    Smart:  ['Cute',   'Tough'],
    Tough:  ['Smart',  'Cool'],
};

const getTypeRelation = (moveType, contestType) => {
    if (!moveType || !contestType) return 'adjacent';
    if (moveType === contestType) return 'same';
    if (TYPE_ADJACENT[contestType]?.includes(moveType)) return 'adjacent';
    return 'opposite';
};

const ctColor = (id) => CONTEST_TYPES.find(t => t.id === id)?.color || '#667eea';

// ── Dice helpers ───────────────────────────────────────────────────────────

const rollD4s = (count) =>
    Array.from({ length: count }, () => Math.floor(Math.random() * 4) + 1);

const rollDiceStr = (diceStr) => {
    const { count, sides, bonus } = parseDice(diceStr);
    if (!count || !sides) return { rolls: [], bonus: 0, total: 0 };
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    return { rolls, bonus, total: rolls.reduce((a, b) => a + b, 0) + bonus };
};

// Parse a string copied from ContestPanel's "Copy for GM" button.
// Format: Name | Move | ContestType | Score | Effect  (effect optional)
// Also accepts: Name | Move | Score  (older 3-field format)
const parsePasteInput = (text) => {
    if (!text?.trim()) return null;
    const parts = text.split('|').map(s => s.trim());
    if (parts.length >= 4) {
        const score = parseInt(parts[3]);
        if (isNaN(score)) return null;
        return {
            name:            parts[0],
            moveName:        parts[1],
            moveContestType: parts[2],
            score,
            effect:          parts[4] || '',
        };
    }
    if (parts.length === 3) {
        const score = parseInt(parts[2]);
        if (isNaN(score)) return null;
        return { name: parts[0], moveName: parts[1], moveContestType: '', score, effect: '' };
    }
    return null;
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

const StepLabel = ({ n, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
            width: 20, height: 20, borderRadius: '50%', background: '#667eea', color: 'white',
            fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────

const ContestRunner = () => {
    const { GAME_DATA } = useGameData();

    // ── Setup state ────────────────────────────────────────────────────────
    const [contestType, setContestType] = useState('');
    const [participants, setParticipants] = useState([]);
    const [newName, setNewName] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);

    // ── Appeal state ───────────────────────────────────────────────────────
    const [phase, setPhase] = useState('setup');
    const [round, setRound] = useState(0);
    const [judges, setJudges] = useState([
        { id: 1, voltage: 1 },
        { id: 2, voltage: 1 },
        { id: 3, voltage: 1 },
    ]);
    const [turnOrder,    setTurnOrder]    = useState([]);
    const [turnIdx,      setTurnIdx]      = useState(0);
    const [pendingJudge, setPendingJudge] = useState(null);
    const [lastMoves,    setLastMoves]    = useState({});
    const [log,          setLog]          = useState([]);

    // Player paste path
    const [pastedText,  setPastedText]  = useState('');
    const [parsedPaste, setParsedPaste] = useState(null);

    // NPC roll path
    const [npcMoveName, setNpcMoveName] = useState('');

    const numRounds = participants.length || 4;

    // ── Move data helpers ──────────────────────────────────────────────────

    const resolveMoveData = (moveName) => {
        if (!moveName?.trim() || !GAME_DATA?.moves) return null;
        const key = Object.keys(GAME_DATA.moves).find(
            k => k.toLowerCase() === moveName.trim().toLowerCase()
        );
        return key ? GAME_DATA.moves[key] : null;
    };

    // NPC reference chips for the selected contest type
    const npcMoveOptions = useMemo(() => {
        if (!contestType || !GAME_DATA?.moves) return {};
        return Object.fromEntries(
            Object.entries(GAME_DATA.moves)
                .filter(([, m]) => m.contestType === contestType && m.contestDice)
                .map(([name, m]) => [name, { dice: m.contestDice, keyword: m.contestEffect || '' }])
        );
    }, [contestType, GAME_DATA?.moves]);

    // ── Setup actions ──────────────────────────────────────────────────────

    const handleAddParticipant = () => {
        if (!newName.trim()) { toast.warning('Enter a participant name.'); return; }
        setParticipants(prev => [...prev, { id: Date.now(), name: newName.trim(), rounds: [] }]);
        setNewName('');
    };

    const handleRemoveParticipant = (id) =>
        setParticipants(prev => prev.filter(p => p.id !== id));

    const handleImport = () => {
        const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { toast.warning('No names found.'); return; }
        lines.forEach(name => {
            setParticipants(prev => [...prev, { id: Date.now() + Math.random(), name, rounds: [] }]);
        });
        toast.success(`Added ${lines.length} participant${lines.length > 1 ? 's' : ''}.`);
        setImportText('');
        setShowImport(false);
    };

    const computeTurnOrder = (pList, rnd) => {
        const sorted = [...pList].sort((a, b) => {
            const diff = getTotal(a) - getTotal(b);
            return rnd % 2 === 1 ? diff : -diff;
        });
        return sorted.map(p => p.id);
    };

    const handleStart = () => {
        if (!contestType) { toast.warning('Select a contest type first.'); return; }
        if (participants.length < 2) { toast.warning('Need at least 2 participants.'); return; }
        setTurnOrder(computeTurnOrder(participants, 1));
        setTurnIdx(0);
        setRound(1);
        setPhase('appeal');
        setLog([]);
        setJudges([{ id: 1, voltage: 1 }, { id: 2, voltage: 1 }, { id: 3, voltage: 1 }]);
        setLastMoves({});
        setPendingJudge(null);
        setPastedText('');
        setParsedPaste(null);
        setNpcMoveName('');
    };

    // ── Appeal helpers ─────────────────────────────────────────────────────

    const getTotal = (p) => p.rounds.reduce((sum, r) => sum + r.appeal, 0);

    const currentParticipantId = turnOrder[turnIdx];
    const currentParticipant   = participants.find(p => p.id === currentParticipantId);
    const allDoneThisRound     = turnIdx >= participants.length;

    const handlePasteChange = (text) => {
        setPastedText(text);
        setParsedPaste(parsePasteInput(text));
    };

    // Core roll: takes move data + optional pre-determined score (player paste)
    const handleRoll = ({ moveName, moveContestType, diceStr, effect = '', manualScore = null }) => {
        if (!pendingJudge || !currentParticipant) return;

        const p         = currentParticipant;
        const judge     = judges.find(j => j.id === pendingJudge);
        const typeRel   = getTypeRelation(moveContestType, contestType);
        const isSameMove = p.rounds.length > 0 && lastMoves[p.id] === moveName;

        let appeal = 0;
        let baseRolls = [], baseBonus = 0, typeBonusRolls = [], maxVoltageBonusRolls = [];

        if (isSameMove) {
            appeal = 0;
        } else if (manualScore !== null) {
            appeal = manualScore;
        } else {
            const base = rollDiceStr(diceStr || '1d4');
            baseRolls = base.rolls;
            baseBonus = base.bonus;
            appeal = base.total;
            if (typeRel === 'same') {
                typeBonusRolls = rollD4s(1);
                appeal += typeBonusRolls[0];
            }
        }

        // Voltage
        let newVoltage = judge.voltage;
        let voltageChange = 0;
        if (typeRel === 'same' && judge.voltage < 6) {
            newVoltage = judge.voltage + 1;
            voltageChange = +1;
            if (newVoltage === 6) {
                maxVoltageBonusRolls = rollD4s(4);
                appeal += maxVoltageBonusRolls.reduce((a, b) => a + b, 0);
            }
        } else if (typeRel === 'opposite' && judge.voltage > 1) {
            newVoltage = judge.voltage - 1;
            voltageChange = -1;
        }

        setJudges(judges.map(j => j.id === pendingJudge ? { ...j, voltage: newVoltage } : j));

        setParticipants(prev => prev.map(p2 =>
            p2.id === p.id ? { ...p2, rounds: [...p2.rounds, {
                judgeId: pendingJudge,
                moveName, moveContestType, effect, diceStr,
                appeal, baseRolls, baseBonus, typeBonusRolls, maxVoltageBonusRolls,
                isSameMove, typeRel, voltageChange,
                isManual: manualScore !== null,
            }] } : p2
        ));
        setLastMoves(prev => ({ ...prev, [p.id]: moveName }));

        // Log
        let logParts = [`${p.name} → J${pendingJudge}: `];
        if (isSameMove) {
            logParts.push('SAME MOVE — 0 appeal');
        } else if (manualScore !== null) {
            logParts.push(`${moveName}${moveContestType ? ` (${moveContestType})` : ''} [player] = ${appeal}`);
        } else {
            logParts.push(`${moveName} [${baseRolls.join(',')}]${baseBonus ? `+${baseBonus}` : ''}`);
            if (typeBonusRolls.length)      logParts.push(`+[${typeBonusRolls[0]}] type`);
            if (maxVoltageBonusRolls.length) logParts.push(`+[${maxVoltageBonusRolls.join(',')}] MAX⚡`);
            logParts.push(`= ${appeal}`);
        }
        if (voltageChange !== 0)
            logParts.push(`· J${pendingJudge} ⚡${voltageChange > 0 ? '▲' : '▼'}${newVoltage}`);

        const logColor = maxVoltageBonusRolls.length ? '#ff9800'
            : voltageChange > 0 ? '#4caf50' : voltageChange < 0 ? '#f44336' : 'var(--text-secondary)';

        setLog(prev => [...prev, { text: logParts.join(' '), color: logColor }]);
        setPendingJudge(null);
        setPastedText('');
        setParsedPaste(null);
        setNpcMoveName('');
        setTurnIdx(ti => ti + 1);
    };

    const handleConfirmPaste = () => {
        if (!parsedPaste || !pendingJudge) return;
        const gameMove = resolveMoveData(parsedPaste.moveName);
        handleRoll({
            moveName:        parsedPaste.moveName,
            moveContestType: parsedPaste.moveContestType || gameMove?.contestType || '',
            diceStr:         gameMove?.contestDice || '1d4',
            effect:          parsedPaste.effect || gameMove?.contestEffect || '',
            manualScore:     parsedPaste.score,
        });
    };

    const handleNpcRoll = () => {
        if (!npcMoveName.trim() || !pendingJudge) return;
        const gameMove = resolveMoveData(npcMoveName);
        handleRoll({
            moveName:        npcMoveName.trim(),
            moveContestType: gameMove?.contestType || '',
            diceStr:         gameMove?.contestDice || '1d4',
            effect:          gameMove?.contestEffect || '',
            manualScore:     null,
        });
    };

    const handleNextRound = () => {
        const nextRound = round + 1;
        if (nextRound > numRounds) { setPhase('results'); return; }
        setTurnOrder(computeTurnOrder(participants, nextRound));
        setTurnIdx(0);
        setPendingJudge(null);
        setRound(nextRound);
        setPastedText('');
        setParsedPaste(null);
        setNpcMoveName('');
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
        setPastedText('');
        setParsedPaste(null);
        setNpcMoveName('');
        setImportText('');
        setShowImport(false);
    };

    const sortedByAppeal = [...participants].sort((a, b) => getTotal(b) - getTotal(a));
    const typeInfo = CONTEST_TYPES.find(t => t.id === contestType);
    const color    = typeInfo?.color || '#667eea';

    // ── Setup phase ────────────────────────────────────────────────────────

    if (phase === 'setup') {
        return (
            <div>
                <h3 style={{ marginBottom: 4, fontWeight: 700 }}>🎭 Contest Runner</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Set up participants, then start the contest. During each turn the player rolls in the
                    Dice Roller and copies their result here. NPC entries roll directly.
                </p>

                {/* Step 1 */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <h3 className="card-header font-bold">
                        <StepLabel n={1} label="Choose Contest Type" />
                    </h3>
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
                                    fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
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

                {/* Step 2 */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 className="card-header font-bold">
                            <StepLabel n={2} label="Add Participants (Trainer + Pokémon)" />
                        </h3>
                        <button
                            onClick={() => setShowImport(v => !v)}
                            style={{ margin: '0 16px 0 0', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-light)', background: showImport ? '#667eea' : 'var(--surface-bg)', color: showImport ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                            📋 Paste list
                        </button>
                    </div>

                    {showImport && (
                        <div style={{ padding: '0 16px 10px' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                One name per line — moves will be declared during the contest.
                            </div>
                            <textarea
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                placeholder={"Ash's Pikachu\nMisty's Starmie\nBrock's Onix"}
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
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                type="text"
                                placeholder="e.g. Ash's Pikachu"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <button
                                onClick={handleAddParticipant}
                                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#667eea', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                + Add
                            </button>
                        </div>

                        {participants.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                                No participants yet. Add at least 2 to start.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {participants.map((p, idx) => (
                                    <div key={p.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 12px', borderRadius: 8,
                                        background: 'var(--bg-light)', border: '1px solid var(--border-light)',
                                    }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 18 }}>{idx + 1}</span>
                                        <span style={{ fontWeight: 600, flex: 1, fontSize: 14 }}>{p.name}</span>
                                        <button
                                            onClick={() => handleRemoveParticipant(p.id)}
                                            style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                                            aria-label={`Remove ${p.name}`}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    disabled={!contestType || participants.length < 2}
                    style={{
                        width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                        background: !contestType || participants.length < 2 ? 'var(--border-light)' : `linear-gradient(135deg, ${color}, ${color}cc)`,
                        color: !contestType || participants.length < 2 ? 'var(--text-muted)' : 'white',
                        fontWeight: 800, fontSize: 15,
                        cursor: !contestType || participants.length < 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {!contestType
                        ? 'Select a contest type to continue'
                        : participants.length < 2
                        ? `Add at least ${2 - participants.length} more participant${2 - participants.length > 1 ? 's' : ''} to start`
                        : `${typeInfo?.icon} Start ${contestType} Contest (${participants.length} rounds)`}
                </button>
            </div>
        );
    }

    // ── Results phase ──────────────────────────────────────────────────────

    if (phase === 'results') {
        const winner = sortedByAppeal[0];

        const copyResults = () => {
            const lines = [`🏆 ${contestType} Contest Results`, ''];
            sortedByAppeal.forEach((p, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                const rounds = p.rounds.map((r, i) => `R${i + 1}:${r.appeal}`).join('  ');
                lines.push(`${medal} ${p.name} — ${getTotal(p)} appeal  (${rounds})`);
            });
            navigator.clipboard.writeText(lines.join('\n')).then(() => toast.success('Results copied!'));
        };

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
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                                        {p.rounds.map((r, i) => (
                                            <span key={i}>
                                                R{i + 1}: <strong style={{ color: r.isSameMove ? '#f44336' : r.maxVoltageBonusRolls?.length ? '#ff9800' : 'var(--text-primary)' }}>
                                                    {r.appeal}
                                                </strong>
                                                {r.moveName && r.moveName !== '—' && (
                                                    <span style={{ color: 'var(--text-muted)', marginLeft: 3 }}>({r.moveName})</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span style={{ fontSize: 24, fontWeight: 800, minWidth: 40, textAlign: 'right', color: idx === 0 ? color : 'var(--text-primary)' }}>
                                    {getTotal(p)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {log.length > 0 && (
                    <div className="card-orange" style={{ marginBottom: 14 }}>
                        <h3 className="card-header font-bold">📜 Appeal Log</h3>
                        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                            {log.map((entry, i) => (
                                <div key={i} style={{ fontSize: 12, color: entry.color, fontFamily: 'monospace' }}>{entry.text}</div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copyResults} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${color}55`, background: `${color}14`, color, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        📋 Copy Results
                    </button>
                    <button onClick={handleReset} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        ↺ New Contest
                    </button>
                </div>
            </div>
        );
    }

    // ── Appeal phase ───────────────────────────────────────────────────────

    const isSameMove = currentParticipant && parsedPaste
        ? lastMoves[currentParticipant.id] === parsedPaste.moveName
        : false;

    const pasteTypeRel = parsedPaste?.moveContestType
        ? getTypeRelation(parsedPaste.moveContestType, contestType)
        : null;

    const nameMatchWarning = parsedPaste && currentParticipant &&
        !currentParticipant.name.toLowerCase().includes(parsedPaste.name.toLowerCase()) &&
        !parsedPaste.name.toLowerCase().includes(currentParticipant.name.toLowerCase());

    const npcMoveData = resolveMoveData(npcMoveName);
    const npcTypeRel  = npcMoveData?.contestType ? getTypeRelation(npcMoveData.contestType, contestType) : null;

    const canConfirmPaste = !!parsedPaste && !!pendingJudge && !isSameMove;
    const canRollNpc      = !!npcMoveName.trim() && !!pendingJudge;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>{typeInfo?.icon}</span>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color }}>{contestType} Contest</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        Round {round} of {numRounds} &nbsp;·&nbsp;
                        {round % 2 === 1 ? 'Lowest → Highest appeal order' : 'Highest → Lowest appeal order'}
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    title="Abandon this contest and return to setup"
                    style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                    ↺ Abandon
                </button>
            </div>

            {/* Judges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {judges.map(j => (
                    <JudgeCard
                        key={j.id} judge={j} color={color}
                        selected={pendingJudge === j.id}
                        onSelect={setPendingJudge}
                        disabled={allDoneThisRound || !currentParticipant}
                    />
                ))}
            </div>

            {/* Current turn */}
            {!allDoneThisRound && currentParticipant ? (
                <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 14, background: `${color}12`, border: `2px solid ${color}55` }}>

                    {/* Who's up */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 800, fontSize: 17 }}>{currentParticipant.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>— it's your turn!</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                            Total: <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{getTotal(currentParticipant)}</strong>
                        </div>
                    </div>

                    {/* SAME MOVE banner */}
                    {isSameMove && (
                        <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 10, background: 'rgba(198,40,40,0.08)', border: '1.5px solid #c62828', color: '#c62828', fontWeight: 700, fontSize: 13 }}>
                            ⚠ Same move as last round — 0 appeal this turn (voltage still applies)
                        </div>
                    )}

                    {/* Judge status */}
                    <div style={{ fontSize: 13, marginBottom: 12, color: pendingJudge ? color : 'var(--text-muted)', fontWeight: pendingJudge ? 700 : 400 }}>
                        {pendingJudge ? `Judge ${pendingJudge} selected` : 'Select a judge above (player declares which one)'}
                    </div>

                    {/* ── Player result paste ── */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Player result
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Paste player's copied result…"
                                value={pastedText}
                                onChange={e => handlePasteChange(e.target.value)}
                                style={{
                                    flex: 1, padding: '9px 10px', borderRadius: 7, fontSize: 13,
                                    border: `1.5px solid ${parsedPaste ? color + '88' : 'var(--border-light)'}`,
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                }}
                            />
                            {pastedText && !parsedPaste && (
                                <span style={{ fontSize: 11, color: '#f44336', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                                    ✗ Can't parse
                                </span>
                            )}
                        </div>

                        {/* Paste preview */}
                        {parsedPaste && (
                            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, background: 'var(--bg-light)', border: `1px solid ${color}44` }}>
                                {nameMatchWarning && (
                                    <div style={{ fontSize: 11, color: '#ff9800', fontWeight: 700, marginBottom: 4 }}>
                                        ⚠ Name "{parsedPaste.name}" doesn't match current participant — check you're entering the right score
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{parsedPaste.moveName || '—'}</span>
                                    {parsedPaste.moveContestType && (
                                        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 8, background: ctColor(parsedPaste.moveContestType), color: 'white', fontWeight: 700 }}>
                                            {parsedPaste.moveContestType}
                                        </span>
                                    )}
                                    {parsedPaste.effect && (
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{parsedPaste.effect}</span>
                                    )}
                                    <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 800, color }}>{parsedPaste.score}</span>
                                </div>
                                {pasteTypeRel && !isSameMove && (
                                    <div style={{ fontSize: 12, marginTop: 4, color: pasteTypeRel === 'same' ? 'var(--color-success-text)' : pasteTypeRel === 'opposite' ? '#c62828' : 'var(--text-muted)' }}>
                                        {pasteTypeRel === 'same'     && `✓ ${parsedPaste.moveContestType} move → +1d4 bonus + raises judge voltage`}
                                        {pasteTypeRel === 'opposite' && `⚠ ${parsedPaste.moveContestType} move → lowers judge voltage`}
                                        {pasteTypeRel === 'adjacent' && `— no voltage effect`}
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirmPaste}
                                    disabled={!canConfirmPaste}
                                    style={{
                                        marginTop: 10, width: '100%', padding: '9px', borderRadius: 7, border: 'none',
                                        background: canConfirmPaste ? `linear-gradient(135deg, #4caf50, #388e3c)` : 'var(--border-light)',
                                        color: canConfirmPaste ? 'white' : 'var(--text-muted)',
                                        fontWeight: 700, fontSize: 14,
                                        cursor: canConfirmPaste ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {!pendingJudge ? 'Select a judge to confirm' : isSameMove ? 'Same move — 0 appeal' : `✓ Confirm Score (${parsedPaste.score})`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── NPC roll ── */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or roll for NPC</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="NPC move name…"
                                value={npcMoveName}
                                onChange={e => setNpcMoveName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && canRollNpc && handleNpcRoll()}
                                style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}
                            />
                            <button
                                onClick={handleNpcRoll}
                                disabled={!canRollNpc}
                                style={{
                                    padding: '8px 18px', borderRadius: 7, border: 'none',
                                    background: canRollNpc ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'var(--border-light)',
                                    color: canRollNpc ? 'white' : 'var(--text-muted)',
                                    fontWeight: 800, fontSize: 14,
                                    cursor: canRollNpc ? 'pointer' : 'not-allowed',
                                }}
                            >
                                🎲 Roll
                            </button>
                        </div>
                        {npcMoveName.trim() && (
                            <div style={{ marginTop: 5, fontSize: 12 }}>
                                {npcMoveData ? (
                                    <span style={{ color: npcTypeRel === 'same' ? 'var(--color-success-text)' : npcTypeRel === 'opposite' ? '#c62828' : 'var(--text-muted)' }}>
                                        ✓ {npcMoveData.contestType} · {npcMoveData.contestDice}
                                        {npcMoveData.contestEffect && ` · ${npcMoveData.contestEffect}`}
                                        {npcTypeRel === 'same'     && ' — +1d4 bonus + raises voltage'}
                                        {npcTypeRel === 'opposite' && ' — lowers voltage'}
                                    </span>
                                ) : (
                                    <span style={{ color: '#e65100' }}>⚠ Move not found — will roll 1d4</span>
                                )}
                            </div>
                        )}
                        {/* NPC move chips */}
                        {Object.keys(npcMoveOptions).length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 80, overflowY: 'auto' }}>
                                {Object.entries(npcMoveOptions).map(([name, { dice }]) => (
                                    <span
                                        key={name}
                                        onClick={() => setNpcMoveName(name)}
                                        style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: `${color}18`, border: `1px solid ${color}44`, color: 'var(--text-primary)', cursor: 'pointer' }}
                                    >
                                        {name} <strong>({dice})</strong>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 14, background: 'var(--surface-bg)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4caf50', marginBottom: 8 }}>✓ All participants have appealed this round</div>
                    <button
                        onClick={handleNextRound}
                        style={{ padding: '10px 28px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                    >
                        {round < numRounds ? `Next Round (${round + 1}/${numRounds}) →` : '🏆 View Results'}
                    </button>
                </div>
            )}

            {/* Turn order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {turnOrder.map((id, pos) => {
                    const p = participants.find(x => x.id === id);
                    if (!p) return null;
                    const done      = pos < turnIdx;
                    const isCurrent = pos === turnIdx;
                    const rResult   = done ? p.rounds[p.rounds.length - 1] : null;
                    return (
                        <div key={id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '7px 12px', borderRadius: 8,
                            background: isCurrent ? `${color}18` : 'var(--surface-bg)',
                            border: `1px solid ${isCurrent ? color + '66' : 'var(--border-light)'}`,
                            opacity: done && !isCurrent ? 0.85 : 1,
                        }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 20 }}>
                                {done ? '✓' : isCurrent ? '▶' : `${pos + 1}`}
                            </span>
                            <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 13, flex: 1 }}>{p.name}</span>
                            {done && rResult && (
                                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {rResult.moveName && rResult.moveName !== '—' && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{rResult.moveName}</span>
                                    )}
                                    <span style={{ color: 'var(--text-muted)' }}>J{rResult.judgeId}</span>
                                    <strong style={{ color: rResult.isSameMove ? '#f44336' : rResult.maxVoltageBonusRolls?.length ? '#ff9800' : 'var(--text-primary)' }}>
                                        {rResult.isSameMove ? '0 (same)' : `+${rResult.appeal}`}
                                    </strong>
                                    {rResult.voltageChange !== 0 && (
                                        <span style={{ color: rResult.voltageChange > 0 ? '#4caf50' : '#f44336', fontSize: 11 }}>
                                            ⚡{rResult.voltageChange > 0 ? '▲' : '▼'}
                                        </span>
                                    )}
                                </span>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right', color }}>{getTotal(p)}</span>
                        </div>
                    );
                })}
            </div>

            {/* Recent log */}
            {log.length > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--surface-bg)', border: '1px solid var(--border-light)', maxHeight: 90, overflowY: 'auto' }}>
                    {log.slice(-5).map((entry, i) => (
                        <div key={i} style={{ fontSize: 11, color: entry.color, fontFamily: 'monospace', lineHeight: '1.6' }}>{entry.text}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContestRunner;
