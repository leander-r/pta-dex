// ============================================================
// Loyalty Guide — PTA GM Guide, pp.10-13
// ============================================================
// Loyalty ranks 0-4, how it changes, defiance table (d100),
// expressing loyalty, and allying details.

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const LOYALTY_RANKS = [
    {
        rank: 0,
        label: 'Defiant',
        color: '#e53935',
        desc: 'Pokémon is actively defiant. May use Frustration. May refuse to evolve even if requirements are met. Pokémon caught through Snagging or deemed the trainer unworthy (e.g. level 1 trainer capturing a level 50 Pokémon) begin here.',
    },
    {
        rank: 1,
        label: 'Wary',
        color: '#ff7043',
        desc: 'Follows commands but is wary. May use Frustration. Pokémon may refuse to evolve even if requirements are met. Pokémon normally captured or befriended begin here.',
    },
    {
        rank: 2,
        label: 'Neutral',
        color: '#fdd835',
        desc: 'Cares about its trainer, follows commands. Normally immune to Snagging (except through extra features). Pokémon hatched from eggs or befriended with the Pokémon\'s full consent may start here.',
    },
    {
        rank: 3,
        label: 'Friendly',
        color: '#66bb6a',
        desc: 'Actively likes its trainer and follows commands happily. May use Return. Completely immune to Snagging. A trainer\'s starter generally begins here.',
    },
    {
        rank: 4,
        label: 'Loyal',
        color: '#42a5f5',
        desc: 'LOVES its trainer and never wants to be apart. May use Return. Completely immune to Snagging. A starter may begin here if the GM so chooses.',
    },
];

const LOWER_LOYALTY = [
    'Pokémon is fired upon by its own trainer or teammates on the trainer\'s orders (e.g. AoE attacks).',
    'Trainer constantly pushes a Pokémon too hard (features that sacrifice HP, or repeatedly letting it faint).',
    'Constantly feeding the Pokémon food with the Bitter keyword, or flavors the Pokémon dislikes.',
    'Seeing cruelty done to another Pokémon on the team.',
    'Species-specific dislikes: starving a Snorlax, keeping a fire type too wet, insulting a fighting type\'s pride, etc.',
    'Nature: proud Pokémon dislike being benched; lazy Pokémon dislike being used too often.',
];

const RAISE_LOYALTY = [
    'Loyalty should rise naturally over in-game time — every few in-game weeks with no negative actions.',
    'Triumphant events: solo-ing a gym, saving the trainer\'s life, a major battle victory.',
    'Stone evolutions are not GM-controlled — they happen automatically.',
];

const DEFIANCE_TABLE = [
    { range: '01–10', result: 'Acts as normal. It must have been feeling generous.' },
    { range: '11–20', result: 'Decides to take a nap. Falls asleep for 1d4 turns.' },
    { range: '21–30', result: 'Thinks it knows better. Uses a completely different attack from its moveset.' },
    { range: '31–40', result: 'Begins to wander off, ignoring directions. Shifts in a random direction and takes no other action.' },
    { range: '41–50', result: 'Annoyed by its trainer\'s voice. Pokémon cannot hear anything for 1d4 turns.' },
    { range: '51–60', result: 'Tries to make conversation with the enemy — spills team strategy. Enemy\'s next attack cannot miss.' },
    { range: '61–70', result: 'Complains to the enemy about its trainer. Enemy\'s next attack targets the trainer.' },
    { range: '71–80', result: 'Accidentally offends the enemy. Enemy\'s next attack deals +3 STAB.' },
    { range: '81–90', result: 'Attempts to escape. If successful, the Pokémon is gone forever.' },
    { range: '91–00', result: 'Flies into a rage and attacks its Trainer.' },
];

const LoyaltyGuide = () => {
    const [defianceRoll, setDefianceRoll] = useState(null);
    const [expandedRank, setExpandedRank] = useState(1);

    const rollDefiance = () => {
        const r = Math.floor(Math.random() * 100) + 1;
        const normalized = r === 100 ? 100 : r;
        const entry = DEFIANCE_TABLE.find(e => {
            const [lo, hi] = e.range.replace('00', '100').split('–').map(Number);
            return normalized >= lo && normalized <= hi;
        });
        setDefianceRoll({ roll: r === 100 ? '00' : String(r).padStart(2, '0'), entry });
        toast.info(`Defiance roll: ${r} — ${entry?.result ?? '?'}`);
    };

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                ❤️ Loyalty Guide
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Pokémon loyalty comes in 5 ranks (0–4). The GM tracks each Pokémon's loyalty privately
                and uses it to control evolution timing and behavior. Source: PTA GM Guide, pp.10–13.
            </p>

            {/* Loyalty Ranks */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">🏅 Loyalty Ranks</h3>
                <div style={{ paddingTop: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {LOYALTY_RANKS.map(lr => (
                            <div
                                key={lr.rank}
                                style={{
                                    borderRadius: 8,
                                    border: `1px solid ${lr.color}88`,
                                    background: expandedRank === lr.rank ? `${lr.color}38` : `${lr.color}22`,
                                    overflow: 'hidden'
                                }}
                            >
                                <button
                                    onClick={() => setExpandedRank(expandedRank === lr.rank ? null : lr.rank)}
                                    aria-expanded={expandedRank === lr.rank}
                                    style={{
                                        width: '100%', padding: '10px 14px', display: 'flex',
                                        alignItems: 'center', gap: 10,
                                        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
                                    }}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: lr.color, color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 14, flexShrink: 0
                                    }}>
                                        {lr.rank}
                                    </div>
                                    <div style={{ fontWeight: 700, color: lr.color, fontSize: 15 }}>
                                        Loyalty {lr.rank} — {lr.label}
                                    </div>
                                    <svg
                                        aria-hidden="true"
                                        style={{ marginLeft: 'auto', flexShrink: 0, transform: expandedRank === lr.rank ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                                    >
                                        <path d="M2 4.5L7 9.5L12 4.5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                {expandedRank === lr.rank && (
                                    <div style={{ padding: '8px 14px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: `1px solid ${lr.color}33` }}>
                                        {lr.desc}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* What lowers loyalty */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">📉 What Lowers Loyalty</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Loyalty 4 Pokémon understand hardship and will forgive much — but a true betrayal drops
                        it hard and recovering it becomes very difficult.
                    </p>
                    <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18 }}>
                        {LOWER_LOYALTY.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                </div>
            </div>

            {/* What raises loyalty */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">📈 What Raises Loyalty</h3>
                <div style={{ paddingTop: 14 }}>
                    <div style={{
                        padding: '8px 12px', borderRadius: 6, marginBottom: 10,
                        background: 'var(--tint-orange-bg)', border: '1px solid var(--tint-orange-border)',
                        fontSize: 13, color: 'var(--poke-orange)', fontWeight: 600,
                    }}>
                        ⚠️ Loyalty 3 and 4 cannot be gained passively — only through triumphant events.
                    </div>
                    <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 18 }}>
                        {RAISE_LOYALTY.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                </div>
            </div>

            {/* Defiance Table */}
            <div className="card-orange">
                <h3 className="card-header font-bold">⚠️ Defiance Table (Loyalty 0)</h3>
                <div style={{ paddingTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                        At Loyalty 0 — if cruelty was benign/neglectful — consult this table each time the trainer
                        tries to order the Pokémon. With active violence, the Pokémon is GM-controlled and attacks.
                        Ace Trainers with <em>Beast Master</em> are immune to these effects.
                    </p>

                    <button
                        onClick={rollDefiance}
                        style={{
                            padding: '9px 20px', marginBottom: 14,
                            background: 'linear-gradient(135deg, var(--danger-btn-start), var(--danger-btn-end))',
                            border: 'none', borderRadius: 8, color: 'white',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                        }}
                    >
                        🎲 Roll Defiance (d100)
                    </button>

                    {defianceRoll && (
                        <div style={{
                            marginBottom: 14, padding: '12px 16px', borderRadius: 8,
                            background: 'var(--tint-fail-bg)', border: '1px solid var(--color-danger-text)',
                            display: 'flex', gap: 12, alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-danger-text)', flexShrink: 0 }}>
                                {defianceRoll.roll}
                            </span>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                <strong>{defianceRoll.entry?.range}:</strong> {defianceRoll.entry?.result}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {DEFIANCE_TABLE.map((row, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: 12, padding: '7px 10px', borderRadius: 6,
                                background: defianceRoll?.entry === row ? 'var(--tint-fail-bg)' : 'var(--surface-bg)',
                                border: `1px solid ${defianceRoll?.entry === row ? 'var(--color-danger-text)' : 'var(--border-light)'}`,
                                fontSize: 13
                            }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-danger-text)', flexShrink: 0, width: 54 }}>{row.range}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{row.result}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyGuide;
