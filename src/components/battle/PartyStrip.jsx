import React from 'react';
import { calculatePokemonHP } from '../../utils/dataUtils.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';

/**
 * PartyStrip — horizontal scrollable sprite strip for selecting a party member.
 * On mobile portrait (≤480px) it wraps to a 2×3 grid via .party-strip CSS class.
 */
const PartyStrip = ({ party, selectedPokemonId, onSelect }) => {
    if (!party?.length) return null;

    return (
        <div
            role="group"
            aria-label="Select Pokémon"
            className="party-strip"
            style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '10px', scrollbarWidth: 'none' }}
        >
            {party.map(poke => {
                const maxHP = calculatePokemonHP(poke);
                const currentHP = maxHP - (poke.currentDamage || 0);
                const hpPct = maxHP > 0 ? Math.max(0, Math.min(1, currentHP / maxHP)) : 0;
                const hpColor = hpPct > 0.5 ? 'var(--stat-hp)' : hpPct > 0.25 ? '#ff9800' : '#f44336';
                const isSelected = selectedPokemonId === poke.id;
                const sprite = getPokemonDisplayImage(poke);
                return (
                    <button
                        key={poke.id}
                        onClick={() => onSelect(poke.id)}
                        aria-label={`${poke.name || poke.species} Lv.${poke.level} — HP ${currentHP}/${maxHP}`}
                        aria-pressed={isSelected}
                        className="party-strip-btn"
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '6px 6px 4px', borderRadius: '8px', flexShrink: 0,
                            border: `2px solid ${isSelected ? 'var(--poke-orange)' : 'var(--border-light)'}`,
                            background: isSelected ? 'var(--tint-orange-bg, rgba(245,166,35,0.1))' : 'var(--surface-bg)',
                            cursor: 'pointer', minWidth: '60px', maxWidth: '70px',
                            transition: 'border-color 0.15s ease, background 0.15s ease',
                            boxShadow: isSelected ? '0 0 0 1px var(--poke-orange)' : 'none',
                        }}
                    >
                        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                            {sprite
                                ? <img src={sprite} alt="" aria-hidden="true" style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: !poke.avatar ? 'pixelated' : 'auto' }} />
                                : <div aria-hidden="true" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🐾</div>
                            }
                            {poke.level != null && (
                                <span aria-hidden="true" style={{
                                    position: 'absolute', bottom: '-2px', right: '-2px',
                                    fontSize: '9px', fontWeight: 700, lineHeight: 1,
                                    padding: '2px 3px', borderRadius: '4px',
                                    background: 'var(--surface-bg)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-light)',
                                }}>
                                    {poke.level}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? 'var(--poke-orange)' : 'var(--text-primary)', marginTop: '2px', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {poke.name || poke.species}
                        </div>
                        <div style={{ width: '100%', height: '3px', background: 'var(--border-light)', borderRadius: '2px', marginTop: '3px' }}>
                            <div style={{ height: '100%', borderRadius: '2px', width: `${hpPct * 100}%`, background: hpColor, transition: 'width 0.2s ease' }} />
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{currentHP}/{maxHP}</div>
                    </button>
                );
            })}
        </div>
    );
};

export default PartyStrip;
