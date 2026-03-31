// ============================================================
// Death Saves & Fainting — PTA GM Guide, p.17
// ============================================================
// Rules for Pokémon/Trainer fainting, death saves, and lethal thresholds.

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const DeathSaves = () => {
    const [trainerLevel, setTrainerLevel] = useState(10);
    const [pokeLevel,    setPokeLevel]    = useState(25);
    const [trainerRoll,  setTrainerRoll]  = useState(null);
    const [pokeRoll,     setPokeRoll]     = useState(null);

    // Trainer: roll 1d20; succeed if roll ≤ level (max 18)
    const trainerDC = Math.min(18, trainerLevel);
    const rollTrainer = () => {
        const r = Math.floor(Math.random() * 20) + 1;
        const success = r <= trainerDC;
        setTrainerRoll({ value: r, success, dc: trainerDC });
        if (success) toast.success(`Trainer death save: rolled ${r} (≤ ${trainerDC}) — SURVIVED!`);
        else         toast.error(`Trainer death save: rolled ${r} (> ${trainerDC}) — DIED!`);
    };

    // Pokémon: roll 1d100; succeed if roll ≤ level×2 (max 90)
    const pokeDC = Math.min(90, pokeLevel * 2);
    const rollPoke = () => {
        const r = Math.floor(Math.random() * 100) + 1;
        const success = r <= pokeDC;
        setPokeRoll({ value: r, success, dc: pokeDC });
        if (success) toast.success(`Pokémon death save: rolled ${r} (≤ ${pokeDC}) — SURVIVED!`);
        else         toast.error(`Pokémon death save: rolled ${r} (> ${pokeDC}) — DIED!`);
    };

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                💀 Death Saves & Fainting
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Fainting happens at 0 HP; death is possible below −100% max HP.
                Source: PTA GM Guide, p.17.
            </p>

            {/* Fainting rules */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">😵 Fainting Rules</h3>
                <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--tint-blue-bg)', border: '1px solid var(--tint-blue-border)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--poke-blue)', marginBottom: 6 }}>🧑 Trainer Fainting</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            At <strong>0 HP</strong>: Fainted. Cannot Shift, issue commands, or use Trainer Actions.
                            Can still be attacked and suffer status ailment damage.
                        </div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--tint-orange-bg)', border: '1px solid var(--tint-orange-border)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--poke-orange)', marginBottom: 6 }}>🐾 Pokémon Fainting</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            At <strong>0 HP</strong>: Fainted. Cannot act. Can still be attacked and suffer status damage
                            until returned to Poké Ball. Wild Pokémon have <strong>no Death Saving Throws</strong>.
                        </div>
                    </div>
                </div>
            </div>

            {/* Death threshold */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">⚠️ Death Threshold & Lethal Damage</h3>
                <div style={{ paddingTop: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            padding: '12px 14px', borderRadius: 8,
                            background: 'var(--tint-red-bg)', border: '1px solid var(--tint-red-border)'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', marginBottom: 4 }}>Trainer Death</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                HP reaches <strong>−100%</strong> of max HP → Roll a Death Saving Throw.
                                If stabilized after success, another DST in 10 minutes if not treated.
                            </div>
                        </div>
                        <div style={{
                            padding: '12px 14px', borderRadius: 8,
                            background: 'var(--tint-red-bg)', border: '1px solid var(--tint-red-border)'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', marginBottom: 4 }}>Pokémon Death</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                HP reaches <strong>−100%</strong> of max HP → Roll a Death Saving Throw.
                                If not stabilized, returned to ball, or treated — another DST in 2 minutes.
                            </div>
                        </div>
                    </div>
                    <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'var(--tint-orange-bg)', border: '1px solid var(--tint-orange-border)',
                        fontSize: 13, color: 'var(--text-secondary)'
                    }}>
                        <strong>Low-level protection:</strong> Pokémon under <strong>level 30</strong> and Trainers under <strong>level 20</strong>
                        cannot deal lethal damage. Instead, their hits cap out at −90% of the target's HP
                        (not enough to trigger a DST).
                    </div>
                </div>
            </div>

            {/* Trainer DST calculator */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">🧑 Trainer Death Saving Throw</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Roll <strong>1d20</strong>. Success if roll ≤ Trainer Level (capped at 18).
                        The cap leaves at least a 10% chance of death at all times. Fail = death.
                    </p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                                Trainer Level
                            </label>
                            <input
                                type="number" min={1} max={50}
                                value={trainerLevel}
                                onChange={e => setTrainerLevel(Math.max(1, Math.min(50, Number(e.target.value))))}
                                style={{
                                    width: '100%', maxWidth: 80, padding: '7px 10px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 16, textAlign: 'center'
                                }}
                            />
                        </div>
                        <div style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                            fontSize: 14
                        }}>
                            Must roll ≤ <strong style={{ color: 'var(--poke-blue)', fontSize: 18 }}>{trainerDC}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                                ({trainerDC === 18 ? 'capped at 18' : `= level ${trainerLevel}`}, {Math.round(trainerDC / 20 * 100)}% survival chance)
                            </span>
                        </div>
                        <button
                            onClick={rollTrainer}
                            style={{
                                padding: '9px 20px',
                                background: 'var(--gradient-blue)',
                                border: 'none', borderRadius: 8, color: 'white',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                            }}
                        >
                            🎲 Roll 1d20
                        </button>
                    </div>
                    {trainerRoll && (
                        <div style={{
                            padding: '12px 16px', borderRadius: 8,
                            background: trainerRoll.success ? 'var(--tint-success-bg)' : 'var(--tint-fail-bg)',
                            border: `1px solid ${trainerRoll.success ? 'var(--color-success-text)' : 'var(--color-danger-text)'}`,
                            display: 'flex', gap: 12, alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 22 }}>{trainerRoll.success ? '✅' : '☠️'}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: trainerRoll.success ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                    Rolled {trainerRoll.value} — {trainerRoll.success ? 'SURVIVED! Must be stabilized.' : 'DIED!'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Needed 1–{trainerRoll.dc} to survive (DC {trainerRoll.dc})
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pokémon DST calculator */}
            <div className="card-orange">
                <h3 className="card-header font-bold">🐾 Pokémon Death Saving Throw</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Roll <strong>1d100</strong>. Success if roll ≤ Pokémon Level × 2 (capped at 90).
                        The cap leaves at least a 10% chance of death. Fail = death.
                        Wild Pokémon do <strong>not</strong> roll death saves.
                    </p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                                Pokémon Level
                            </label>
                            <input
                                type="number" min={1} max={100}
                                value={pokeLevel}
                                onChange={e => setPokeLevel(Math.max(1, Math.min(100, Number(e.target.value))))}
                                style={{
                                    width: '100%', maxWidth: 80, padding: '7px 10px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 16, textAlign: 'center'
                                }}
                            />
                        </div>
                        <div style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                            fontSize: 14
                        }}>
                            Must roll ≤ <strong style={{ color: 'var(--poke-orange)', fontSize: 18 }}>{pokeDC}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                                ({pokeDC === 90 ? 'capped at 90' : `= ${pokeLevel}×2`}, {pokeDC}% survival chance)
                            </span>
                        </div>
                        <button
                            onClick={rollPoke}
                            style={{
                                padding: '9px 20px',
                                background: 'linear-gradient(135deg, var(--danger-btn-start), var(--danger-btn-end))',
                                border: 'none', borderRadius: 8, color: 'white',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                            }}
                        >
                            🎲 Roll 1d100
                        </button>
                    </div>
                    {pokeRoll && (
                        <div style={{
                            padding: '12px 16px', borderRadius: 8,
                            background: pokeRoll.success ? 'var(--tint-success-bg)' : 'var(--tint-fail-bg)',
                            border: `1px solid ${pokeRoll.success ? 'var(--color-success-text)' : 'var(--color-danger-text)'}`,
                            display: 'flex', gap: 12, alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 22 }}>{pokeRoll.success ? '✅' : '☠️'}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: pokeRoll.success ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                    Rolled {pokeRoll.value} — {pokeRoll.success ? 'SURVIVED! Must be stabilized or returned to ball.' : 'DIED!'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Needed 1–{pokeRoll.dc} to survive (DC {pokeRoll.dc})
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeathSaves;
