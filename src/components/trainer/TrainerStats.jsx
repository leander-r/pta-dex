// ============================================================
// Trainer Stats Component
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const STAT_CONFIG = [
    { key: 'hp', label: 'HP', color: '#e53935' },
    { key: 'atk', label: 'ATK', color: '#ff5722' },
    { key: 'def', label: 'DEF', color: '#2196f3' },
    { key: 'satk', label: 'SATK', color: '#9c27b0' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800' },
    { key: 'spd', label: 'SPD', color: '#00bcd4' }
];

/**
 * TrainerStats - Trainer stats management
 * Uses TrainerContext for state management
 */
const TrainerStats = () => {
    const { trainer, updateTrainerStat, calculateModifier, undoStatAllocation, canUndoStat } = useTrainerContext();
    const { showHelp } = useUI();
    const [collapsed, setCollapsed] = useState(true);
    const [draftStats, setDraftStats] = useState({});
    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>📊</span> Stats
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('stat-allocation'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Stats"
                    title="About stat allocation"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }} title="Creation points: 30 total, max 14 per stat during character creation. Level points: earned each level-up, no per-stat cap.">
                        Creation: {trainer.statPoints} | Level: {trainer.levelStatPoints || 0}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Stats' : 'Collapse Stats'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
            <div className="trainer-stats-compact">
                {STAT_CONFIG.map(stat => {
                    const mod = calculateModifier(stat.key);
                    return (
                        <div
                            key={stat.key}
                            style={{
                                borderRadius: '7px',
                                padding: '8px',
                                textAlign: 'center',
                                border: `1px solid ${stat.color}55`,
                                borderTop: `3px solid ${stat.color}`,
                                background: `linear-gradient(180deg, ${stat.color}33 0%, transparent 70%)`
                            }}
                        >
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {stat.label}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <button
                                    onClick={() => updateTrainerStat(stat.key, trainer.stats[stat.key] - 1)}
                                    aria-label={`Decrease ${stat.label}`}
                                    style={{
                                        width: '24px', height: '24px', padding: 0,
                                        fontSize: '16px', lineHeight: 1,
                                        border: `1px solid ${stat.color}66`,
                                        borderRadius: '4px',
                                        background: `${stat.color}22`,
                                        color: stat.color,
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >−</button>
                                <input
                                    type="number"
                                    value={draftStats[stat.key] ?? trainer.stats[stat.key]}
                                    onChange={(e) => setDraftStats(prev => ({ ...prev, [stat.key]: e.target.value }))}
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value);
                                        if (!isNaN(v)) updateTrainerStat(stat.key, v);
                                        setDraftStats(prev => { const n = { ...prev }; delete n[stat.key]; return n; });
                                    }}
                                    min="6"
                                    max="30"
                                    aria-label={`${stat.label} stat value`}
                                    style={{
                                        width: '36px',
                                        textAlign: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        border: `1.5px solid ${stat.color}99`,
                                        borderRadius: '5px',
                                        padding: '3px 2px',
                                        background: 'transparent',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <button
                                    onClick={() => updateTrainerStat(stat.key, trainer.stats[stat.key] + 1)}
                                    aria-label={`Increase ${stat.label}`}
                                    style={{
                                        width: '24px', height: '24px', padding: 0,
                                        fontSize: '16px', lineHeight: 1,
                                        border: `1px solid ${stat.color}66`,
                                        borderRadius: '4px',
                                        background: `${stat.color}22`,
                                        color: stat.color,
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >+</button>
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: mod >= 0 ? '#4caf50' : '#f44336',
                                fontWeight: 'bold',
                                marginTop: '3px'
                            }}>
                                {mod >= 0 ? '+' : ''}{mod}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Evasion Display + Undo */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="evasion-box-spd" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Speed Evasion = SPD modifier (capped 0–6). Per PH2 p.11, this is the only evasion stat defined for Trainers.">
                    <div style={{ fontSize: '12px', color: '#00838f' }}>Speed Evasion</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f' }}>+{Math.min(6, Math.max(0, calculateModifier('spd')))}</div>
                </div>
                <button
                    onClick={undoStatAllocation}
                    disabled={!canUndoStat}
                    title="Undo last stat point change"
                    style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        background: canUndoStat ? '#ff9800' : 'var(--surface-bg)',
                        color: canUndoStat ? 'white' : 'var(--text-muted)',
                        border: canUndoStat ? 'none' : '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        cursor: canUndoStat ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}
                >
                    ↩ Undo
                </button>
            </div>
            </>}
            {collapsed && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {STAT_CONFIG.map(stat => {
                        const mod = calculateModifier(stat.key);
                        return (
                            <span key={stat.key} style={{
                                padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                background: `${stat.color}22`, color: stat.color, border: `1px solid ${stat.color}40`
                            }}>
                                {stat.label} {trainer.stats[stat.key]}
                                <span style={{ opacity: 0.65, marginLeft: '2px' }}>({mod >= 0 ? '+' : ''}{mod})</span>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TrainerStats;
