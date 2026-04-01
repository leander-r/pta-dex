// ============================================================
// Capture Calculator — PTA GM Guide, p.19
// ============================================================
// Roll 1d100 strictly LESS THAN (captureRate + modifiers) to capture.
// Modifiers: HP condition, status effects, wild Pokémon's level range.

import React, { useState, useMemo } from 'react';
import toast from '../../utils/toast.js';

const HP_MODS = [
    { label: 'Full HP',        value: -15, note: 'Full' },
    { label: '~75% HP',        value: -5,  note: '75%'  },
    { label: '~50% HP',        value: 5,   note: '1/2'  },
    { label: '~25% HP',        value: 15,  note: '25%'  },
    { label: '1 HP remaining', value: 25,  note: '1 HP' },
];

const STATUS_MODS = [
    { label: 'No status condition',       value: 0  },
    { label: 'Attraction',                value: 3  },
    { label: 'Burn',                      value: 5  },
    { label: 'Confused',                  value: 5  },
    { label: 'Flinched (last round)',     value: 5  },
    { label: 'Poison',                    value: 5  },
    { label: 'Paralysis',                 value: 7  },
    { label: 'Badly Poisoned',            value: 10 },
    { label: 'Critical Hit (last round)', value: 10 },
    { label: 'Sleep',                     value: 10 },
    { label: 'Freeze',                    value: 15 },
];

const LEVEL_MODS = [
    { label: 'Level 1–20',   value: 20  },
    { label: 'Level 21–40',  value: 10  },
    { label: 'Level 41–60',  value: -5  },
    { label: 'Level 61–80',  value: -15 },
    { label: 'Level 81–100', value: -30 },
];

const sign = n => (n >= 0 ? `+${n}` : `${n}`);

const CaptureCalculator = () => {
    const [baseRate, setBaseRate] = useState(20);
    const [hpMod,    setHpMod]   = useState(-15);
    const [statMod,  setStatMod] = useState(0);
    const [levelMod, setLevelMod]= useState(20);
    const [rollResult, setRollResult] = useState(null);

    const target = useMemo(
        () => baseRate + hpMod + statMod + levelMod,
        [baseRate, hpMod, statMod, levelMod]
    );
    // succeed on roll 1..(target-1) out of 1-100
    const successPct = Math.max(0, Math.min(100, target - 1));

    const barColor = successPct <= 0  ? '#e53935'
                   : successPct < 25  ? '#e53935'
                   : successPct < 50  ? '#ff9800'
                   : successPct < 75  ? '#fdd835'
                   : successPct < 100 ? '#43a047'
                   :                   '#00c853';

    const roll = () => {
        const r = Math.floor(Math.random() * 100) + 1;
        const success = r < target;
        setRollResult({ value: r, success, target });
        if (success) toast.success(`Rolled ${r} — Capture SUCCESS! (needed < ${target})`);
        else         toast.error(`Rolled ${r} — Capture FAILED (needed < ${target})`);
    };

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                🎯 Capture Calculator
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Roll 1d100. Capture succeeds if the roll is <strong>strictly less than</strong> the
                modified Capture Rate. ADD all applicable modifiers.
                Species Capture Rates are listed alphabetically in the GM Guide (p.20+).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {/* Base rate */}
                <div className="card-orange" style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                        Species Capture Rate
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Look up the wild Pokémon's rate (0–100).
                        Example: Abra = 15, Pidgey = 60, Mewtwo = 0.
                    </p>
                    <input
                        type="number" min={0} max={100}
                        value={baseRate}
                        onChange={e => { setBaseRate(Number(e.target.value)); setRollResult(null); }}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            border: '1px solid var(--border-light)',
                            background: 'var(--surface-bg)', color: 'var(--text-primary)',
                            fontSize: 20, fontWeight: 700, textAlign: 'center',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* HP modifier */}
                <div className="card-orange" style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                        HP Condition <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({sign(hpMod)})</span>
                    </div>
                    <select
                        value={hpMod}
                        onChange={e => { setHpMod(Number(e.target.value)); setRollResult(null); }}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            border: '1px solid var(--border-light)',
                            background: 'var(--surface-bg)', color: 'var(--text-primary)',
                            fontSize: 14, boxSizing: 'border-box'
                        }}
                    >
                        {HP_MODS.map(m => (
                            <option key={m.label} value={m.value}>{m.label} ({sign(m.value)})</option>
                        ))}
                    </select>
                </div>

                {/* Status modifier */}
                <div className="card-orange" style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                        Status Condition <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({sign(statMod)})</span>
                    </div>
                    <select
                        value={statMod}
                        onChange={e => { setStatMod(Number(e.target.value)); setRollResult(null); }}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            border: '1px solid var(--border-light)',
                            background: 'var(--surface-bg)', color: 'var(--text-primary)',
                            fontSize: 14, boxSizing: 'border-box'
                        }}
                    >
                        {STATUS_MODS.map(m => (
                            <option key={m.label} value={m.value}>{m.label} ({sign(m.value)})</option>
                        ))}
                    </select>
                </div>

                {/* Level modifier */}
                <div className="card-orange" style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                        Wild Pokémon Level <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({sign(levelMod)})</span>
                    </div>
                    <select
                        value={levelMod}
                        onChange={e => { setLevelMod(Number(e.target.value)); setRollResult(null); }}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            border: '1px solid var(--border-light)',
                            background: 'var(--surface-bg)', color: 'var(--text-primary)',
                            fontSize: 14, boxSizing: 'border-box'
                        }}
                    >
                        {LEVEL_MODS.map(m => (
                            <option key={m.label} value={m.value}>{m.label} ({sign(m.value)})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Result */}
            <div className="card-orange" style={{ marginTop: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                            Modified Capture Rate
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 38, fontWeight: 800, color: barColor }}>
                                {target <= 0 ? 0 : target}
                            </span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                = {baseRate} base {sign(hpMod)} HP {sign(statMod)} status {sign(levelMod)} level
                            </span>
                        </div>
                        {target <= 0 && (
                            <div style={{ color: 'var(--color-danger-text)', fontWeight: 600, fontSize: 13 }}>
                                Impossible — no roll can succeed (modified rate ≤ 0)
                            </div>
                        )}
                        {target > 100 && (
                            <div style={{ color: 'var(--color-success-text)', fontWeight: 600, fontSize: 13 }}>
                                Succeeds on any roll (rate &gt; 100)
                            </div>
                        )}
                    </div>
                    <button
                        onClick={roll}
                        disabled={target <= 0}
                        title={target <= 0 ? 'Capture rate is 0 or lower — adjust the modifiers above' : undefined}
                        style={{
                            padding: '10px 24px',
                            background: target <= 0 ? 'var(--border-light)' : 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))',
                            border: 'none', borderRadius: 8, color: target <= 0 ? 'var(--text-muted)' : 'white',
                            fontSize: 15, fontWeight: 700,
                            cursor: target <= 0 ? 'not-allowed' : 'pointer',
                            boxShadow: target <= 0 ? 'none' : '0 2px 6px rgba(0,0,0,0.18)'
                        }}
                    >
                        🎲 Roll d100
                    </button>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Capture chance (succeed on 1–{Math.max(0, Math.min(100, target - 1))})</span>
                        <span style={{ fontWeight: 700, color: barColor }}>{successPct}%</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--border-light)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${successPct}%`,
                            background: barColor, borderRadius: 5,
                            transition: 'width 0.3s, background 0.3s'
                        }} />
                    </div>
                </div>

                {rollResult && (
                    <div style={{
                        marginTop: 14, padding: '12px 16px', borderRadius: 8,
                        background: rollResult.success ? 'var(--tint-success-bg)' : 'var(--tint-fail-bg)',
                        border: `1px solid ${rollResult.success ? 'var(--color-success-text)' : 'var(--color-danger-text)'}`,
                        display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        <span style={{ fontSize: 22 }}>{rollResult.success ? '✅' : '❌'}</span>
                        <div>
                            <div style={{ fontWeight: 700, color: rollResult.success ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                Rolled {rollResult.value} — {rollResult.success ? 'CAPTURE SUCCESSFUL' : 'CAPTURE FAILED'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Needed 1–{rollResult.target - 1} to succeed (strictly less than {rollResult.target})
                            </div>
                        </div>
                    </div>
                )}

                <div style={{
                    marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)',
                    fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6
                }}>
                    ⓘ Basic Ball adds +15 to the d100 roll (higher roll = harder to capture). Other ball modifiers are GM discretion.
                    Always award EXP to active Pokémon even on a successful capture.
                </div>
            </div>
        </div>
    );
};

export default CaptureCalculator;
