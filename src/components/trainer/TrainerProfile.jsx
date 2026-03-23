// ============================================================
// Trainer Profile Component
// ============================================================

import React from 'react';
import { useTrainerContext, useModal } from '../../contexts/index.js';
import { CREATION_STAT_POINTS } from '../../data/constants.js';

/**
 * TrainerProfile - Trainer profile management
 * Uses TrainerContext for state management
 */
const TrainerProfile = () => {
    const {
        trainer,
        setTrainer,
        levelUpTrainer,
        levelDownTrainer,
        respecTrainer,
        calculateMaxHP
    } = useTrainerContext();
    const { showConfirm } = useModal();

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 150;
                    let width = img.width, height = img.height;
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    setTrainer(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddBadge = () => {
        showConfirm({
            title: 'Add Badge',
            message: 'Enter badge name:',
            confirmLabel: 'Add',
            inputConfig: { placeholder: 'Badge name...', defaultValue: '' },
            onConfirm: (name) => {
                if (name?.trim()) {
                    setTrainer(prev => ({
                        ...prev,
                        badges: [...(prev.badges || []), {
                            name: name.trim(),
                            id: Date.now(),
                            earnedAt: new Date().toISOString()
                        }]
                    }));
                }
            }
        });
    };

    const handleRemoveBadge = (badgeId, badgeName, index) => {
        showConfirm({
            title: 'Remove Badge',
            message: `Remove "${badgeName}" badge?`,
            danger: true,
            onConfirm: () => {
                setTrainer(prev => ({
                    ...prev,
                    badges: (prev.badges || []).filter((b, i) => {
                        if (typeof b === 'string') return i !== index;
                        return b.id !== badgeId;
                    })
                }));
            }
        });
    };

    const isLevel0 = trainer.level === 0;
    const creationPointsRemaining = trainer.statPoints || 0;
    const hasClass = (trainer.classes || []).length > 0;
    const canLevelUp = !isLevel0 || (creationPointsRemaining === 0 && hasClass);
    const badges = trainer.badges || [];

    return (
        <div className="section-card-purple">

            {/* Header: avatar + name */}
            <h3 className="section-title-purple">
                <div
                    style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => document.getElementById('trainerAvatarInput').click()}
                    title="Click to change avatar"
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: trainer.avatar ? 'transparent' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid rgba(102,126,234,0.35)'
                    }}>
                        {trainer.avatar
                            ? <img src={trainer.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '20px' }}>👤</span>
                        }
                    </div>
                    <span style={{
                        position: 'absolute', bottom: '-2px', right: '-4px',
                        fontSize: '13px', lineHeight: 1,
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '50%',
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        border: '1px solid var(--border-light)'
                    }}>📷</span>
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="trainerAvatarInput"
                        onChange={handleAvatarChange}
                    />
                </div>
                <input
                    type="text"
                    value={trainer.name}
                    onChange={(e) => setTrainer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Trainer Name..."
                    aria-label="Trainer name"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid rgba(102,126,234,0.35)',
                        outline: 'none',
                        fontSize: '16px',
                        fontWeight: '800',
                        color: 'var(--color-purple)',
                        padding: '2px 0',
                        fontFamily: 'inherit'
                    }}
                />
            </h3>

            {/* Gender + Age */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[['male', '♂', 'M', '#1976d2'], ['female', '♀', 'F', '#c2185b']].map(([val, sym, abbr, col]) => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '14px', color: col }}>
                            <input
                                type="radio"
                                name="trainerGender"
                                checked={trainer.gender === val}
                                onChange={() => setTrainer(prev => ({ ...prev, gender: val }))}
                                style={{ accentColor: col }}
                            />
                            <span title={val.charAt(0).toUpperCase() + val.slice(1)}>{sym} <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{abbr}</span></span>
                        </label>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Age</span>
                    <input
                        type="number"
                        value={trainer.age || ''}
                        onChange={(e) => setTrainer(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="—"
                        min="1"
                        max="999"
                        aria-label="Trainer age"
                        className="trainer-age-input"
                        style={{
                            width: '46px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textAlign: 'center',
                            border: '1px solid var(--border-medium, #ddd)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Class pills — display only; click scrolls to Classes section */}
            {(trainer.classes || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {(trainer.classes || []).map((cls, i) => (
                        <span
                            key={i}
                            onClick={() => document.getElementById('trainer-classes-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                            title="Manage classes in the Classes section below"
                            style={{
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {cls}
                        </span>
                    ))}
                </div>
            )}

            {/* Character Creation checklist (merged) — shown only at level 0 */}
            {isLevel0 && (
                <div style={{
                    padding: '10px 12px',
                    background: 'var(--warning-bg, #fff3cd)',
                    borderRadius: '8px',
                    border: '1px solid var(--warning-border, #ffc107)',
                    fontSize: '12px',
                    marginBottom: '12px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--warning-text, #856404)' }}>
                        Character Creation — allocate stats, pick a class, then level up!
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: creationPointsRemaining === 0 ? 'var(--color-success-text, #2e7d32)' : 'var(--color-danger-text, #c62828)' }}>
                        <span>{creationPointsRemaining === 0 ? '✓' : '○'}</span>
                        <span>Spend all {CREATION_STAT_POINTS} Creation points ({CREATION_STAT_POINTS - creationPointsRemaining}/{CREATION_STAT_POINTS})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasClass ? 'var(--color-success-text, #2e7d32)' : 'var(--color-danger-text, #c62828)' }}>
                        <span>{hasClass ? '✓' : '○'}</span>
                        <span>Pick your first class</span>
                    </div>
                </div>
            )}

            {/* Level Controls */}
            {isLevel0 && !canLevelUp && (
                <div style={{ fontSize: '12px', color: 'var(--warning-text, #856404)', textAlign: 'center', marginBottom: '6px', fontStyle: 'italic' }}>
                    Complete the steps above to level up
                </div>
            )}
            <div className="level-controls">
                <button
                    className="level-btn"
                    onClick={levelDownTrainer}
                    disabled={trainer.level <= 1}
                    aria-label="Decrease level"
                >−</button>
                <div className="level-display">
                    <div className="level-label">LEVEL</div>
                    <div className="level-value">{trainer.level}</div>
                </div>
                <button
                    className="level-btn"
                    onClick={levelUpTrainer}
                    disabled={!canLevelUp}
                    title={!canLevelUp ? 'Complete character creation first' : 'Level up trainer'}
                    aria-label="Increase level"
                >+</button>
            </div>

            {/* Quick Stats — 3 boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: 'linear-gradient(180deg, rgba(76,175,80,0.15) 0%, transparent 70%)', borderRadius: '8px', border: '1px solid rgba(76,175,80,0.33)', borderTop: '3px solid var(--stat-hp, #4caf50)' }}
                    title="Max HP = (HP stat × 4) + (Level × 4)"
                >
                    <div style={{ fontSize: '12px', color: 'var(--stat-hp, #4caf50)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max HP</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--stat-hp, #4caf50)', lineHeight: 1.2 }}>{calculateMaxHP()}</div>
                </div>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: 'linear-gradient(180deg, rgba(245,166,35,0.15) 0%, transparent 70%)', borderRadius: '8px', border: '1px solid rgba(245,166,35,0.33)', borderTop: '3px solid var(--poke-orange, #f5a623)' }}
                    title="Feat points are used to buy features. Gain points from leveling up."
                >
                    <div style={{ fontSize: '12px', color: 'var(--poke-orange-dark, #e8941c)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feat Pts</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: (trainer.featPoints || 0) > 0 ? 'var(--poke-orange, #f5a623)' : 'var(--text-muted, #999)', lineHeight: 1.2 }}>{trainer.featPoints || 0}</div>
                </div>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: 'linear-gradient(180deg, #667eea25 0%, transparent 70%)', borderRadius: '8px', border: '1px solid #667eea55', borderTop: '3px solid #667eea', cursor: 'pointer' }}
                    title="Gym Badges earned — click to jump to list"
                    onClick={() => document.getElementById('trainer-badges-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                >
                    <div style={{ fontSize: '12px', color: '#667eea', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏅 Badges</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea', lineHeight: 1.2 }}>{badges.length}</div>
                </div>
            </div>

            {/* Money */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                borderRadius: '8px',
                marginTop: '12px'
            }}>
                <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '14px' }}>💰</span>
                <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '16px' }}>₽</span>
                <input
                    type="number"
                    value={trainer.money || 0}
                    onChange={(e) => setTrainer(prev => ({ ...prev, money: Math.max(0, parseInt(e.target.value) || 0) }))}
                    min="0"
                    aria-label="Money (₽)"
                    style={{
                        flex: 1,
                        padding: '3px 6px',
                        border: '2px solid #c9a800',
                        borderRadius: '5px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        background: 'rgba(255,255,255,0.88)',
                        minWidth: 0
                    }}
                />
            </div>
            {/* Respec — de-emphasised, separated from money */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                    onClick={respecTrainer}
                    className="trainer-respec-btn"
                    title="Reset trainer to Level 0 for character recreation (keeps Pokémon)"
                >
                    🔄 Respec
                </button>
            </div>

            {/* Badges */}
            <div id="trainer-badges-section" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-purple, #667eea)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🏅 Badges ({badges.length})
                    </span>
                    <button
                        onClick={handleAddBadge}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add
                    </button>
                </div>

                {badges.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {badges.map((badge, index) => {
                            const badgeName = typeof badge === 'string' ? badge : badge.name;
                            const badgeId = typeof badge === 'string' ? index : badge.id;
                            return (
                                <div
                                    key={badgeId}
                                    className="trainer-badge-chip"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <span>🏅</span>
                                    <span>{badgeName}</span>
                                    <button
                                        onClick={() => handleRemoveBadge(badgeId, badgeName, index)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '11px', color: '#8d6e00', opacity: 0.7 }}
                                        title="Remove badge"
                                    >✕</button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        color: 'var(--text-muted, #999)',
                        fontSize: '12px',
                        background: 'var(--bg-light, #f5f5f5)',
                        borderRadius: '6px'
                    }}>
                        <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>No badges earned yet</div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>Press <strong>+ Add</strong> above to record your first badge</div>
                    </div>
                )}
            </div>

            {/* Trainer Ribbons */}
            {(() => {
                const RIBBON_TYPES = [
                    { key: 'cool',   icon: '😎', label: 'Cool'   },
                    { key: 'beauty', icon: '💎', label: 'Beauty' },
                    { key: 'cute',   icon: '🌸', label: 'Cute'   },
                    { key: 'smart',  icon: '🔮', label: 'Smart'  },
                    { key: 'tough',  icon: '💪', label: 'Tough'  },
                ];
                const ribbons = trainer.ribbons || {};
                const totalRibbons = RIBBON_TYPES.reduce((s, r) => s + (ribbons[r.key] || 0), 0);

                const updateRibbon = (key, delta) => {
                    setTrainer(prev => ({
                        ...prev,
                        ribbons: {
                            ...(prev.ribbons || {}),
                            [key]: Math.max(0, (prev.ribbons?.[key] || 0) + delta)
                        }
                    }));
                };

                return (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-purple, #667eea)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🏆 Contest Ribbons {totalRibbons > 0 && `(${totalRibbons})`}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '6px' }}>
                            {RIBBON_TYPES.map(({ key, icon, label }) => {
                                const count = ribbons[key] || 0;
                                return (
                                    <div key={key} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                            {icon} {label}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <button
                                                onClick={() => updateRibbon(key, -1)}
                                                disabled={count === 0}
                                                style={{ flex: 1, padding: '4px 2px', background: 'var(--bg-light, #e0e0e0)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.4 : 1, fontSize: '12px' }}
                                            >−</button>
                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                                                {count > 0 ? count : '—'}
                                            </span>
                                            <button
                                                onClick={() => updateRibbon(key, 1)}
                                                style={{ flex: 1, padding: '4px 2px', background: 'var(--bg-light, #e0e0e0)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default TrainerProfile;
