import React, { useState } from 'react';
import { COMBAT_STAGE_POSITIVE_MULTIPLIER, COMBAT_STAGE_NEGATIVE_MULTIPLIER } from '../../data/constants.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const STATS = [
    { key: 'atk',  label: 'ATK',  color: 'var(--stat-atk, #f44336)',  desc: 'Attack - affects Physical move damage' },
    { key: 'def',  label: 'DEF',  color: 'var(--stat-def, #2196f3)',  desc: 'Defense - reduces Physical damage taken' },
    { key: 'satk', label: 'SATK', color: 'var(--stat-satk, #9c27b0)', desc: 'Special Attack - affects Special move damage' },
    { key: 'sdef', label: 'SDEF', color: 'var(--stat-sdef, #ff9800)', desc: 'Special Defense - reduces Special damage taken' },
    { key: 'spd',  label: 'SPD',  color: 'var(--stat-spd, #00bcd4)',  desc: 'Speed - determines turn order in battle' },
    { key: 'acc',  label: 'ACC',  color: 'var(--stat-hp, #4caf50)',   desc: 'Accuracy - adds/subtracts from hit roll (1d20)' },
    { key: 'eva',  label: 'EVA',  color: '#607d8b',                   desc: 'Evasion - subtracts from opponent hit rolls' },
];

// Raw hex values used for alpha-transparency compositing (CSS vars can't be used with string concat)
const STAT_HEX = {
    atk: '#f44336', def: '#2196f3', satk: '#9c27b0',
    sdef: '#ff9800', spd: '#00bcd4', acc: '#4caf50', eva: '#607d8b',
};

const getModifiedStat = (baseStat, stages) => {
    if (stages > 0) return Math.floor(baseStat * (1 + stages * COMBAT_STAGE_POSITIVE_MULTIPLIER));
    if (stages < 0) return Math.ceil(baseStat * (1 - Math.abs(stages) * COMBAT_STAGE_NEGATIVE_MULTIPLIER));
    return baseStat;
};

const CombatStagesPanel = ({ selectedPokemon, combatStages, getStatsWithMega, updateCombatStage, resetCombatStages, onHelp, statusConditions }) => {
    const [show, setShow] = useState(false);
    const [showEva, setShowEva] = useState(false);

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
                            <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {nonZero.map(s => {
                                    const val = combatStages[s.key];
                                    const hex = STAT_HEX[s.key];
                                    return (
                                        <span key={s.key} style={{
                                            fontSize: '11px',
                                            background: `${hex}22`,
                                            color: s.color,
                                            border: `1px solid ${hex}66`,
                                            padding: '1px 6px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {s.label} {val > 0 ? '+' : ''}{val}
                                        </span>
                                    );
                                })}
                            </span>
                        ) : (
                            <span className="text-muted" style={{ fontSize: '12px' }}>Buffs &amp; debuffs from moves</span>
                        );
                    })()}
                    {show && <span className="text-muted" style={{ fontSize: '12px', marginLeft: '2px' }}>Buffs &amp; debuffs from moves</span>}
                </div>
                <span aria-hidden="true" style={{ color: 'var(--text-secondary)', fontSize: '12px', flexShrink: 0 }}>{show ? '▲' : '▼'}</span>
            </div>
            {show && (
                <div className="combat-stages-content" style={{ padding: '10px', borderRadius: '6px' }}>
                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>
                        +1 stage = +25% stat | −1 stage = −10% stat | At ±6: 250% / 40% | Range: −6 to +6
                    </div>
                    <div className="combat-stages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
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
                                        {isModOnly ? '±' : baseStat} → <strong style={{ color: stages !== 0 ? (stages > 0 ? 'var(--color-success-text, #4caf50)' : 'var(--color-danger-text, #f44336)') : 'var(--text-primary)' }}>
                                            {isModOnly ? (stages >= 0 ? '+' : '') + stages : modifiedStat}
                                        </strong>
                                    </div>
                                    {(burnOverlay || poisonOverlay) && (
                                        <div
                                            title={burnOverlay
                                                ? 'Burn: DEF treated as −2 combat stages for damage calculations (PH2 p.403). This is a separate damage penalty — do NOT adjust the stage counter.'
                                                : 'Poison: SDEF treated as −2 combat stages for damage calculations (PH2 p.403). This is a separate damage penalty — do NOT adjust the stage counter.'}
                                            style={{ fontSize: '10px', color: burnOverlay ? 'var(--stat-atk, #f44336)' : 'var(--stat-satk, #9c27b0)', fontWeight: 'bold', marginTop: '2px', cursor: 'help' }}
                                        >
                                            {burnOverlay ? '🔥' : '☠️'} −2 eff.
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, -1)}
                                            disabled={stages <= -6}
                                            className="combat-stage-btn combat-stage-btn-minus"
                                            title={stages <= -6 ? 'Minimum stage reached (−6)' : undefined}
                                            style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', fontSize: '14px', opacity: stages <= -6 ? 0.5 : 1, cursor: stages <= -6 ? 'not-allowed' : 'pointer' }}
                                            aria-label={`Decrease ${stat.label} stage`}
                                        >−</button>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: stages > 0 ? 'var(--color-success-text, #4caf50)' : stages < 0 ? 'var(--color-danger-text, #f44336)' : 'var(--text-muted)', minWidth: '20px' }}>
                                            {stages > 0 ? '+' : ''}{stages}
                                        </span>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, 1)}
                                            disabled={stages >= 6}
                                            className="combat-stage-btn combat-stage-btn-plus"
                                            title={stages >= 6 ? 'Maximum stage reached (+6)' : undefined}
                                            style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', fontSize: '14px', opacity: stages >= 6 ? 0.5 : 1, cursor: stages >= 6 ? 'not-allowed' : 'pointer' }}
                                            aria-label={`Increase ${stat.label} stage`}
                                        >+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={resetCombatStages}
                        style={{ marginTop: '8px', width: '100%', padding: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Reset All Stages
                    </button>

                    {/* Base Evasion — collapsible, derived from stats, before EVA stage modifier (PH2 p.255) */}
                    <div style={{ marginTop: '10px', borderRadius: '5px', background: 'var(--surface-bg)', border: '1px solid var(--border-light)' }}>
                        <div
                            onClick={() => setShowEva(v => !v)}
                            title="Base evasion values derived from stats (PH2 p.255). Add the EVA combat stage modifier above for total evasion used in accuracy checks."
                            style={{ padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}
                        >
                            <span>Base Evasion (from stats)</span>
                            <span>{showEva ? '▲' : '▼'}</span>
                        </div>
                        {showEva && (
                            <div style={{ padding: '0 10px 8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                                    <div title="Physical Evasion = DEF stat ÷ 5, max 6 (PH2 p.255)">
                                        <div style={{ fontSize: '10px', color: 'var(--stat-def, #2196f3)' }}>Phys Eva</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--stat-def, #2196f3)' }}>
                                            +{Math.min(6, Math.floor((actualStats.def || 0) / 5))}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DEF÷5</div>
                                    </div>
                                    <div title="Special Evasion = SDEF stat ÷ 5, max 6 (PH2 p.255)">
                                        <div style={{ fontSize: '10px', color: 'var(--stat-sdef, #ff9800)' }}>Spec Eva</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--stat-sdef, #ff9800)' }}>
                                            +{Math.min(6, Math.floor((actualStats.sdef || 0) / 5))}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SDEF÷5</div>
                                    </div>
                                    <div title="Speed Evasion = SPD stat ÷ 10, max 6 (PH2 p.255)">
                                        <div style={{ fontSize: '10px', color: 'var(--stat-spd, #00bcd4)' }}>Spd Eva</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--stat-spd, #00bcd4)' }}>
                                            +{Math.min(6, Math.floor((actualStats.spd || 0) / 10))}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SPD÷10</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                                    Total EVA = base + EVA stage modifier above
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatStagesPanel;
