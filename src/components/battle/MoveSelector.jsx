import React from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { parseACFromFrequency } from '../../utils/dataUtils.js';

const parseFreqLabel = (freq) => {
    if (!freq) return null;
    if (/at.?will/i.test(freq)) return 'At-Will';
    if (/eot/i.test(freq)) return 'EOT';
    if (/scene\s*x2/i.test(freq)) return 'Scene ×2';
    if (/scene/i.test(freq)) return 'Scene';
    if (/daily/i.test(freq)) return 'Daily';
    if (/shift/i.test(freq)) return 'Shift';
    return null;
};

const FREQ_STYLE = {
    'At-Will': { background: 'rgba(76,175,80,0.15)',  color: '#43a047' },
    'EOT':     { background: 'rgba(255,152,0,0.15)',  color: '#f57c00' },
    'Scene ×2':{ background: 'rgba(156,39,176,0.15)', color: '#8e24aa' },
    'Scene':   { background: 'rgba(156,39,176,0.15)', color: '#8e24aa' },
    'Daily':   { background: 'rgba(244,67,54,0.15)',  color: '#e53935' },
    'Shift':   { background: 'rgba(0,188,212,0.15)',  color: '#00838f' },
};

const CATEGORY_ICON  = { Physical: '⚔', Special: '✦', Status: '◎' };
const CATEGORY_COLOR = {
    Physical: 'var(--stat-atk, #f44336)',
    Special:  'var(--stat-satk, #9c27b0)',
    Status:   'var(--text-muted)',
};

const MoveSelector = ({ selectedPokemon, selectedMove, onSelectMove, showDetail, gameData }) => {
    if (!selectedPokemon) return null;

    const moves = selectedPokemon.moves || [];

    if (moves.length === 0) {
        return (
            <div style={{ marginBottom: '12px', textAlign: 'center', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                No moves learned yet.{' '}
                <span style={{ fontSize: '12px' }}>Add moves in the Pokémon tab.</span>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '12px', display: 'grid', gap: '6px' }}>
            {moves.map((move, idx) => {
                const isSelected = selectedMove?.name === move.name;
                const typeColor = getTypeColor(move.type);
                const gd = gameData?.moves?.[move.name] || {};
                const category = move.category || gd.category || '';
                const damage = move.damage || gd.damage || '';
                const freq = move.frequency || move.freq || gd.frequency || gd.freq || '';
                const ac = parseACFromFrequency(freq);
                const freqLabel = parseFreqLabel(freq);
                const freqStyle = freqLabel ? (FREQ_STYLE[freqLabel] || {}) : {};
                const catIcon = CATEGORY_ICON[category] || '';
                const catColor = CATEGORY_COLOR[category] || 'var(--text-muted)';
                return (
                    <div
                        key={idx}
                        style={{
                            display: 'flex', alignItems: 'stretch',
                            border: `${isSelected ? 3 : 2}px solid ${typeColor}`,
                            borderRadius: '8px', overflow: 'hidden',
                            boxShadow: isSelected ? `0 0 0 1px ${typeColor}55` : 'none',
                            transition: 'box-shadow 0.15s ease',
                        }}
                    >
                        <button
                            onClick={() => {
                                const full = { ...gd };
                                Object.entries(move).forEach(([k, v]) => { if (v !== '' && v != null) full[k] = v; });
                                onSelectMove(full);
                            }}
                            className={isSelected ? '' : 'move-select-btn'}
                            aria-pressed={isSelected}
                            style={{
                                flex: 1, padding: '9px 10px',
                                background: isSelected ? `${typeColor}28` : 'var(--surface-bg)',
                                color: 'var(--text-primary)',
                                border: 'none', cursor: 'pointer', textAlign: 'left',
                            }}
                        >
                            {/* Name row */}
                            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                {isSelected && <span aria-hidden="true" style={{ color: typeColor, fontSize: '10px', flexShrink: 0 }}>▶</span>}
                                {move.name}
                            </div>

                            {/* Metadata row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                <span
                                    className={`type-pill-single type-${(move.type || 'normal').toLowerCase()}`}
                                    style={{ color: getContrastTextColor(typeColor), fontSize: '10px', padding: '1px 6px' }}
                                >{move.type}</span>

                                {category && (
                                    <span style={{ fontSize: '11px', color: catColor, fontWeight: 600 }}>
                                        {catIcon} {category}
                                    </span>
                                )}

                                {damage && damage !== 'Status' && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{damage}</span>
                                )}

                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ac == null ? 'Auto-hit' : `AC ${ac}`}</span>

                                {freqLabel && (
                                    <span style={{
                                        fontSize: '10px', padding: '1px 5px', borderRadius: '3px',
                                        fontWeight: 600, ...freqStyle,
                                    }}>{freqLabel}</span>
                                )}
                            </div>
                        </button>

                        <button
                            onClick={() => showDetail && showDetail('move', move.name, { ...gd, ...move })}
                            style={{
                                padding: '0 12px', minWidth: '42px',
                                background: typeColor,
                                color: getContrastTextColor(typeColor),
                                border: 'none', cursor: 'pointer', fontSize: '15px',
                                transition: 'filter 0.1s ease',
                            }}
                            title="View move details"
                            aria-label={`View details for ${move.name}`}
                        >
                            ℹ
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default MoveSelector;
