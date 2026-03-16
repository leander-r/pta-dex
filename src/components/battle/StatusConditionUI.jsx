import React, { useState } from 'react';
import { STATUS_CONDITIONS } from '../../data/statusConditions.js';

const Chevron = ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        aria-hidden="true"
    >
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);

const StatusConditionUI = ({ selectedPokemon, updatePokemon }) => {
    const [open, setOpen] = useState(true);

    if (!selectedPokemon) return null;
    const conditions = selectedPokemon.statusConditions || {};
    const overLimit = STATUS_CONDITIONS.filter(c => conditions[c.key]).length > 2;
    const activeConditions = STATUS_CONDITIONS.filter(c => conditions[c.key]);

    return (
        <div style={{ marginBottom: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-label={`${open ? 'Hide' : 'Show'} status conditions`}
                onClick={() => setOpen(v => !v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(v => !v)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Status Conditions</span>
                    {activeConditions.map(c => (
                        <span key={c.key} style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: c.color, color: 'white', fontWeight: 'bold' }}>
                            {c.icon} {c.label}
                        </span>
                    ))}
                    {overLimit && (
                        <span style={{ fontSize: '11px', color: '#e53935' }} title="PH2 p.403: a Pokémon can suffer at most 2 status afflictions at the same time">
                            ⚠ max 2
                        </span>
                    )}
                </div>
                <Chevron open={open} />
            </div>
            {open && (
                <div style={{ padding: '0 10px 10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {STATUS_CONDITIONS.map(cond => {
                            const isActive = !!conditions[cond.key];
                            return (
                                <button
                                    key={cond.key}
                                    onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, {
                                        statusConditions: { ...conditions, [cond.key]: !isActive }
                                    })}
                                    style={{
                                        padding: '3px 8px', borderRadius: '12px',
                                        border: isActive ? `2px solid ${cond.color}` : '1px solid var(--border-medium, #ccc)',
                                        background: isActive ? cond.color : 'transparent',
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer', fontSize: '12px',
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        transition: 'all 0.15s ease'
                                    }}
                                    title={`${cond.label}: ${cond.mechanic}`}
                                >
                                    {cond.icon} {cond.label}
                                </button>
                            );
                        })}
                    </div>
                    {activeConditions.length > 0 && (
                        <div style={{ marginTop: '7px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {activeConditions.map(cond => (
                                <div key={cond.key} style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    <span style={{ color: cond.color, fontWeight: 'bold' }}>{cond.icon} {cond.label}:</span>{' '}
                                    {cond.mechanic}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatusConditionUI;
