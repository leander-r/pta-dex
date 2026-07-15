// ============================================================
// Trainer Skills Component
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useGameData, useModal, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const SKILL_STATS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];

// Helper to get skill rank from skills object (handles legacy array format)
const getSkillRank = (skills, skillName) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) {
        return skills.includes(skillName) ? 1 : 0;
    }
    return skills[skillName] || 0;
};

// Helper to count trained skills
const countTrainedSkills = (skills) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) return skills.length;
    return Object.values(skills).filter(rank => rank > 0).length;
};

// Helper to get trained skill names with ranks
const getTrainedSkillsList = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
        return skills.map(name => ({ name, rank: 1 }));
    }
    return Object.entries(skills)
        .filter(([_, rank]) => rank > 0)
        .map(([name, rank]) => ({ name, rank }));
};

// Calculate skill bonus based on PTA rules
const calculateSkillBonus = (rank, statValue) => {
    if (rank === 0) return null;

    // PTA stat modifier: above 10 → floor((stat-10)/2); below 10 → -(10-stat) (PH2 p.10)
    let modifier;
    if (statValue === 10) modifier = 0;
    else if (statValue < 10) modifier = -(10 - statValue);
    else modifier = Math.floor((statValue - 10) / 2);

    // Rank 1: +2 + modifier
    // Rank 2: +4 + (2 × modifier)
    const baseBonus = rank * 2;
    const modBonus = rank * modifier;
    return baseBonus + modBonus;
};

/**
 * TrainerSkills - Manage trainer skills
 * Uses contexts for state management
 */
const TrainerSkills = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const { showDetail } = useModal();
    const currentSkills = trainer.skills || {};

    const handleCycleRank = (skillName, isHPSkill) => {
        const currentRank = getSkillRank(currentSkills, skillName);
        let newRank;

        if (isHPSkill) {
            // HP skills cap at rank 1: 0 → 1 → 0
            newRank = currentRank === 0 ? 1 : 0;
        } else {
            // Other skills: 0 → 1 → 2 → 0
            newRank = (currentRank + 1) % 3;
        }

        setTrainer(prev => {
            const prevSkills = prev.skills || {};
            // Handle legacy array format
            const skillsObj = Array.isArray(prevSkills)
                ? prevSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : prevSkills;

            if (newRank === 0) {
                const { [skillName]: removed, ...rest } = skillsObj;
                return { ...prev, skills: rest };
            }
            return {
                ...prev,
                skills: { ...skillsObj, [skillName]: newRank }
            };
        });
    };

    // Group skills by stat
    const skillsByStat = SKILL_STATS.reduce((acc, stat) => {
        acc[stat] = Object.entries(GAME_DATA.skills || {})
            .filter(([_, data]) => data.stat === stat)
            .map(([name, data]) => ({ name, ...data }));
        return acc;
    }, {});

    const trainedCount = countTrainedSkills(currentSkills);
    const trainedList = getTrainedSkillsList(currentSkills);
    const [collapsed, setCollapsed] = useState(true);
    const [skillSearch, setSkillSearch] = useState('');
    const [showTrainedOnly, setShowTrainedOnly] = useState(false);

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🎯</span> Skills
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('trainer-skills'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Skills"
                    title="About trainer skills"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {trainedCount} trained skills
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Skills' : 'Collapse Skills'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
            <p className="section-description">
                Click skills to cycle ranks (0→1→2). HP skills max at rank 1.
                <br />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Rank 1: +2 + Stat Mod | Rank 2: +4 + (2×Stat Mod)
                </span>
            </p>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search skills..."
                    aria-label="Search skills"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    style={{ flex: 1, minWidth: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
                <button
                    onClick={() => setShowTrainedOnly(v => !v)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        background: showTrainedOnly ? 'var(--gradient-purple)' : 'var(--input-bg)',
                        color: showTrainedOnly ? 'white' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background var(--transition-normal), color var(--transition-normal)'
                    }}
                >
                    {showTrainedOnly ? '★ Trained only' : 'All Skills'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {SKILL_STATS.map(stat => {
                    const statKey = stat.toLowerCase();
                    const statValue = trainer.stats[statKey] || 6;
                    const isHPStat = stat === 'HP';

                    const visibleSkills = skillsByStat[stat].filter(skill => {
                        if (showTrainedOnly && getSkillRank(currentSkills, skill.name) === 0) return false;
                        if (skillSearch && !skill.name.toLowerCase().includes(skillSearch.toLowerCase())) return false;
                        return true;
                    });

                    if (visibleSkills.length === 0) return null;

                    return (
                        <div key={stat} className="bg-light" style={{ borderRadius: '8px', padding: '10px' }}>
                            <div style={{
                                fontWeight: 'bold',
                                fontSize: '12px',
                                color: stat === 'HP' ? 'var(--stat-hp)' :
                                       stat === 'ATK' ? 'var(--stat-atk)' :
                                       stat === 'DEF' ? 'var(--stat-def)' :
                                       stat === 'SATK' ? 'var(--stat-satk)' :
                                       stat === 'SDEF' ? 'var(--stat-sdef)' : 'var(--stat-spd)',
                                marginBottom: '8px',
                                borderBottom: '1px solid var(--border-light, #ddd)',
                                paddingBottom: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{stat} Skills</span>
                                {isHPStat && <span style={{ fontSize: '11px', opacity: 0.7 }}>Max Rank 1</span>}
                            </div>

                            {visibleSkills.map(skill => {
                                const rank = getSkillRank(currentSkills, skill.name);
                                const isTrained = rank > 0;
                                const bonus = isHPStat ? null : calculateSkillBonus(rank, statValue);
                                const maxRank = isHPStat ? 1 : 2;

                                return (
                                    <div
                                        key={skill.name}
                                        onClick={() => handleCycleRank(skill.name, isHPStat)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleCycleRank(skill.name, isHPStat);
                                            }
                                        }}
                                        className={!isTrained ? 'skill-list-item' : ''}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 8px',
                                            marginBottom: '4px',
                                            background: isTrained
                                                ? rank === 2
                                                    ? 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))'
                                                    : 'var(--gradient-purple)'
                                                : undefined,
                                            color: isTrained ? 'white' : undefined,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title={`${skill.description}\n\nClick to cycle rank (current: ${rank}/${maxRank})`}
                                        aria-label={`${skill.name}, rank ${rank} of ${maxRank}. Press Enter to cycle rank.`}
                                    >
                                        {/* Rank indicator */}
                                        <span style={{
                                            display: 'flex',
                                            gap: '2px',
                                            minWidth: isHPStat ? '17px' : '30px'
                                        }}>
                                            {[...Array(maxRank)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        width: '13px',
                                                        height: '13px',
                                                        borderRadius: '50%',
                                                        border: isTrained ? 'none' : '2px solid var(--border-medium)',
                                                        background: i < rank
                                                            ? 'rgba(255,255,255,0.9)'
                                                            : isTrained
                                                                ? 'rgba(255,255,255,0.3)'
                                                                : 'transparent'
                                                    }}
                                                />
                                            ))}
                                        </span>

                                        <span style={{ fontWeight: isTrained ? 'bold' : 'normal', flex: 1 }}>
                                            {skill.name}
                                        </span>

                                        {/* Bonus display */}
                                        {isTrained && (
                                            <span style={{
                                                fontSize: '12px',
                                                opacity: 0.9,
                                                background: 'rgba(255,255,255,0.2)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                {isHPStat ? 'Passive' : (bonus >= 0 ? `+${bonus}` : bonus)}
                                            </span>
                                        )}
                                        {!isTrained && !isHPStat && (() => {
                                            const r1 = calculateSkillBonus(1, statValue);
                                            return (
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto', opacity: 0.6 }}>
                                                    {r1 >= 0 ? `+${r1}` : r1}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            </>}
            {collapsed && (
                trainedCount > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {trainedList.map(({ name, rank }) => {
                            const skillData = GAME_DATA.skills?.[name];
                            const statKey = skillData?.stat?.toLowerCase();
                            const statValue = statKey ? (trainer.stats?.[statKey] || 6) : 6;
                            const isHPSkill = skillData?.stat === 'HP';
                            const bonus = isHPSkill ? null : calculateSkillBonus(rank, statValue);
                            return (
                                <span
                                    key={name}
                                    onClick={() => showDetail && showDetail('skill', name, skillData)}
                                    title={`${name} — Rank ${rank}${bonus != null ? `, bonus: ${bonus >= 0 ? '+' : ''}${bonus}` : ' (passive)'}`}
                                    style={{
                                        padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                                        background: rank === 2
                                            ? 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))'
                                            : 'var(--gradient-purple)',
                                        color: 'white', cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: '3px'
                                    }}
                                >
                                    {name}
                                    {isHPSkill
                                        ? <span style={{ opacity: 0.85, fontSize: '11px' }}>◆</span>
                                        : <span style={{ opacity: 0.9, fontSize: '11px' }}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                                    }
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No trained skills yet — add a class in the <strong>Classes</strong> section above to unlock skill training.
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerSkills;
