// ============================================================
// Wild Encounter Guide — PTA GM Guide, pp.15-16
// ============================================================
// Wild encounter composition, stats formula, and Pokémon allying rules.

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const ALLY_ACTIONS = [
    { value: -10, label: 'Attacking a Pokémon' },
    { value: -10, label: "Throwing a Poké Ball at the Pokémon" },
    { value: -5,  label: "Attacking a Pokémon's friends" },
    { value: -5,  label: "Destroying a Pokémon's habitat" },
    { value: -5,  label: 'Further intruding its space after it ignores you' },
    { value: -3,  label: 'Insulting or teasing a Pokémon' },
    { value: 3,   label: 'Flattering or praising the Pokémon' },
    { value: 5,   label: 'Offering food to the Pokémon' },
    { value: 10,  label: 'Offering gifts to the Pokémon' },
    { value: 10,  label: 'Healing the Pokémon' },
    { value: 10,  label: 'Protecting the Pokémon' },
];

const ALLY_SCALE = [
    { value: 50,  label: 'Allied',   color: '#00c853', desc: 'Pokémon is thrilled to see this trainer.' },
    { value: 20,  label: 'Friends',  color: '#43a047', desc: 'Pokémon will consider joining the trainer (non-Legendary).' },
    { value: 0,   label: 'Neutral',  color: '#fdd835', desc: 'Pokémon is curious about the trainer.' },
    { value: -20, label: 'Foe',      color: '#ff9800', desc: 'Pokémon is fearful of the trainer.' },
    { value: -50, label: 'Hated',    color: '#e53935', desc: 'Pokémon is hateful towards the trainer.' },
];

const EncounterGuide = () => {
    const [allyScore, setAllyScore] = useState(0);
    const [customHpBase, setCustomHpBase] = useState(5);
    const [customLevel, setCustomLevel]   = useState(10);

    const wildHp = customHpBase * 3 + customLevel * 3;
    const wildStatValue = v => v + customLevel;

    const allyTier = ALLY_SCALE.find(tier => allyScore >= tier.value) ?? ALLY_SCALE[ALLY_SCALE.length - 1];

    const barPct = Math.round(((allyScore + 50) / 100) * 100);

    const addAllyAction = val => {
        // Positive actions only count once per action per day.
        setAllyScore(prev => {
            let next = prev + val;
            if (val > 0 && prev < -10) next = prev + Math.round(val / 5); // below -10: +1/5 effect
            return Math.max(-50, Math.min(50, next));
        });
    };

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                🌿 Wild Encounter Guide
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Rules for wild encounter composition, wild Pokémon stats, and allying with wild Pokémon.
                Source: PTA GM Guide, pp.15–16.
            </p>

            {/* Encounter Composition */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">📋 Encounter Composition</h3>
                <div style={{ paddingTop: 14, fontSize: 14 }}>
                    <p style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
                        Don't pre-stat wild Pokémon — players may catch them and choose their own stat allocation.
                        Every wild encounter should have three elements:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                        {[
                            { icon: '👥', title: 'More Than One Pokémon', desc: 'Most Pokémon live in groups. Real animals travel in packs, so Pokémon do too.' },
                            { icon: '👑', title: 'A Family Leader', desc: 'This Pokémon heads the group. When it decides territory isn\'t worth defending, the rest begin to escape.' },
                            { icon: '⚡', title: 'A Reason for Aggression', desc: 'Hunger, territory defense, player provoked a curious young Pokémon — Pokémon need a reason to fight.' },
                        ].map(item => (
                            <div key={item.title} style={{
                                padding: '12px 14px', borderRadius: 8,
                                background: 'var(--surface-bg)', border: '1px solid var(--border-light)'
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)' }}>{item.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Wild Pokémon Stats Calculator */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">📊 Wild Pokémon Stats Formula</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Use the Pokémon's prominent Base Stats, then add the wild's level to each stat.
                        HP uses a different formula. Wild Pokémon do not have Death Saving Throws.
                    </p>
                    <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                        marginBottom: 14, fontSize: 13
                    }}>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>HP: </span>
                                <strong>(HP Base Stat × 3) + (Level × 3)</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>Other stats: </span>
                                <strong>Base Stat + Level</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                HP Base Stat
                            </label>
                            <input
                                type="number" min={1} max={20}
                                value={customHpBase}
                                onChange={e => setCustomHpBase(Number(e.target.value))}
                                style={{
                                    width: '100%', maxWidth: 70, padding: '6px 8px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 15, textAlign: 'center'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                Wild Level
                            </label>
                            <input
                                type="number" min={1} max={100}
                                value={customLevel}
                                onChange={e => setCustomLevel(Number(e.target.value))}
                                style={{
                                    width: '100%', maxWidth: 70, padding: '6px 8px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 15, textAlign: 'center'
                                }}
                            />
                        </div>
                        <div style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: 'var(--tint-purple-bg)',
                            border: '1px solid var(--tint-purple-border)'
                        }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wild HP: </span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-purple)' }}>{wildHp}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                                ({customHpBase}×3 + {customLevel}×3)
                            </span>
                        </div>
                        <div style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                            fontSize: 13, color: 'var(--text-secondary)'
                        }}>
                            Other stats = Base Stat + {customLevel}
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Escape checks are based on the difference between the wild's level and the players' Pokémon levels.
                        Wilds battle until successful escape or fainted.
                    </p>
                </div>
            </div>

            {/* Allying with Wild Pokémon */}
            <div className="card-orange">
                <h3 className="card-header font-bold">🤝 Allying with Wild Pokémon</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Trainers can set aside Poké Balls and try to befriend a non-aggressive wild Pokémon.
                        Track an alliance score from −50 to +50. A Pokémon below −10 responds to positive actions
                        at only 1/5 effectiveness.
                    </p>

                    {/* Scale display */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                            <span>−50 Hated</span>
                            <span>0 Neutral</span>
                            <span>+50 Allied</span>
                        </div>
                        <div style={{ height: 12, background: 'var(--border-light)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 0, height: '100%',
                                width: `${barPct}%`,
                                background: allyTier.color,
                                borderRadius: 6, transition: 'width 0.3s, background 0.3s'
                            }} />
                        </div>
                        <div style={{
                            marginTop: 8, padding: '8px 12px', borderRadius: 8,
                            background: `${allyTier.color}44`,
                            border: `1px solid ${allyTier.color}88`,
                            display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: allyTier.color }}>{allyScore > 0 ? '+' : ''}{allyScore}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: allyTier.color }}>{allyTier.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{allyTier.desc}</div>
                            </div>
                            <button
                                onClick={() => setAllyScore(0)}
                                style={{
                                    marginLeft: 'auto', padding: '4px 10px',
                                    background: 'var(--border-light)', border: 'none',
                                    borderRadius: 6, cursor: 'pointer',
                                    fontSize: 12, color: 'var(--text-muted)'
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Alliance scale reference */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>
                            Alliance Scale
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                            {ALLY_SCALE.map(tier => (
                                <div key={tier.value} style={{
                                    padding: '6px 10px', borderRadius: 6,
                                    border: `1px solid ${tier.color}88`,
                                    background: `${tier.color}30`
                                }}>
                                    <div style={{ fontWeight: 700, color: tier.color, fontSize: 13 }}>
                                        {tier.value > 0 ? '+' : ''}{tier.value} — {tier.label}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tier.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Actions That Affect the Scale
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Trainers may only benefit from positive actions once per action per day.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6 }}>
                        {ALLY_ACTIONS.map(action => (
                            <button
                                key={action.label}
                                onClick={() => addAllyAction(action.value)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', borderRadius: 8,
                                    border: action.value >= 0 ? '1px solid var(--color-success-text)' : '1px solid var(--color-danger-text)',
                                    background: action.value >= 0 ? 'var(--tint-success-bg)' : 'var(--tint-fail-bg)',
                                    cursor: 'pointer', fontSize: 13, textAlign: 'left'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                                <span style={{
                                    fontWeight: 700, fontSize: 14,
                                    color: action.value >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                                    marginLeft: 8, flexShrink: 0
                                }}>
                                    {action.value >= 0 ? '+' : ''}{action.value}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EncounterGuide;
