// ============================================================
// EXP Calculator & Awards — PTA GM Guide, pp.20
// ============================================================
// Experience formula: (EXP Drop × Pokémon Level) × multiplier
// Wild Pokémon = ×1, Trainer's Pokémon = ×2

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const ExpCalculator = () => {
    const [expDrop, setExpDrop]   = useState(20);
    const [pokeLevel, setPokeLevel] = useState(10);
    const [isTrainer, setIsTrainer] = useState(false);
    const [activeParty, setActiveParty] = useState(1);

    const multiplier = isTrainer ? 2 : 1;
    const totalExp   = expDrop * pokeLevel * multiplier;
    const splitExp   = activeParty > 0 ? Math.floor(totalExp / activeParty) : totalExp;

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                ⭐ EXP Calculator
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Award EXP to <em>each</em> active Pokémon per trainer — even on a capture.
                If a trainer has multiple active Pokémon they split the EXP drop between them.
                Source: PTA GM Guide, p.20.
            </p>

            {/* Formula card */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">📐 EXP Formula</h3>
                <div style={{ padding: '14px 16px' }}>
                    <div style={{
                        padding: '12px 16px', borderRadius: 8,
                        background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
                        fontSize: 14, lineHeight: 1.8
                    }}>
                        <div>
                            <strong>(EXP Drop × Pokémon Level)</strong>
                            <span style={{ color: 'var(--text-muted)' }}> × </span>
                            <strong>(1 + Is it a Trainer's Pokémon?)</strong>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            Wild Pokémon = ×1 &nbsp;|&nbsp; Trainer's Pokémon = ×2
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            Each of the trainer's <em>active</em> Pokémon receives this amount.
                            If the trainer has multiple active Pokémon, they split the EXP Drop between them first.
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculator */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">🧮 Interactive Calculator</h3>
                <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                                EXP Drop Value
                            </label>
                            <input
                                type="number" min={1}
                                value={expDrop}
                                onChange={e => setExpDrop(Math.max(1, Number(e.target.value)))}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 16, textAlign: 'center', boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                Look up in the alphabetic list (p.20+)
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                                Defeated Pokémon Level
                            </label>
                            <input
                                type="number" min={1} max={100}
                                value={pokeLevel}
                                onChange={e => setPokeLevel(Math.max(1, Math.min(100, Number(e.target.value))))}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 16, textAlign: 'center', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                                Active Pokémon per Trainer
                            </label>
                            <input
                                type="number" min={1} max={6}
                                value={activeParty}
                                onChange={e => setActiveParty(Math.max(1, Math.min(6, Number(e.target.value))))}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: 6,
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--surface-bg)', color: 'var(--text-primary)',
                                    fontSize: 16, textAlign: 'center', boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                Split EXP Drop between them first
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                                Pokémon Belongs To
                            </label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[false, true].map(t => (
                                    <button
                                        key={String(t)}
                                        onClick={() => setIsTrainer(t)}
                                        style={{
                                            flex: 1, padding: '8px 6px', borderRadius: 6,
                                            border: `1px solid ${isTrainer === t ? 'var(--color-purple)' : 'var(--border-light)'}`,
                                            background: isTrainer === t ? 'var(--gradient-purple)' : 'var(--surface-bg)',
                                            color: isTrainer === t ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer', fontSize: 13, fontWeight: isTrainer === t ? 700 : 400
                                        }}
                                    >
                                        {t ? '🧑 Trainer (×2)' : '🌿 Wild (×1)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Result */}
                    <div style={{
                        padding: '16px 20px', borderRadius: 10,
                        background: 'var(--tint-purple-bg)',
                        border: '1px solid var(--tint-purple-border)'
                    }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                            EXP per active Pokémon (per trainer)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-purple)' }}>{splitExp.toLocaleString()}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                = {activeParty > 1 ? `⌊${expDrop}÷${activeParty}⌋` : expDrop} EXP Drop
                                {' × '}{pokeLevel} level{' × '}{multiplier} ({isTrainer ? "trainer's" : 'wild'})
                            </span>
                        </div>
                        {activeParty > 1 && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                EXP Drop per slot: ⌊{expDrop} ÷ {activeParty}⌋ = {Math.floor(expDrop / activeParty)}
                                {' → '} × {pokeLevel} × {multiplier} = {splitExp}
                            </div>
                        )}
                        <button
                            onClick={() => toast.success(`EXP awarded: ${splitExp.toLocaleString()} per active Pokémon`)}
                            style={{
                                marginTop: 10, padding: '7px 16px',
                                background: 'var(--gradient-purple)',
                                border: 'none', borderRadius: 6, color: 'white',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            📋 Copy Result
                        </button>
                    </div>
                </div>
            </div>

            {/* EXP Drop quick reference */}
            <div className="card-orange">
                <h3 className="card-header font-bold">📖 EXP Drop Quick Reference</h3>
                <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Common EXP Drop values from the GM Guide alphabetic list.
                        Full list covers all Pokémon (pp.20–57).
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, fontSize: 13 }}>
                        {[
                            ['Abra',       15], ['Alakazam',  50], ['Arcanine',  40],
                            ['Caterpie',    5], ['Charizard', 55], ['Clefable',  55],
                            ['Dragonite',  80], ['Eevee',     25], ['Gengar',    50],
                            ['Gyarados',   65], ['Jolteon',   45], ['Lapras',    50],
                            ['Machamp',    55], ['Magikarp',   5], ['Mewtwo',   100],
                            ['Pidgey',      5], ['Pikachu',   20], ['Raichu',    40],
                            ['Snorlax',    65], ['Vaporeon',  45],
                        ].map(([name, drop]) => (
                            <div
                                key={name}
                                onClick={() => setExpDrop(drop)}
                                style={{
                                    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                                    border: '1px solid var(--border-light)',
                                    background: expDrop === drop ? 'var(--tint-purple-bg)' : 'var(--surface-bg)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-purple)' }}>{drop}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                        Click a Pokémon to load its EXP Drop into the calculator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpCalculator;
