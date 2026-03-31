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
//   • All 23 PH2 contest effect keywords fully implemented
//
// Workflow:
//   Setup  → GM enters participant names only (Trainer + Pokémon)
//   Appeal → Player rolls in Dice Roller → copies result → GM pastes here
//            GM selects which judge the player declared → Confirm
//            NPC entries: GM picks move and rolls directly
// ============================================================

import React, { useState, useMemo } from 'react';
import { parseDice } from '../../utils/dataUtils.js';
import { useGameData, useData, useModal } from '../../contexts/index.js';
import { buildContestTurnEmbed, buildContestResultsEmbed } from '../../utils/discordEmbeds.js';
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

// ── Contest effect keywords ─────────────────────────────────────────────────

const KEYWORD_SET = new Set([
    'Round Starter', 'Round Ender', 'Get Ready!', 'Reliable', 'Torrential Appeal',
    'Reflective Appeal', 'Inversed Appeal', 'Final Appeal', 'Catching Up',
    'Special Attention', 'Attention Grabber', 'Big Show', 'Incentives', 'Excitement',
    'Hold That Thought', 'Scrambler', 'Quick Set', 'Slow Set', 'Good Show!',
    'Seen Nothing Yet', 'Interrupting Appeal', 'Unsettling', 'No Effect',
    'Crowd Pleaser', 'Incredible', 'Start Set', 'End Set',
]);

const normalizeKeyword = (effect) => {
    if (!effect?.trim()) return null;
    const t = effect.trim();
    if (KEYWORD_SET.has(t)) return t;
    const tl = t.toLowerCase();
    for (const kw of KEYWORD_SET) {
        if (kw.toLowerCase() === tl) return kw;
    }
    return null;
};

const KEYWORD_DESC = {
    'Round Starter':      '+2d4 if you appeal first this round',
    'Round Ender':        '+2d4 if you appeal last this round',
    'Get Ready!':         'Next appeal: 2× dice (if max voltage: 14d4 total)',
    'Reliable':           'Using this move again next round: normal dice + extra 1d4',
    'Torrential Appeal':  '1d4 / 2d4 / 3d4 based on turn position',
    'Reflective Appeal':  '1d4 per voltage the judge currently has',
    'Inversed Appeal':    '1d4 per voltage the judge is missing (6 − voltage)',
    'Final Appeal':       '2× dice in the final round',
    'Catching Up':        '+3d4 if you have the lowest total appeal',
    'Special Attention':  '+3d4 if first to target this judge this round',
    'Attention Grabber':  'Halve previous contestant\'s appeal for this judge; add difference to yours',
    'Big Show':           '15d4 if all contestants target same judge (4th/5th turn only)',
    'Incentives':         '+2d4 if you raise this judge\'s voltage',
    'Excitement':         'This judge\'s voltage cannot decrease this round',
    'Hold That Thought':  'This judge\'s voltage cannot increase this round',
    'Scrambler':          'Next round\'s turn order is randomized',
    'Quick Set':          'You go first in the next round',
    'Slow Set':           'You go last in the next round',
    'Good Show!':         '+3d4 if this judge\'s voltage was raised in each of the last 2 turns',
    'Seen Nothing Yet':   '+3d4 if max voltage was reached this or last round',
    'Interrupting Appeal':'Goes before all others this round regardless of order',
    'Unsettling':         'All judges lose 1 voltage',
    'No Effect':          'No special contest effect',
    'Crowd Pleaser':      'Raises the target judge\'s voltage by 2 regardless of contest type',
    'Incredible':         'Raises all judges\' voltage by 1 regardless of contest type',
    'Start Set':          'Perform first, second, or third next round (Feature-modified — choose when used)',
    'End Set':            'Perform third, fourth, or last next round (Feature-modified — choose when used)',
};

const KEYWORD_COLOR = {
    'Round Starter':      '#4caf50', 'Round Ender':       '#4caf50',
    'Final Appeal':       '#4caf50', 'Catching Up':       '#4caf50',
    'Special Attention':  '#4caf50', 'Good Show!':        '#4caf50',
    'Seen Nothing Yet':   '#4caf50', 'Incentives':        '#4caf50',
    'Get Ready!':         '#e91e63', 'Reliable':          '#e91e63',
    'Torrential Appeal':  '#2196f3', 'Reflective Appeal': '#2196f3', 'Inversed Appeal': '#2196f3',
    'Attention Grabber':  '#f44336', 'Big Show':          '#f44336',
    'Excitement':         '#ff9800', 'Hold That Thought': '#ff9800', 'Unsettling': '#ff9800',
    'Scrambler':          '#9c27b0', 'Quick Set':         '#9c27b0',
    'Slow Set':           '#9c27b0', 'Interrupting Appeal':'#9c27b0',
    'Start Set':          '#9c27b0', 'End Set':           '#9c27b0',
    'No Effect':          '#9e9e9e',
    'Crowd Pleaser':      '#ff9800', 'Incredible':        '#ff9800',
};

// ── Dice helpers ───────────────────────────────────────────────────────────

const rollD4s = (count) =>
    Array.from({ length: Math.max(0, Math.floor(count)) }, () => Math.floor(Math.random() * 4) + 1);

const rollDiceStr = (diceStr) => {
    const { count, sides, bonus } = parseDice(diceStr);
    if (!count || !sides) return { rolls: [], bonus: 0, total: 0 };
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    return { rolls, bonus, total: rolls.reduce((a, b) => a + b, 0) + bonus };
};

const parsePasteInput = (text) => {
    if (!text?.trim()) return null;
    const parts = text.split('|').map(s => s.trim());
    if (parts.length >= 4) {
        const score = parseInt(parts[3]);
        if (isNaN(score)) return null;
        return { name: parts[0], moveName: parts[1], moveContestType: parts[2], score, effect: parts[4] || '' };
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
                border: `1px solid ${i < voltage ? color : 'var(--border-medium)'}`,
                transition: 'background 0.2s',
                boxShadow: i < voltage ? `0 0 4px ${color}66` : 'none',
            }} />
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2, fontWeight: 700 }}>
            {voltage}/6
        </span>
    </div>
);

const JudgeCard = ({ judge, color, selected, onSelect, disabled, holdThought, excitement }) => (
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
        {judge.voltage === 6 && <div style={{ fontSize: 11, color: 'var(--poke-orange)', fontWeight: 700, marginTop: 2 }}>MAX ⚡</div>}
        {holdThought && <div style={{ fontSize: 11, color: 'var(--poke-orange)', fontWeight: 700, marginTop: 2 }}>🔒 Locked</div>}
        {excitement && <div style={{ fontSize: 11, color: 'var(--stat-hp)', fontWeight: 700, marginTop: 2 }}>🛡 Protected</div>}
    </button>
);

const StepLabel = ({ n, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--color-purple)', color: 'white',
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
    </div>
);

const KeywordPill = ({ keyword }) => {
    const kw = normalizeKeyword(keyword);
    if (!kw || kw === 'No Effect') return null;
    const c = KEYWORD_COLOR[kw] || '#9e9e9e';
    return (
        <span title={KEYWORD_DESC[kw]} style={{
            padding: '1px 6px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: `${c}22`, border: `1px solid ${c}55`, color: c,
            cursor: 'help', whiteSpace: 'nowrap',
            textDecoration: 'underline dotted', textUnderlineOffset: '2px',
        }}>
            {kw}
        </span>
    );
};

// ── Main component ─────────────────────────────────────────────────────────

const ContestRunner = () => {
    const { GAME_DATA } = useGameData();
    const { sendToDiscord, discordWebhook } = useData();
    const { showConfirm } = useModal();
    const webhookActive = discordWebhook?.enabled && !!discordWebhook?.url?.trim();
    const [discordEnabled, setDiscordEnabled] = useState(true);

    // ── Setup state ────────────────────────────────────────────────────────
    const [showGuide, setShowGuide] = useState(false);
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

    // ── Keyword effect state ───────────────────────────────────────────────
    // Per-participant flags: { [id]: { getReadyActive: bool, reliableMove: string|null } }
    const [participantEffects, setParticipantEffects] = useState({});
    // Round-level: first to target each judge this round { [judgeId]: participantId }
    const [judgeTargetedBy, setJudgeTargetedBy] = useState({});
    // Ordered list of judgeIds targeted each turn this round (for Big Show check)
    const [roundJudgeTargets, setRoundJudgeTargets] = useState([]);
    // Last appeal result per judge { [judgeId]: { participantId, name, appeal } }
    const [lastAppealByJudge, setLastAppealByJudge] = useState({});
    // Judge protection flags (reset each round)
    const [excitementJudges, setExcitementJudges]     = useState(new Set());
    const [holdThoughtJudges, setHoldThoughtJudges]   = useState(new Set());
    // Next-round order modifiers
    const [nextRoundFirst,    setNextRoundFirst]       = useState(null);
    const [nextRoundLast,     setNextRoundLast]        = useState(null);
    const [scrambleNextRound, setScrambleNextRound]    = useState(false);
    // Voltage raise history per judge (last 2 turns): { [judgeId]: bool[] }
    const [recentVoltageRaises, setRecentVoltageRaises] = useState({});
    // Max voltage tracking for Seen Nothing Yet
    const [maxVoltageHitThisRound, setMaxVoltageHitThisRound] = useState(false);
    const [maxVoltageHitLastRound, setMaxVoltageHitLastRound] = useState(false);

    const numRounds = participants.length || 4;

    // ── Move data helpers ──────────────────────────────────────────────────

    const resolveMoveData = (moveName) => {
        if (!moveName?.trim() || !GAME_DATA?.moves) return null;
        const key = Object.keys(GAME_DATA.moves).find(
            k => k.toLowerCase() === moveName.trim().toLowerCase()
        );
        return key ? GAME_DATA.moves[key] : null;
    };

    const npcMoveOptions = useMemo(() => {
        if (!contestType || !GAME_DATA?.moves) return {};
        return Object.fromEntries(
            Object.entries(GAME_DATA.moves)
                .filter(([, m]) => m.contestType === contestType && (m.contestDice || m.contestEffect))
                .map(([name, m]) => [name, { dice: m.contestDice || null, keyword: m.contestEffect || '' }])
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

    const computeTurnOrder = (pList, rnd, { firstId = null, lastId = null, scramble = false } = {}) => {
        let order;
        if (scramble) {
            const arr = [...pList];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            order = arr.map(p => p.id);
        } else {
            const sorted = [...pList].sort((a, b) => {
                const diff = getTotal(a) - getTotal(b);
                return rnd % 2 === 1 ? diff : -diff;
            });
            order = sorted.map(p => p.id);
        }
        if (firstId && order.includes(firstId)) {
            order = [firstId, ...order.filter(id => id !== firstId)];
        }
        if (lastId && order.includes(lastId)) {
            order = [...order.filter(id => id !== lastId), lastId];
        }
        return order;
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
        setParticipantEffects({});
        setJudgeTargetedBy({});
        setRoundJudgeTargets([]);
        setLastAppealByJudge({});
        setExcitementJudges(new Set());
        setHoldThoughtJudges(new Set());
        setNextRoundFirst(null);
        setNextRoundLast(null);
        setScrambleNextRound(false);
        setRecentVoltageRaises({});
        setMaxVoltageHitThisRound(false);
        setMaxVoltageHitLastRound(false);
    };

    // ── Appeal helpers ─────────────────────────────────────────────────────

    const getTotal = (p) => p.rounds.reduce((sum, r) => sum + r.appeal, 0);

    const currentParticipantId = turnOrder[turnIdx];
    const currentParticipant   = participants.find(p => p.id === currentParticipantId);
    const allDoneThisRound     = turnIdx >= participants.length;

    const handlePasteChange = (text) => {
        setPastedText(text);
        const parsed = parsePasteInput(text);
        setParsedPaste(parsed);
        // Warn if input looks like a paste attempt (has pipes) but can't be parsed
        if (text.includes('|') && !parsed) {
            toast.error('Could not parse — expected: Name|Move|ContestType|Score or Name|Move|ContestType|Score|Effect');
        }
    };

    // Core roll: takes move data + optional pre-determined score (player paste)
    const handleRoll = ({ moveName, moveContestType, diceStr, effect = '', manualScore = null }) => {
        if (!pendingJudge || !currentParticipant) return;

        const p        = currentParticipant;
        const judge    = judges.find(j => j.id === pendingJudge);
        const typeRel  = getTypeRelation(moveContestType, contestType);
        const pEffects = participantEffects[p.id] || {};
        const keyword  = normalizeKeyword(effect);
        const isNPC    = manualScore === null;

        // ── Same-move check ────────────────────────────────────────────────
        const reliableActive = pEffects.reliableMove === moveName;
        const isSameMove     = p.rounds.length > 0 && lastMoves[p.id] === moveName && !reliableActive;
        const getReadyActive = !!pEffects.getReadyActive;

        // ── Compute base appeal ────────────────────────────────────────────
        let appeal = 0;
        let baseRolls = [], baseBonus = 0, typeBonusRolls = [], maxVoltageBonusRolls = [];
        let keywordBonusRolls = [], keywordBonusLabel = '';
        let reliableRolls = [];

        if (isSameMove) {
            appeal = 0;
        } else if (isNPC) {
            // ── NPC path — replacement keywords override base dice ─────────
            if (keyword === 'Torrential Appeal') {
                const pos    = turnIdx;
                const isLast = pos === participants.length - 1;
                const count  = isLast ? 3 : pos <= 1 ? 1 : 2;
                baseRolls = rollD4s(count);
                appeal    = baseRolls.reduce((a, b) => a + b, 0);
            } else if (keyword === 'Reflective Appeal') {
                const count = Math.max(1, judge.voltage);
                baseRolls   = rollD4s(count);
                appeal      = baseRolls.reduce((a, b) => a + b, 0);
            } else if (keyword === 'Inversed Appeal') {
                const count = Math.max(0, 6 - judge.voltage);
                baseRolls   = rollD4s(count);
                appeal      = baseRolls.reduce((a, b) => a + b, 0);
            } else if (diceStr) {
                // Normal base dice roll
                let effectiveDice = diceStr;
                // Get Ready! doubles the dice
                if (getReadyActive) {
                    const { count: c, sides: s, bonus: b } = parseDice(effectiveDice);
                    if (c && s) effectiveDice = `${c * 2}d${s}${b ? `+${b * 2}` : ''}`;
                }
                // Final Appeal doubles the dice in the last round
                if (keyword === 'Final Appeal' && round === numRounds) {
                    const { count: c, sides: s, bonus: b } = parseDice(effectiveDice);
                    if (c && s) effectiveDice = `${c * 2}d${s}${b ? `+${b * 2}` : ''}`;
                }
                const base = rollDiceStr(effectiveDice);
                baseRolls  = base.rolls;
                baseBonus  = base.bonus;
                appeal     = base.total;
                if (typeRel === 'same') {
                    typeBonusRolls = rollD4s(1);
                    appeal += typeBonusRolls[0];
                }
            }
            // else: no-dice move (diceStr is null) — base appeal stays 0; keyword still fires
            // Reliable: +1d4 on top of whatever base was rolled (PH2: "additional 1d4")
            if (reliableActive) {
                reliableRolls = rollD4s(1);
                appeal += reliableRolls[0];
            }
        } else {
            // ── Player path — use submitted score as base ──────────────────
            appeal = manualScore;
            // Reliable: add the +1d4 bonus the player should have rolled
            if (reliableActive) {
                reliableRolls = rollD4s(1);
                appeal += reliableRolls[0];
            }
        }

        // ── Keyword additive bonuses (all non-same-move turns) ─────────────
        if (!isSameMove) {
            if (keyword === 'Round Starter' && turnIdx === 0) {
                const b = rollD4s(2);
                keywordBonusRolls = b; keywordBonusLabel = 'Round Starter +2d4';
                appeal += b.reduce((a, v) => a + v, 0);

            } else if (keyword === 'Round Ender' && turnIdx === participants.length - 1) {
                const b = rollD4s(2);
                keywordBonusRolls = b; keywordBonusLabel = 'Round Ender +2d4';
                appeal += b.reduce((a, v) => a + v, 0);

            } else if (keyword === 'Catching Up') {
                const myTotal  = getTotal(p);
                const isLowest = participants.every(other => other.id === p.id || getTotal(other) >= myTotal);
                if (isLowest) {
                    const b = rollD4s(3);
                    keywordBonusRolls = b; keywordBonusLabel = 'Catching Up +3d4';
                    appeal += b.reduce((a, v) => a + v, 0);
                } else {
                    keywordBonusLabel = 'Catching Up (not lowest — no bonus)';
                }

            } else if (keyword === 'Special Attention') {
                if (!judgeTargetedBy[pendingJudge]) {
                    const b = rollD4s(3);
                    keywordBonusRolls = b; keywordBonusLabel = 'Special Attention +3d4';
                    appeal += b.reduce((a, v) => a + v, 0);
                } else {
                    keywordBonusLabel = 'Special Attention (judge already targeted — no bonus)';
                }

            } else if (keyword === 'Good Show!') {
                const raises = recentVoltageRaises[pendingJudge] || [];
                if (raises.length >= 2 && raises[raises.length - 1] && raises[raises.length - 2]) {
                    const b = rollD4s(3);
                    keywordBonusRolls = b; keywordBonusLabel = 'Good Show! +3d4';
                    appeal += b.reduce((a, v) => a + v, 0);
                } else {
                    keywordBonusLabel = 'Good Show! (voltage not raised last 2 turns — no bonus)';
                }

            } else if (keyword === 'Seen Nothing Yet') {
                if (maxVoltageHitThisRound || maxVoltageHitLastRound) {
                    const b = rollD4s(3);
                    keywordBonusRolls = b; keywordBonusLabel = 'Seen Nothing Yet +3d4';
                    appeal += b.reduce((a, v) => a + v, 0);
                } else {
                    keywordBonusLabel = 'Seen Nothing Yet (no max voltage — no bonus)';
                }

            } else if (keyword === 'Attention Grabber') {
                const lastAppeal = lastAppealByJudge[pendingJudge];
                if (lastAppeal && lastAppeal.appeal > 0) {
                    const stolen = Math.floor(lastAppeal.appeal / 2);
                    if (stolen > 0) {
                        keywordBonusLabel = `Attention Grabber +${stolen} (halved ${lastAppeal.name})`;
                        appeal += stolen;
                    }
                } else {
                    keywordBonusLabel = 'Attention Grabber (no previous appeal — no bonus)';
                }

            } else if (keyword === 'Big Show') {
                const isFourthOrFifth = turnIdx === 3 || turnIdx === 4;
                const allSameJudge = roundJudgeTargets.length >= 3 &&
                    roundJudgeTargets.every(id => id === pendingJudge);
                if (isFourthOrFifth && allSameJudge) {
                    const b = rollD4s(15);
                    keywordBonusRolls = b; keywordBonusLabel = 'Big Show! 15d4';
                    appeal = b.reduce((a, v) => a + v, 0); // replaces all
                } else {
                    keywordBonusLabel = !isFourthOrFifth
                        ? 'Big Show (not 4th/5th — no effect)'
                        : 'Big Show (not all same judge — no effect)';
                }

            } else if (keyword === 'Final Appeal' && !isNPC && round === numRounds) {
                keywordBonusLabel = 'Final Appeal (player should have 2× dice applied)';
            }
        }

        // ── Voltage changes ────────────────────────────────────────────────
        let newVoltage    = judge.voltage;
        let voltageChange = 0;
        let newJudges     = [...judges];

        // Type-based voltage change always applies — even on same-move turns
        // (PH2 rule: "same move twice in a row = 0 appeal, voltage still changes")
        const canRaise = typeRel === 'same' && judge.voltage < 6 && !holdThoughtJudges.has(pendingJudge) && keyword !== 'Hold That Thought';
        const canLower = typeRel === 'opposite' && judge.voltage > 1 && !excitementJudges.has(pendingJudge) && keyword !== 'Excitement';

        if (canRaise) {
            newVoltage    = judge.voltage + 1;
            voltageChange = +1;
            if (newVoltage === 6) {
                setMaxVoltageHitThisRound(true);
                if (!isSameMove) {
                    // Max voltage appeal bonus only applies when the move has appeal
                    // Get Ready! + max voltage = 14d4 total (PH2: "14d4 instead of 7d4")
                    const maxBonus = getReadyActive ? 14 : 4;
                    maxVoltageBonusRolls = rollD4s(maxBonus);
                    if (getReadyActive) appeal = maxVoltageBonusRolls.reduce((a, b) => a + b, 0);
                    else               appeal += maxVoltageBonusRolls.reduce((a, b) => a + b, 0);
                }
            }
        } else if (canLower) {
            newVoltage    = judge.voltage - 1;
            voltageChange = -1;
        }

        if (!isSameMove) {
            // Apply Excitement / Hold That Thought side effects first
            if (keyword === 'Excitement') {
                setExcitementJudges(prev => new Set([...prev, pendingJudge]));
            }
            if (keyword === 'Hold That Thought') {
                setHoldThoughtJudges(prev => new Set([...prev, pendingJudge]));
            }

            // Crowd Pleaser: +2 voltage to target judge regardless of type
            if (keyword === 'Crowd Pleaser' && judge.voltage < 6) {
                const gain    = Math.min(2, 6 - judge.voltage);
                newVoltage    = judge.voltage + gain;
                voltageChange = gain;
                if (newVoltage === 6) setMaxVoltageHitThisRound(true);
            }
            // Incredible: +1 voltage to ALL judges regardless of type
            if (keyword === 'Incredible') {
                newJudges = judges.map(j => ({ ...j, voltage: Math.min(6, j.voltage + 1) }));
                if (newJudges.some(j => j.voltage === 6)) setMaxVoltageHitThisRound(true);
                voltageChange = +1;
                setJudges(newJudges);
            }

            // Incentives: +2d4 if voltage was raised
            if (keyword === 'Incentives' && voltageChange > 0) {
                const b = rollD4s(2);
                keywordBonusRolls = [...keywordBonusRolls, ...b];
                keywordBonusLabel = 'Incentives +2d4';
                appeal += b.reduce((a, v) => a + v, 0);
            }

            // Unsettling: lower ALL judges by 1
            if (keyword === 'Unsettling') {
                newJudges = judges.map(j => ({ ...j, voltage: Math.max(1, j.voltage - 1) }));
                voltageChange = -1;
            } else if (keyword !== 'Incredible') {
                newJudges = judges.map(j => j.id === pendingJudge ? { ...j, voltage: newVoltage } : j);
            }
        } else {
            // Same-move: apply type-relation voltage change to targeted judge
            newJudges = judges.map(j => j.id === pendingJudge ? { ...j, voltage: newVoltage } : j);
        }
        setJudges(newJudges);

        // ── Next-round order modifiers ─────────────────────────────────────
        const newEffects = { ...pEffects };
        if (keyword === 'Get Ready!') {
            newEffects.getReadyActive = true;
        } else if (getReadyActive) {
            newEffects.getReadyActive = false; // consumed
        }
        if (keyword === 'Reliable') {
            newEffects.reliableMove = moveName;
        } else if (reliableActive) {
            newEffects.reliableMove = null; // consumed
        } else {
            newEffects.reliableMove = null; // different move clears flag
        }
        if (keyword === 'Quick Set')    setNextRoundFirst(p.id);
        if (keyword === 'Slow Set')     setNextRoundLast(p.id);
        if (keyword === 'Scrambler')    setScrambleNextRound(true);
        setParticipantEffects(prev => ({ ...prev, [p.id]: newEffects }));

        // ── Attention Grabber retroactive modification ─────────────────────
        const lastAppeal = lastAppealByJudge[pendingJudge];
        const attentionStolen = keyword === 'Attention Grabber' && lastAppeal && lastAppeal.appeal > 0
            ? Math.floor(lastAppeal.appeal / 2)
            : 0;

        // ── Save round result + apply Attention Grabber in one update ──────
        const roundEntry = {
            judgeId: pendingJudge,
            moveName, moveContestType, effect, keyword, diceStr,
            appeal, baseRolls, baseBonus, typeBonusRolls, maxVoltageBonusRolls,
            keywordBonusRolls, keywordBonusLabel, reliableRolls,
            isSameMove, typeRel, voltageChange,
            isManual: !isNPC, getReadyApplied: getReadyActive, reliableApplied: reliableActive,
        };

        setParticipants(prev => {
            let updated = prev;
            // Halve previous contestant's appeal for Attention Grabber
            if (attentionStolen > 0) {
                updated = prev.map(p2 => {
                    if (p2.id !== lastAppeal.participantId) return p2;
                    const newRounds = [...p2.rounds];
                    const lastIdx   = newRounds.length - 1;
                    if (lastIdx >= 0 && newRounds[lastIdx].judgeId === pendingJudge) {
                        newRounds[lastIdx] = { ...newRounds[lastIdx], appeal: newRounds[lastIdx].appeal - attentionStolen };
                    }
                    return { ...p2, rounds: newRounds };
                });
            }
            // Add this participant's round entry
            return updated.map(p2 =>
                p2.id === p.id ? { ...p2, rounds: [...p2.rounds, roundEntry] } : p2
            );
        });

        setLastMoves(prev => ({ ...prev, [p.id]: moveName }));

        // ── Update round tracking state ────────────────────────────────────
        setJudgeTargetedBy(prev => prev[pendingJudge] ? prev : { ...prev, [pendingJudge]: p.id });
        setRoundJudgeTargets(prev => [...prev, pendingJudge]);
        setLastAppealByJudge(prev => ({ ...prev, [pendingJudge]: { participantId: p.id, name: p.name, appeal } }));
        setRecentVoltageRaises(prev => {
            const raises  = prev[pendingJudge] || [];
            const updated = [...raises, voltageChange > 0].slice(-2);
            return { ...prev, [pendingJudge]: updated };
        });

        // ── Build log entry ────────────────────────────────────────────────
        const logParts = [`${p.name} → J${pendingJudge}: `];
        if (isSameMove) {
            logParts.push('SAME MOVE — 0 appeal');
        } else if (reliableActive) {
            logParts.push(`${moveName} [Reliable: ${reliableRolls[0]}] = ${appeal}`);
        } else if (!isNPC) {
            logParts.push(`${moveName}${moveContestType ? ` (${moveContestType})` : ''} [player] = ${appeal}`);
            if (keywordBonusLabel) logParts.push(`· ${keywordBonusLabel}`);
        } else {
            const diceLabel = getReadyActive ? `${moveName}★(2×)` : moveName;
            logParts.push(`${diceLabel} [${baseRolls.join(',')}]${baseBonus ? `+${baseBonus}` : ''}`);
            if (typeBonusRolls.length)      logParts.push(`+[${typeBonusRolls[0]}] type`);
            if (maxVoltageBonusRolls.length) logParts.push(`+[${maxVoltageBonusRolls.join(',')}] MAX⚡`);
            if (keywordBonusRolls.length)    logParts.push(`+[${keywordBonusRolls.join(',')}] ${keyword}`);
            else if (keywordBonusLabel)      logParts.push(`· ${keywordBonusLabel}`);
            logParts.push(`= ${appeal}`);
        }
        if (keyword === 'Interrupting Appeal')
            logParts.push('· ⚠ INTERRUPTING APPEAL — acted first regardless of order');
        if (voltageChange !== 0)
            logParts.push(`· J${pendingJudge} ⚡${voltageChange > 0 ? '▲' : '▼'}${newVoltage}`);
        if (keyword === 'Unsettling')
            logParts.push('· All judges ⚡▼');

        const logColor = maxVoltageBonusRolls.length ? 'var(--poke-orange)'
            : keyword === 'Big Show' ? 'var(--color-danger-text)'
            : voltageChange > 0 ? 'var(--stat-hp)'
            : voltageChange < 0 ? 'var(--color-danger-text)'
            : 'var(--text-secondary)';

        setLog(prev => [...prev, { text: logParts.join(' '), color: logColor }]);

        // ── Post turn result to Discord ────────────────────────────────────
        const judgeIndex = judges.findIndex(j => j.id === pendingJudge);
        const turnEmbed  = buildContestTurnEmbed({
            contestType, round, participantName: p.name, moveName, appeal,
            judgeIdx: judgeIndex, voltageChange, newVoltage,
            isSameMove, isMaxVoltage: maxVoltageBonusRolls.length > 0, effect,
        });
        if (webhookActive && discordEnabled) sendToDiscord({ _rawEmbed: turnEmbed });

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
            diceStr:         gameMove?.contestDice || null,
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
            diceStr:         gameMove?.contestDice || null,
            effect:          gameMove?.contestEffect || '',
            manualScore:     null,
        });
    };

    const handleNextRound = () => {
        const nextRound = round + 1;
        if (nextRound > numRounds) { setPhase('results'); return; }
        setTurnOrder(computeTurnOrder(participants, nextRound, {
            firstId: nextRoundFirst,
            lastId:  nextRoundLast,
            scramble: scrambleNextRound,
        }));
        setTurnIdx(0);
        setPendingJudge(null);
        setRound(nextRound);
        setPastedText('');
        setParsedPaste(null);
        setNpcMoveName('');
        // Reset round-level state
        setJudgeTargetedBy({});
        setRoundJudgeTargets([]);
        setLastAppealByJudge({});
        setExcitementJudges(new Set());
        setHoldThoughtJudges(new Set());
        // Carry over max voltage flag
        setMaxVoltageHitLastRound(maxVoltageHitThisRound);
        setMaxVoltageHitThisRound(false);
        // Reset next-round order modifiers
        setNextRoundFirst(null);
        setNextRoundLast(null);
        setScrambleNextRound(false);
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
        setParticipantEffects({});
        setJudgeTargetedBy({});
        setRoundJudgeTargets([]);
        setLastAppealByJudge({});
        setExcitementJudges(new Set());
        setHoldThoughtJudges(new Set());
        setNextRoundFirst(null);
        setNextRoundLast(null);
        setScrambleNextRound(false);
        setRecentVoltageRaises({});
        setMaxVoltageHitThisRound(false);
        setMaxVoltageHitLastRound(false);
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

                {/* How to Run guide */}
                <div style={{ marginBottom: 16 }}>
                    <button
                        onClick={() => setShowGuide(v => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}
                    >
                        <span>📖 How to Run a Contest</span>
                        <span>{showGuide ? '▲' : '▼'}</span>
                    </button>
                    {showGuide && (
                        <div style={{ padding: '12px 14px', borderRadius: '0 0 7px 7px', border: '1px solid var(--border-light)', borderTop: 'none', background: 'var(--bg-light)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <ol style={{ margin: 0, paddingLeft: 18 }}>
                                <li><strong>Setup:</strong> Choose contest type, add all participants (Trainer + Pokémon name).</li>
                                <li><strong>Each turn:</strong> The active participant rolls in the Dice Roller tab, then copies with "Copy for GM".</li>
                                <li><strong>Paste:</strong> Paste their result here (format: <code>Name|Move|ContestType|Score</code> or <code>Name|Move|ContestType|Score|Effect</code>), select which Judge they declared, and hit Confirm.</li>
                                <li><strong>NPC turns:</strong> Use the NPC section to pick a move and roll directly.</li>
                                <li><strong>Round end:</strong> After all appeals, click Next Round. Repeat for all rounds.</li>
                                <li><strong>Results:</strong> Final standings shown after the last round.</li>
                            </ol>
                            <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                                Turn order: Rounds 1, 3, 5… go lowest→highest appeal. Rounds 2, 4, 6… go highest→lowest.
                                Move keywords (Round Starter, Get Ready!, etc.) are applied automatically.
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 1 */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                        <StepLabel n={1} label="Choose Contest Type" />
                    </div>
                    <div style={{ paddingTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                        <div style={{ paddingBottom: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                            <strong>Adjacent</strong> (no voltage effect): {TYPE_ADJACENT[contestType]?.join(', ')} &nbsp;·&nbsp;
                            <strong>Opposite</strong> (−1 voltage):&nbsp;
                            {CONTEST_TYPES.filter(t => t.id !== contestType && !TYPE_ADJACENT[contestType]?.includes(t.id)).map(t => t.id).join(', ')}
                        </div>
                    )}
                </div>

                {/* Step 2 */}
                <div className="card-orange" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                        <StepLabel n={2} label="Add Participants (Trainer + Pokémon)" />
                        <button
                            onClick={() => setShowImport(v => !v)}
                            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-light)', background: showImport ? 'var(--color-purple)' : 'var(--surface-bg)', color: showImport ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                            📋 Paste list
                        </button>
                    </div>

                    {showImport && (
                        <div style={{ paddingBottom: 10 }}>
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
                                style={{ marginTop: 6, padding: '7px 16px', borderRadius: 6, border: 'none', background: importText.trim() ? 'var(--color-purple)' : 'var(--border-light)', color: importText.trim() ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: importText.trim() ? 'pointer' : 'not-allowed' }}
                            >
                                + Add All
                            </button>
                        </div>
                    )}

                    <div style={{ paddingTop: 10 }}>
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
                                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--color-purple)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
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
                                            style={{ background: 'none', border: 'none', color: 'var(--color-danger-text)', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
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
                const medal  = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                const rounds = p.rounds.map((r, i) => `R${i + 1}:${r.appeal}`).join('  ');
                lines.push(`${medal} ${p.name} — ${getTotal(p)} appeal  (${rounds})`);
            });
            navigator.clipboard.writeText(lines.join('\n')).then(() => toast.success('Results copied!'));
        };

        const postResults = () => {
            const embed = buildContestResultsEmbed({ contestType, participants, getTotal });
            if (webhookActive && discordEnabled) sendToDiscord({ _rawEmbed: embed });
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
                    <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                                                R{i + 1}: <strong style={{ color: r.isSameMove ? 'var(--color-danger-text)' : r.maxVoltageBonusRolls?.length ? 'var(--poke-orange)' : 'var(--text-primary)' }}>
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
                        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                            {log.map((entry, i) => (
                                <div key={i} style={{ fontSize: 12, color: entry.color, fontFamily: 'monospace' }}>{entry.text}</div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={copyResults} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${color}55`, background: `${color}14`, color, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        📋 Copy Results
                    </button>
                    {webhookActive && discordEnabled && (
                        <button onClick={postResults} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #5865f266', background: 'rgba(88,101,242,0.08)', color: '#5865f2', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                            💬 Post to Discord
                        </button>
                    )}
                </div>
                <button onClick={handleReset} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ↺ New Contest
                </button>
            </div>
        );
    }

    // ── Appeal phase ───────────────────────────────────────────────────────

    const isSameMove = currentParticipant && parsedPaste
        ? lastMoves[currentParticipant.id] === parsedPaste.moveName &&
          (participantEffects[currentParticipant.id]?.reliableMove !== parsedPaste.moveName)
        : false;

    const pasteTypeRel = parsedPaste?.moveContestType
        ? getTypeRelation(parsedPaste.moveContestType, contestType)
        : null;

    const nameMatchWarning = parsedPaste && currentParticipant &&
        !currentParticipant.name.toLowerCase().includes(parsedPaste.name.toLowerCase()) &&
        !parsedPaste.name.toLowerCase().includes(currentParticipant.name.toLowerCase());

    const npcMoveData = resolveMoveData(npcMoveName);
    const npcTypeRel  = npcMoveData?.contestType ? getTypeRelation(npcMoveData.contestType, contestType) : null;
    const npcKeyword  = normalizeKeyword(npcMoveData?.contestEffect);

    const pasteKeyword = parsedPaste ? normalizeKeyword(parsedPaste.effect || resolveMoveData(parsedPaste.moveName)?.contestEffect) : null;

    const canConfirmPaste = !!parsedPaste && !!pendingJudge;
    const canRollNpc      = !!npcMoveName.trim() && !!pendingJudge;

    // Active effects for current participant
    const curEffects       = currentParticipant ? (participantEffects[currentParticipant.id] || {}) : {};
    const curGetReady      = !!curEffects.getReadyActive;
    const curReliableMove  = curEffects.reliableMove || null;

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
                        {scrambleNextRound && <span style={{ color: '#9c27b0', marginLeft: 6 }}>· Next round scrambled 🔀</span>}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {webhookActive && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: discordEnabled ? '#5865f2' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={discordEnabled}
                                onChange={e => setDiscordEnabled(e.target.checked)}
                                style={{ accentColor: '#5865f2', cursor: 'pointer' }}
                            />
                            💬 Discord
                        </label>
                    )}
                    <button
                        onClick={() => showConfirm({ title: 'Abandon Contest?', message: 'This will reset all scores, judges, and turn history. Are you sure?', onConfirm: handleReset })}
                        title="Abandon this contest and return to setup"
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                        ↺ Abandon
                    </button>
                </div>
            </div>

            {/* Judges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {judges.map(j => (
                    <JudgeCard
                        key={j.id} judge={j} color={color}
                        selected={pendingJudge === j.id}
                        onSelect={setPendingJudge}
                        disabled={allDoneThisRound || !currentParticipant}
                        holdThought={holdThoughtJudges.has(j.id)}
                        excitement={excitementJudges.has(j.id)}
                    />
                ))}
            </div>

            {/* Current turn */}
            {!allDoneThisRound && currentParticipant ? (
                <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 14, background: `${color}12`, border: `2px solid ${color}55` }}>

                    {/* Who's up + active effect flags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 800, fontSize: 17 }}>{currentParticipant.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>— it's your turn!</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                            {curGetReady && (
                                <span title="Get Ready! is active — this turn's dice are doubled" style={{ padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#e91e6322', border: '1px solid #e91e6344', color: '#e91e63' }}>
                                    ⚡ Get Ready! (2× dice)
                                </span>
                            )}
                            {curReliableMove && (
                                <span title={`Reliable: using ${curReliableMove} again scores 1d4`} style={{ padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#e91e6322', border: '1px solid #e91e6344', color: '#e91e63' }}>
                                    ♻ Reliable ({curReliableMove})
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                            Total: <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{getTotal(currentParticipant)}</strong>
                        </div>
                    </div>

                    {/* SAME MOVE banner */}
                    {isSameMove && (
                        <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 10, background: 'var(--tint-fail-bg)', border: '1.5px solid var(--color-danger-text)', color: 'var(--color-danger-text)', fontWeight: 700, fontSize: 13 }}>
                            ⚠ Same move as last round — 0 appeal this turn (voltage still applies)
                        </div>
                    )}

                    {/* Judge status */}
                    <div style={{ fontSize: 13, marginBottom: 12, color: pendingJudge ? color : 'var(--text-muted)', fontWeight: pendingJudge ? 700 : 400 }}>
                        {pendingJudge ? `Judge ${pendingJudge} selected` : 'Select a judge above (player declares which one)'}
                    </div>

                    {/* ── Player result paste ── */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Player result
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                format: <span style={{ color: 'var(--text-secondary)' }}>Name|Move|Type|Score</span>
                                <span style={{ color: 'var(--text-muted)' }}>[|Effect]</span>
                            </div>
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
                                <span style={{ fontSize: 13, color: 'var(--color-danger-text)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                                    ✗ Can't parse
                                </span>
                            )}
                        </div>

                        {/* Paste preview */}
                        {parsedPaste && (
                            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, background: 'var(--bg-light)', border: `1px solid ${color}44` }}>
                                {nameMatchWarning && (
                                    <div style={{ fontSize: 13, color: 'var(--poke-orange)', fontWeight: 700, marginBottom: 4 }}>
                                        ⚠ Name "{parsedPaste.name}" doesn't match current participant — check you're entering the right score
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{parsedPaste.moveName || '—'}</span>
                                    {parsedPaste.moveContestType && (
                                        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 8, background: ctColor(parsedPaste.moveContestType), color: 'white', fontWeight: 700 }}>
                                            {parsedPaste.moveContestType}
                                        </span>
                                    )}
                                    {pasteKeyword && <KeywordPill keyword={pasteKeyword} />}
                                    {parsedPaste.effect && !pasteKeyword && (
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{parsedPaste.effect}</span>
                                    )}
                                    <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 800, color }}>{parsedPaste.score}</span>
                                </div>
                                {pasteTypeRel && !isSameMove && (
                                    <div style={{ fontSize: 12, marginTop: 4, color: pasteTypeRel === 'same' ? 'var(--color-success-text)' : pasteTypeRel === 'opposite' ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>
                                        {pasteTypeRel === 'same'     && `✓ ${parsedPaste.moveContestType} move → raises judge voltage`}
                                        {pasteTypeRel === 'opposite' && `⚠ ${parsedPaste.moveContestType} move → lowers judge voltage`}
                                        {pasteTypeRel === 'adjacent' && `— no voltage effect`}
                                    </div>
                                )}
                                {pasteKeyword && KEYWORD_DESC[pasteKeyword] && (
                                    <div style={{ fontSize: 11, marginTop: 4, color: KEYWORD_COLOR[pasteKeyword] || 'var(--text-muted)', fontWeight: 600 }}>
                                        ✦ {KEYWORD_DESC[pasteKeyword]}
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirmPaste}
                                    disabled={!canConfirmPaste}
                                    style={{
                                        marginTop: 10, width: '100%', padding: '9px', borderRadius: 7, border: 'none',
                                        background: canConfirmPaste ? 'var(--gradient-purple)' : 'var(--border-light)',
                                        color: canConfirmPaste ? 'white' : 'var(--text-muted)',
                                        fontWeight: 700, fontSize: 14,
                                        cursor: canConfirmPaste ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {!pendingJudge ? 'Select a judge to confirm' : isSameMove ? '✓ Confirm (0 appeal — same move)' : `✓ Confirm Score (${parsedPaste.score})`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── NPC roll ── */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>NPC Appeal</span>
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
                                    <div>
                                        <span style={{ color: npcTypeRel === 'same' ? 'var(--color-success-text)' : npcTypeRel === 'opposite' ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>
                                            ✓ {npcMoveData.contestType} · {npcMoveData.contestDice
                                                ? npcMoveData.contestDice
                                                : <em style={{ color: '#9c27b0' }}>no base dice</em>}
                                            {npcTypeRel === 'same'     && ' — +1d4 bonus + raises voltage'}
                                            {npcTypeRel === 'opposite' && ' — lowers voltage'}
                                        </span>
                                        {npcKeyword && (
                                            <span style={{ marginLeft: 6 }}><KeywordPill keyword={npcKeyword} /></span>
                                        )}
                                        {!npcMoveData.contestDice && (
                                            <div style={{ marginTop: 3, color: '#9c27b0', fontWeight: 600, fontSize: 11 }}>
                                                ✦ 0 base appeal — keyword fires; voltage still changes
                                            </div>
                                        )}
                                        {npcKeyword && KEYWORD_DESC[npcKeyword] && (
                                            <div style={{ marginTop: 3, color: KEYWORD_COLOR[npcKeyword] || 'var(--text-muted)', fontWeight: 600 }}>
                                                ✦ {KEYWORD_DESC[npcKeyword]}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--color-danger-text)' }}>⚠ Move not found — will roll 0 base appeal</span>
                                )}
                            </div>
                        )}
                        {/* NPC move chips */}
                        {Object.keys(npcMoveOptions).length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 80, overflowY: 'auto' }}>
                                {Object.entries(npcMoveOptions).map(([name, { dice, keyword: kw }]) => (
                                    <span
                                        key={name}
                                        onClick={() => setNpcMoveName(name)}
                                        title={kw ? `${kw}: ${KEYWORD_DESC[normalizeKeyword(kw)] || kw}` : undefined}
                                        style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: `${color}18`, border: `1px solid ${color}44`, color: 'var(--text-primary)', cursor: 'pointer' }}
                                    >
                                        {name} <strong>({dice || '—'})</strong>
                                        {kw && normalizeKeyword(kw) && normalizeKeyword(kw) !== 'No Effect' && (
                                            <span style={{ marginLeft: 3, color: KEYWORD_COLOR[normalizeKeyword(kw)] || 'var(--text-muted)' }}>· {normalizeKeyword(kw)}</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 14, background: 'var(--surface-bg)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success-text)', marginBottom: 8 }}>✓ All participants have appealed this round</div>
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
                    const p        = participants.find(x => x.id === id);
                    if (!p) return null;
                    const done      = pos < turnIdx;
                    const isCurrent = pos === turnIdx;
                    const rResult   = done ? p.rounds[p.rounds.length - 1] : null;
                    const pFx       = participantEffects[id] || {};
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
                            {/* Active effect flags */}
                            {!done && (
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {pFx.getReadyActive && (
                                        <span title="Get Ready! — dice doubled this turn" style={{ fontSize: 12, padding: '1px 5px', borderRadius: 6, background: '#e91e6322', color: '#e91e63', fontWeight: 700 }}>⚡ GR</span>
                                    )}
                                    {pFx.reliableMove && (
                                        <span title={`Reliable: ${pFx.reliableMove}`} style={{ fontSize: 12, padding: '1px 5px', borderRadius: 6, background: '#e91e6322', color: '#e91e63', fontWeight: 700 }}>♻ Rel</span>
                                    )}
                                    {nextRoundFirst === id && (
                                        <span title="Quick Set — goes first next round" style={{ fontSize: 12, padding: '1px 5px', borderRadius: 6, background: '#9c27b022', color: '#9c27b0', fontWeight: 700 }}>⏩ QS</span>
                                    )}
                                    {nextRoundLast === id && (
                                        <span title="Slow Set — goes last next round" style={{ fontSize: 12, padding: '1px 5px', borderRadius: 6, background: '#9c27b022', color: '#9c27b0', fontWeight: 700 }}>⏪ SS</span>
                                    )}
                                </div>
                            )}
                            {done && rResult && (
                                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {rResult.moveName && rResult.moveName !== '—' && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{rResult.moveName}</span>
                                    )}
                                    {rResult.keyword && rResult.keyword !== 'No Effect' && (
                                        <KeywordPill keyword={rResult.keyword} />
                                    )}
                                    <span style={{ color: 'var(--text-muted)' }}>J{rResult.judgeId}</span>
                                    <strong style={{ color: rResult.isSameMove ? 'var(--color-danger-text)' : rResult.maxVoltageBonusRolls?.length ? 'var(--poke-orange)' : 'var(--text-primary)' }}>
                                        {rResult.isSameMove ? '0 (same)' : `+${rResult.appeal}`}
                                    </strong>
                                    {rResult.voltageChange !== 0 && (
                                        <span style={{ color: rResult.voltageChange > 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontSize: 12 }}>
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
