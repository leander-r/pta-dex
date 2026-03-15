import React from 'react';
import { STATUS_CONDITIONS } from '../../data/statusConditions.js';

const StatusConditionUI = ({ selectedPokemon, updatePokemon }) => {
    if (!selectedPokemon) return null;
    const conditions = selectedPokemon.statusConditions || {};
    // Count only real status afflictions (PH2 p.403 — max 2 at a time)
    const activeCount = STATUS_CONDITIONS.filter(c => conditions[c.key]).length;
    const overLimit = activeCount > 2;
    const activeConditions = STATUS_CONDITIONS.filter(c => conditions[c.key]);

    return (
        <div style={{ marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Status Conditions</span>
                {overLimit && (
                    <span style={{ fontSize: '11px', color: '#e53935', fontWeight: 'normal' }} title="PH2 p.403: a Pokémon can suffer at most 2 status afflictions at the same time">
                        ⚠ max 2 per rules
                    </span>
                )}
            </div>
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
            {/* Active condition mechanics — shown inline for mobile (title tooltips don't show on touch) */}
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
    );
};

export default StatusConditionUI;
