// ============================================================
// Detail Modal Component
// ============================================================
// Shows full info for moves, features, abilities, skills, items

import React, { useState } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal } from '../../contexts/index.js';
import { parseDice } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';

const DetailModal = () => {
    // Get state from context
    const { detailModal, setDetailModal } = useModal();
    const closeModal = () => setDetailModal({ show: false, type: '', name: '', data: null });

    const { modalRef } = useModalKeyboard(detailModal.show, closeModal);

    if (!detailModal.show) return null;

    const getHeaderBackground = () => {
        switch (detailModal.type) {
            case 'move':
                return `linear-gradient(135deg, ${getTypeColor(detailModal.data?.type)}, ${getTypeColor(detailModal.data?.type)}dd)`;
            case 'feature':
                return 'var(--gradient-purple)';
            case 'ability':
                return 'linear-gradient(135deg, #f093fb, #f5576c)';
            case 'skill':
                return 'linear-gradient(135deg, #4facfe, #00f2fe)';
            case 'pokemonSkill':
                return 'linear-gradient(135deg, #9c27b0, #4caf50)';
            case 'item':
                return 'linear-gradient(135deg, #fa709a, #fee140)';
            default:
                return 'var(--gradient-purple)';
        }
    };

    const getIcon = () => {
        switch (detailModal.type) {
            case 'move': return '⚔️';
            case 'feature': return '⚡';
            case 'ability': return '✨';
            case 'skill': return '🎯';
            case 'pokemonSkill': return '🐾';
            case 'item': return '🎒';
            default: return '📋';
        }
    };

    const getContestTypeColor = (contestType) => {
        switch (contestType) {
            case 'Beauty': return '#e91e63';
            case 'Cool': return '#2196f3';
            case 'Cute': return '#ff9800';
            case 'Smart': return '#4caf50';
            case 'Tough': return '#795548';
            default: return '#9c27b0';
        }
    };

    // Hex values mirror --stat-* CSS vars (kept as hex for use in gradient template literals)
    const getStatColor = (stat) => {
        const colors = {
            HP:   '#4caf50', // --stat-hp
            ATK:  '#f44336', // --stat-atk
            DEF:  '#2196f3', // --stat-def
            SATK: '#9c27b0', // --stat-satk
            SDEF: '#ff9800', // --stat-sdef
            SPD:  '#00bcd4', // --stat-spd
        };
        return colors[stat] || '#667eea'; // --color-purple
    };

    return (
        <div className="modal-overlay" onClick={closeModal} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detail-modal-title"
                style={{ maxWidth: 'min(95vw, 550px)', width: '100%', maxHeight: 'min(90vh, 700px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                <div
                    className="modal-header"
                    style={{
                        background: getHeaderBackground(),
                        color: 'white',
                        margin: '-25px -25px 0 -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <h3
                        id="detail-modal-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '800',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>{getIcon()}</span>
                        {detailModal.name}
                    </h3>
                    <button
                        onClick={closeModal}
                        aria-label="Close modal"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.35)';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>

                <div className="p-20" style={{ overflowY: 'auto', flex: 1, padding: '20px 25px' }}>
                    {/* Move Details */}
                    {detailModal.type === 'move' && detailModal.data && (
                        <MoveDetails data={detailModal.data} moveName={detailModal.name} getContestTypeColor={getContestTypeColor} />
                    )}

                    {/* Feature Details */}
                    {detailModal.type === 'feature' && (
                        <FeatureDetails data={detailModal.data} name={detailModal.name} />
                    )}

                    {/* Ability Details */}
                    {detailModal.type === 'ability' && (
                        <AbilityDetails data={detailModal.data} />
                    )}

                    {/* Skill Details */}
                    {detailModal.type === 'skill' && detailModal.data && (
                        <SkillDetails data={detailModal.data} getStatColor={getStatColor} />
                    )}

                    {/* Pokemon Skill Details */}
                    {detailModal.type === 'pokemonSkill' && (
                        <PokemonSkillDetails data={detailModal.data} name={detailModal.name} />
                    )}

                    {/* Item Details */}
                    {detailModal.type === 'item' && detailModal.data && (
                        <ItemDetails data={detailModal.data} />
                    )}
                </div>
            </div>
        </div>
    );
};

// Shared styles for info boxes
const InfoBox = ({ label, icon, children, variant = 'default' }) => {
    const variants = {
        default: { bg: 'var(--bg-section)',      border: 'var(--border-light)',        labelColor: 'var(--text-muted)',         textColor: 'var(--text-primary)' },
        orange:  { bg: 'var(--tint-orange-bg)',  border: 'var(--tint-orange-border)',  labelColor: 'var(--poke-orange-dark)',   textColor: '#bf360c' },
        purple:  { bg: 'var(--tint-purple-bg)',  border: 'var(--tint-purple-border)',  labelColor: 'var(--color-purple-dark)', textColor: '#4a148c' },
        blue:    { bg: 'var(--tint-blue-bg)',    border: 'var(--tint-blue-border)',    labelColor: 'var(--info-text)',          textColor: '#0d47a1' },
        green:   { bg: 'var(--tint-success-bg)', border: 'var(--success-border)',     labelColor: 'var(--success-text)',       textColor: '#1b5e20' },
        red:     { bg: 'var(--tint-fail-bg)',    border: 'var(--tint-fail-border)',    labelColor: '#c62828',                  textColor: '#b71c1c' },
        pink:    { bg: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)', border: '#f8bbd9', labelColor: '#ad1457', textColor: '#880e4f' },
    };
    const v = variants[variant] || variants.default;
    return (
        <div style={{
            background: v.bg,
            padding: '14px 16px',
            borderRadius: '12px',
            marginBottom: '12px',
            border: `2px solid ${v.border}`,
            position: 'relative'
        }}>
            <div style={{
                fontSize: '11px',
                color: v.labelColor,
                fontWeight: '700',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {icon && <span>{icon}</span>}
                {label}
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: v.textColor }}>
                {children}
            </div>
        </div>
    );
};

// Stat box for move stats
const StatBox = ({ label, value, color }) => (
    <div style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        padding: '12px',
        borderRadius: '10px',
        textAlign: 'center',
        border: `2px solid ${color}30`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
        <div style={{ fontSize: '10px', color: color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '800', color: color, marginTop: '4px' }}>{value}</div>
    </div>
);

// Badge component for tags
const DetailBadge = ({ children, color, textColor = 'white' }) => (
    <span style={{
        padding: '5px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: textColor,
        boxShadow: `0 2px 4px ${color}40`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
    }}>
        {children}
    </span>
);

// Move Details Sub-component
const MoveDetails = ({ data, moveName, getContestTypeColor }) => {
    const [contestRoll, setContestRoll] = useState(null);

    const rollAppeal = () => {
        if (!data.contestDice) return;
        const { count, sides, bonus } = parseDice(data.contestDice);
        if (!count || !sides) { toast.warning('Could not parse contest dice.'); return; }
        const rolls = [];
        for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
        const total = rolls.reduce((a, b) => a + b, 0) + bonus;
        setContestRoll({ rolls, bonus, total });
    };

    const copyResult = () => {
        if (!contestRoll) return;
        const text = `${moveName} (${data.contestType}) ${data.contestDice}: [${contestRoll.rolls.join(', ')}] = ${contestRoll.total}`;
        navigator.clipboard.writeText(text).then(() => toast.success('Result copied!'));
    };

    const copyDiscord = () => {
        if (!contestRoll) return;
        const lines = [
            `🎭 **Contest Appeal — ${data.contestType}**`,
            `**${moveName}** · ${data.contestDice}`,
            `🎲 [${contestRoll.rolls.join(', ')}] = **${contestRoll.total}**`,
        ];
        if (data.contestEffect) lines.push(`*${data.contestEffect}*`);
        navigator.clipboard.writeText(lines.join('\n')).then(() => toast.success('Discord message copied!'));
    };

    return (
    <div>
        {/* Type/Category badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <DetailBadge color={getTypeColor(data.type)}>
                {data.type}
            </DetailBadge>
            <DetailBadge color={data.category === 'Physical' ? '#f44336' : data.category === 'Special' ? '#2196f3' : '#9e9e9e'}>
                {data.category === 'Physical' ? '💪' : data.category === 'Special' ? '✨' : '🔄'} {data.category}
            </DetailBadge>
            {data.frequency && (
                <DetailBadge color="#ff9800">
                    ⏱️ {data.frequency}
                </DetailBadge>
            )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {data.damage && (
                <StatBox label="Damage" value={data.damage} color="#f44336" />
            )}
            {data.ac && (
                <StatBox label="Accuracy" value={data.ac} color="#2196f3" />
            )}
            {data.range && (
                <StatBox label="Range" value={data.range} color="#9c27b0" />
            )}
        </div>

        {data.effect && (
            <InfoBox label="Target / Effect" icon="🎯" variant="green">
                {data.effect}
            </InfoBox>
        )}

        {data.description && (
            <InfoBox label="Description" icon="📖" variant="default">
                {data.description}
            </InfoBox>
        )}

        {(data.contestType || data.contestEffect || data.contest) && (
            <InfoBox label="Contest" icon="🎭" variant="pink">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    {data.contestType && (
                        <DetailBadge color={getContestTypeColor(data.contestType)}>
                            {data.contestType}
                        </DetailBadge>
                    )}
                    {data.contestDice && (
                        <>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7b1fa2' }}>
                                🎲 {data.contestDice}
                            </span>
                            <button
                                onClick={rollAppeal}
                                style={{
                                    padding: '4px 12px', borderRadius: '8px', border: 'none',
                                    background: 'linear-gradient(135deg, #ad1457, #880e4f)',
                                    color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                Roll Appeal
                            </button>
                        </>
                    )}
                </div>
                {contestRoll && (
                    <div style={{
                        padding: '8px 12px', borderRadius: '8px', marginBottom: '8px',
                        background: 'rgba(173,20,87,0.1)', border: '1px solid rgba(173,20,87,0.3)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '22px', fontWeight: '800', color: '#ad1457' }}>{contestRoll.total}</span>
                            <span style={{ fontSize: '12px', color: '#7b1fa2' }}>
                                [{contestRoll.rolls.join(', ')}]{contestRoll.bonus !== 0 ? ` ${contestRoll.bonus > 0 ? '+' : ''}${contestRoll.bonus}` : ''}
                            </span>
                            <button onClick={rollAppeal} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ad1457', borderRadius: '6px', padding: '2px 8px', color: '#ad1457', fontSize: '11px', cursor: 'pointer' }}>Reroll</button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                onClick={copyResult}
                                title="Copy as plain text for the GM"
                                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #ad145766', background: 'rgba(173,20,87,0.08)', color: '#ad1457', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                📋 Copy Result
                            </button>
                            <button
                                onClick={copyDiscord}
                                title="Copy as a Discord-formatted message"
                                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #5865f266', background: 'rgba(88,101,242,0.08)', color: '#5865f2', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                💬 Discord
                            </button>
                        </div>
                    </div>
                )}
                {data.contestEffect && <div>{data.contestEffect}</div>}
                {data.contest && !data.contestType && <div>{data.contest}</div>}
            </InfoBox>
        )}

        {data.notes && (
            <InfoBox label="Notes" icon="📝" variant="orange">
                {data.notes}
            </InfoBox>
        )}
    </div>
    );
};

// Feature Details Sub-component
const FeatureDetails = ({ data, name }) => {
    // Handle missing data gracefully
    if (!data) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                padding: '24px',
                borderRadius: '12px',
                border: '2px dashed #e0e0e0',
                textAlign: 'center'
            }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📋</span>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
                    Feature data not found in database.<br />
                    <span style={{ fontSize: '12px', color: '#999' }}>This feature may be custom or from an external source.</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {data.category && (
                    <DetailBadge color="#667eea">
                        📁 {data.category}
                    </DetailBadge>
                )}
                {data.isBase && (
                    <DetailBadge color="#ff9800">
                        ⭐ Base Feature
                    </DetailBadge>
                )}
                {data.frequency && (
                    <DetailBadge color="#4caf50">
                        ⏱️ {data.frequency}
                    </DetailBadge>
                )}
            </div>

            {data.prerequisites && (
                <InfoBox label="Prerequisites" icon="🔒" variant="orange">
                    {data.prerequisites}
                </InfoBox>
            )}

            {data.trigger && (
                <InfoBox label="Trigger" icon="⚡" variant="pink">
                    {data.trigger}
                </InfoBox>
            )}

            {data.target && (
                <InfoBox label="Target" icon="🎯" variant="blue">
                    {data.target}
                </InfoBox>
            )}

            {data.effect && (
                <InfoBox label="Effect" icon="✨" variant="purple">
                    {data.effect}
                </InfoBox>
            )}

            {data.description && !data.effect && (
                <InfoBox label="Description" icon="📖" variant="default">
                    {data.description}
                </InfoBox>
            )}
        </div>
    );
};

// Ability Details Sub-component
const AbilityDetails = ({ data }) => {
    const description = typeof data === 'string' ? data : data?.effect || data?.description || null;
    const frequency = data?.frequency;
    const trigger = data?.trigger;

    return (
        <div>
            {/* Frequency/Trigger badges if available */}
            {(frequency || trigger) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {frequency && (
                        <DetailBadge color="#9c27b0">
                            ⏱️ {frequency}
                        </DetailBadge>
                    )}
                    {trigger && (
                        <DetailBadge color="#e91e63">
                            ⚡ Trigger
                        </DetailBadge>
                    )}
                </div>
            )}

            {trigger && (
                <InfoBox label="Trigger" icon="⚡" variant="pink">
                    {trigger}
                </InfoBox>
            )}

            {description ? (
                <InfoBox label="Effect" icon="✨" variant="purple">
                    {description}
                </InfoBox>
            ) : (
                <div style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px dashed #e0e0e0',
                    textAlign: 'center',
                    color: '#999'
                }}>
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📋</span>
                    No description available for this ability.
                </div>
            )}

            {data?.notes && (
                <InfoBox label="Notes" icon="📝" variant="orange">
                    {data.notes}
                </InfoBox>
            )}
        </div>
    );
};

// Skill Details Sub-component
const SkillDetails = ({ data, getStatColor }) => (
    <div>
        {/* Stat badge with enhanced styling */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            {data.stat && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${getStatColor(data.stat)} 0%, ${getStatColor(data.stat)}dd 100%)`,
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: `0 3px 8px ${getStatColor(data.stat)}40`
                }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    Uses {data.stat}
                </div>
            )}
            {data.type && (
                <DetailBadge color="#667eea">
                    {data.type}
                </DetailBadge>
            )}
        </div>

        {/* Roll info */}
        {data.type === 'passive' ? (
            <div style={{
                background: 'var(--tint-purple-bg)',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '2px solid var(--tint-purple-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-purple-dark)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passive</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-purple-dark)' }}>No roll — automatic benefit</div>
                </div>
            </div>
        ) : (
            <div style={{
                background: 'var(--tint-blue-bg)',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '2px solid var(--tint-blue-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '24px' }}>🎲</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--info-text)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roll (1d20)</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--info-text)' }}>No rank: 1d20 (no modifier)</div>
                    <div style={{ fontSize: '13px', color: 'var(--info-text)' }}>Rank 1: 1d20 + 2 + {data.stat} modifier</div>
                    <div style={{ fontSize: '13px', color: 'var(--info-text)' }}>Rank 2: 1d20 + 4 + 2× {data.stat} modifier</div>
                </div>
            </div>
        )}

        <InfoBox label="Description" icon="📖" variant="default">
            {data.description || 'No description available.'}
        </InfoBox>
    </div>
);

// Pokemon Skill Details Sub-component (species capabilities like Overland, Zapper, etc.)
const PokemonSkillDetails = ({ data, name }) => {
    const getTypeColor = (type) => {
        switch (type) {
            case 'speed': return '#2196f3';
            case 'basic': return '#9c27b0';
            case 'legendary': return '#ff9800';
            default: return '#4caf50';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'speed': return '🏃 Speed Skill';
            case 'basic': return '📊 Basic Skill';
            case 'legendary': return '⭐ Legendary Skill';
            default: return '✨ Capability';
        }
    };

    const getTagColor = (tag) => {
        switch (tag) {
            case 'Fire': return '#f44336';
            case 'Water': return '#2196f3';
            case 'Electric': return '#ffc107';
            case 'Ice': return '#00bcd4';
            case 'Plant': return '#4caf50';
            case 'Earth': return '#795548';
            case 'Wind': return '#90caf9';
            case 'Psionic': return '#9c27b0';
            default: return '#667eea';
        }
    };

    // Get the effect description based on skill name and value
    const getSkillEffect = (skillName, value) => {
        if (value === undefined || value === null) return null;

        const normalizedName = skillName?.toLowerCase();

        // Speed skills - value = spaces/meters per round
        if (['overland', 'surface', 'sky', 'burrow', 'underwater'].includes(normalizedName)) {
            return `${value} spaces/meters per round`;
        }

        // Jump - value corresponds to height
        if (normalizedName === 'jump') {
            const jumpHeights = {
                1: '3 ft / 1 m',
                2: '6 ft / 1.8 m',
                3: '10 ft / 3 m',
                4: '15 ft / 4.5 m',
                5: '20 ft / 6 m',
                6: '25 ft / 7.6 m',
                7: '35 ft / 10.6 m',
                8: '50 ft / 15.2 m',
                9: '70 ft / 21 m',
                10: '100 ft / 30.5 m'
            };
            return jumpHeights[value] || `${value} (unknown height)`;
        }

        // Power - value corresponds to lifting capacity
        if (normalizedName === 'power') {
            const powerWeights = {
                1: '10 lbs / 5 kg',
                2: '50 lbs / 23 kg',
                3: '100 lbs / 45 kg',
                4: '200 lbs / 90 kg',
                5: '350 lbs / 158 kg',
                6: '500 lbs / 227 kg',
                7: '750 lbs / 340 kg',
                8: '1000 lbs / 455 kg',
                9: '2500 lbs / 1135 kg',
                10: '4000 lbs / 1815 kg'
            };
            return powerWeights[value] || `${value} (unknown weight)`;
        }

        // Intelligence - value corresponds to mental capability
        if (normalizedName === 'intelligence') {
            const intelligenceLevels = {
                1: 'Feeble-minded — Slow reaction time, unable to do simple tasks',
                2: 'Deficiency — Self-aware',
                3: 'Dullness — Can follow others\' lead but can\'t figure out tasks alone',
                4: 'Normal — Can build and use tools',
                5: 'Superior — Average human intellect',
                6: 'Vastly Superior — Able to function as a leader and act independently',
                7: 'Genius — Super computer thought, speaks human languages'
            };
            return intelligenceLevels[value] || `${value} (unknown level)`;
        }

        return null;
    };

    const skillEffect = getSkillEffect(name, data?.value);

    return (
        <div>
            {/* Type and tag badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {data?.type && (
                    <DetailBadge color={getTypeColor(data.type)}>
                        {getTypeLabel(data.type)}
                    </DetailBadge>
                )}
                {data?.tag && (
                    <DetailBadge color={getTagColor(data.tag)}>
                        {data.tag}
                    </DetailBadge>
                )}
            </div>

            {/* Value display for numeric skills with effect description */}
            {data?.value !== undefined && (
                <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '2px solid #90caf9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '24px' }}>📏</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {name} {data.value}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d47a1' }}>
                            {skillEffect || data.value}
                        </div>
                    </div>
                </div>
            )}

            <InfoBox label="Description" icon="📖" variant="default">
                {data?.description || 'No description available.'}
            </InfoBox>
        </div>
    );
};

// Item Details Sub-component
const ItemDetails = ({ data }) => (
    <div>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            {data.type && (
                <DetailBadge color="#667eea">
                    📦 {data.type}
                </DetailBadge>
            )}
            {data.category && (
                <DetailBadge color="#ff9800">
                    📁 {data.category}
                </DetailBadge>
            )}
        </div>

        {/* Price display */}
        {data.price !== undefined && (
            <div style={{
                background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '2px solid #ffd54f',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '24px' }}>💰</span>
                <div>
                    <div style={{ fontSize: '11px', color: '#f57f17', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#e65100' }}>₽{data.price?.toLocaleString() || 0}</div>
                </div>
            </div>
        )}

        <InfoBox label="Effect" icon="✨" variant="green">
            {data.effect || data.description || 'No description available.'}
        </InfoBox>

        {data.notes && (
            <InfoBox label="Notes" icon="📝" variant="orange">
                {data.notes}
            </InfoBox>
        )}
    </div>
);

export default DetailModal;
