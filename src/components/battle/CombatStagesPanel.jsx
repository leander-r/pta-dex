import React, { useState } from 'react';
import { COMBAT_STAGE_POSITIVE_MULTIPLIER, COMBAT_STAGE_NEGATIVE_MULTIPLIER } from '../../data/constants.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const STATS = [
    { key: 'atk',  label: 'ATK',  color: '#f44336', desc: 'Attack - affects Physical move damage' },
    { key: 'def',  label: 'DEF',  color: '#2196f3', desc: 'Defense - reduces Physical damage taken' },
    { key: 'satk', label: 'SATK', color: '#9c27b0', desc: 'Special Attack - affects Special move damage' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800', desc: 'Special Defense - reduces Special damage taken' },
    { key: 'spd',  label: 'SPD',  color: '#00bcd4', desc: 'Speed - determines turn order in battle' },
    { key: 'acc',  label: 'ACC',  color: '#4caf50', desc: 'Accuracy - adds/subtracts from hit roll (1d20)' },
    { key: 'eva',  label: 'EVA',  color: '#607d8b', desc: 'Evasion - subtracts from opponent hit rolls' },
];

const getModifiedStat = (baseStat, stages) => {
    if (stages > 0) return Math.floor(baseStat * (1 + stages * COMBAT_STAGE_POSITIVE_MULTIPLIER));
    if (stages < 0) return Math.ceil(baseStat * (1 - Math.abs(stages) * COMBAT_STAGE_NEGATIVE_MULTIPLIER));
    return baseStat;
};

const CombatStagesPanel = ({ selectedPokemon, combatStages, getStatsWithMega, updateCombatStage, resetCombatStages, onHelp, statusConditions }) => {
    const [show, setShow] = useState(false);

    if (!selectedPokemon) return null;

    const actualStats = getStatsWithMega(selectedPokemon);

    return (
        <div style={{ marginBottom: '12px' }}>
            <div
                role="button"
                tabIndex={0}
                aria-expanded={show}
                aria-label={`${show ? 'Hide' : 'Show'} combat stages`}
                onClick={() => setShow(v => !v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShow(v => !v)}
                className="combat-stages-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: show ? '8px' : 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                        title="Combat Stages track stat buffs and debuffs from moves. Each positive stage increases the stat by 25%, each negative stage decreases it by 10%. At +6: 250% of original. At -6: 40% of original. Range: -6 to +6."
                    >
                        Combat Stages
                    </span>
                    {onHelp && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHelp(); }}
                            style={HELP_BTN_STYLE}
                            aria-label="Help: Combat Stages"
                            title="About combat stages"
                        >?</button>
                    )}
                    {!show && (() => {
                        const nonZero = STATS.filter(s => (combatStages[s.key] || 0) !== 0);
                        return nonZero.length > 0 ? (
                            <span style={{ fontSize: '11px', background: '#667eea', color: 'white', padding: '1px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                                {nonZero.length} active
                            </span>
                        ) : (
                            <span className="text-muted" style={{ fontSize: '12px' }}>Buffs &amp; debuffs from moves</span>
                        );
                    })()}
                    {show && <span className="text-muted" style={{ fontSize: '12px', marginLeft: '2px' }}>Buffs &amp; debuffs from moves</span>}
                </div>
                <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: show ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                    aria-hidden="true"
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>
            {show && (
                <div className="combat-stages-content" style={{ padding: '10px', borderRadius: '6px' }}>
                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>
                        +1 stage = +25% stat | −1 stage = −10% stat | At ±6: 250% / 40% | Range: −6 to +6
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {STATS.map(stat => {
                            const baseStat = actualStats[stat.key] || 0;
                            const stages = combatStages[stat.key] || 0;
                            const isModOnly = stat.key === 'acc' || stat.key === 'eva';
                            const modifiedStat = isModOnly ? stages : getModifiedStat(baseStat, stages);
                            const burnOverlay = stat.key === 'def' && (statusConditions?.burned);
                            const poisonOverlay = stat.key === 'sdef' && (statusConditions?.poisoned || statusConditions?.badlyPoisoned);
                            return (
                                <div key={stat.key} className="combat-stat-box" style={{ textAlign: 'center', padding: '6px', borderRadius: '4px' }} title={stat.desc}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {isModOnly ? '±' : baseStat} → <strong style={{ color: stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : 'var(--text-primary)' }}>
                                            {isModOnly ? (stages >= 0 ? '+' : '') + stages : modifiedStat}
                                        </strong>
                                    </div>
                                    {(burnOverlay || poisonOverlay) && (
                                        <div
                                            title={burnOverlay
                                                ? 'Burn: DEF treated as −2 combat stages for damage calculations (PH2 p.403). This is a separate damage penalty — do NOT adjust the stage counter.'
                                                : 'Poison: SDEF treated as −2 combat stages for damage calculations (PH2 p.403). This is a separate damage penalty — do NOT adjust the stage counter.'}
                                            style={{ fontSize: '10px', color: burnOverlay ? '#f44336' : '#9c27b0', fontWeight: 'bold', marginTop: '2px', cursor: 'help' }}
                                        >
                                            {burnOverlay ? '🔥' : '☠️'} −2 eff.
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, -1)}
                                            className="combat-stage-btn combat-stage-btn-minus"
                                            style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                            aria-label={`Decrease ${stat.label}`}
                                        >−</button>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: stages > 0 ? '#4caf50' : stages < 0 ? '#f44336' : '#999', minWidth: '20px' }}>
                                            {stages > 0 ? '+' : ''}{stages}
                                        </span>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, 1)}
                                            className="combat-stage-btn combat-stage-btn-plus"
                                            style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                            aria-label={`Increase ${stat.label}`}
                                        >+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={resetCombatStages}
                        style={{ marginTop: '8px', width: '100%', padding: '6px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Reset All Stages
                    </button>

                    {/* Base Evasion — derived from stats, before EVA stage modifier (PH2 p.255) */}
                    <div
                        title="Base evasion values derived from stats (PH2 p.255). Add the EVA combat stage modifier above for total evasion used in accuracy checks."
                        style={{ marginTop: '10px', padding: '7px 10px', borderRadius: '5px', background: 'var(--bg-secondary, #f5f5f5)', border: '1px solid var(--border-light)' }}
                    >
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Base Evasion (from stats)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                            <div title="Physical Evasion = DEF stat ÷ 5, max 6 (PH2 p.255)">
                                <div style={{ fontSize: '10px', color: '#2196f3' }}>Phys Eva</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2196f3' }}>
                                    +{Math.min(6, Math.floor((actualStats.def || 0) / 5))}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DEF÷5</div>
                            </div>
                            <div title="Special Evasion = SDEF stat ÷ 5, max 6 (PH2 p.255)">
                                <div style={{ fontSize: '10px', color: '#ff9800' }}>Spec Eva</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff9800' }}>
                                    +{Math.min(6, Math.floor((actualStats.sdef || 0) / 5))}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SDEF÷5</div>
                            </div>
                            <div title="Speed Evasion = SPD stat ÷ 10, max 6 (PH2 p.255)">
                                <div style={{ fontSize: '10px', color: '#00bcd4' }}>Spd Eva</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00bcd4' }}>
                                    +{Math.min(6, Math.floor((actualStats.spd || 0) / 10))}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SPD÷10</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                            Total EVA = base + EVA stage modifier above
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatStagesPanel;
