import React, { useRef } from 'react';
import { useUI } from '../../contexts/index.js';
import toast from '../../utils/toast.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const HPTracker = ({ label, currentHP, maxHP, onDamage, onHeal, onFull, level, isTrainer }) => {
    const inputRef = useRef(null);
    const { showHelp } = useUI();

    const isFainted = currentHP <= 0;
    // Death threshold: HP ≤ −maxHP (GM Guide p.17)
    const isDeathThreshold = maxHP > 0 && currentHP <= -maxHP;
    const isAtFullHP = currentHP >= maxHP;
    const displayHP = Math.max(currentHP, -maxHP); // clamp display at -maxHP
    const hpPercent = maxHP > 0 ? Math.max(0, Math.min(100, (currentHP / maxHP) * 100)) : 0;

    const accentColor = isDeathThreshold ? '#b71c1c' : isFainted ? '#757575' : 'var(--stat-hp)';

    const barColor = isDeathThreshold ? '#b71c1c'
        : isFainted ? '#757575'
        : hpPercent > 50 ? '#4caf50'
        : hpPercent > 25 ? '#ff9800'
        : '#f44336';

    const hpColor = isDeathThreshold ? '#b71c1c'
        : isFainted ? '#757575'
        : hpPercent > 50 ? '#4caf50'
        : hpPercent > 25 ? '#ff9800'
        : '#f44336';

    // Death save threshold and lethality note (GM Guide p.17)
    const deathSaveTarget = isTrainer
        ? Math.min(18, level || 1)
        : Math.min(90, (level || 1) * 2);
    const deathDice = isTrainer ? '1d20' : '1d100';
    // This caps the ATTACKER's level, not this tracker's own — the app doesn't model an
    // external attacker's stats, so it can't auto-enforce this; it's a manual GM reminder.
    const lethalNote = 'Reminder: a Pokémon below level 30 or a Trainer below level 20 dealing this damage cannot deal lethal damage — cap it at -90% Max HP instead if that\'s the case here.';

    const dmgBtnStyle = {
        flex: 1, padding: '8px 4px', background: 'var(--stat-atk, #f44336)', color: 'white',
        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
        fontWeight: 'bold', minHeight: '44px', opacity: isFainted ? 0.5 : 1,
    };
    const healBtnStyle = {
        flex: 1, padding: '8px 4px', background: 'var(--stat-hp, #4caf50)', color: 'white',
        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
        fontWeight: 'bold', minHeight: '44px',
    };
    const groupLabelStyle = {
        fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px',
        textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px',
    };

    const handleCustomDmg = () => {
        const val = parseInt(inputRef.current?.value);
        if (val > 0) { onDamage(val); inputRef.current.value = ''; inputRef.current.focus(); }
        else { toast.warning('Enter a positive number.'); if (inputRef.current) { inputRef.current.value = ''; inputRef.current.focus(); } }
    };

    const handleCustomHeal = () => {
        const val = parseInt(inputRef.current?.value);
        if (val > 0) { onHeal(val); inputRef.current.value = ''; inputRef.current.focus(); }
        else { toast.warning('Enter a positive number.'); if (inputRef.current) { inputRef.current.value = ''; inputRef.current.focus(); } }
    };

    return (
        <div
            className="hp-tracker-box"
            style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', borderLeft: `4px solid ${accentColor}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}
        >
            {/* Header: label + HP number */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {label}
                    <button
                        onClick={() => showHelp('hp-tracking')}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: HP tracking"
                        title="About HP tracking"
                    >?</button>
                </span>
                <span style={{ lineHeight: 1 }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: hpColor }}>{displayHP}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}> / {maxHP}</span>
                </span>
            </div>

            {/* HP Bar + percentage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, background: 'var(--collapsed-hp-track)', borderRadius: '6px', height: '16px', overflow: 'hidden' }}>
                    <div style={{ width: `${hpPercent}%`, height: '100%', background: barColor, borderRadius: '6px', transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right', flexShrink: 0 }}>
                    {Math.round(hpPercent)}%
                </span>
            </div>

            {/* Fainted banner */}
            {isFainted && !isDeathThreshold && (
                <div className="hp-fainted-banner" style={{
                    marginBottom: '8px', padding: '5px 10px', borderRadius: '5px',
                    fontSize: '12px', fontWeight: 'bold', textAlign: 'center'
                }}>
                    ✖ Fainted
                </div>
            )}

            {/* Death Saving Throw banner */}
            {isDeathThreshold && (
                <div className="hp-death-banner" style={{
                    marginBottom: '8px', padding: '8px 10px', borderRadius: '6px',
                    fontSize: '12px',
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>☠ Death Saving Throw Required!</div>
                    <div>Each round: roll {deathDice}. Roll ≤ {deathSaveTarget} to stabilize. Rolling above = death.</div>
                    <div style={{ marginTop: '2px', opacity: 0.8, fontSize: '11px' }}>{lethalNote}</div>
                </div>
            )}

            {/* Quick buttons: Damage | Full | Heal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
                {/* Damage group */}
                <div>
                    <div style={groupLabelStyle}>Damage</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[10, 5, 1].map(val => (
                            <button
                                key={`dmg-${val}`}
                                onClick={() => onDamage(val)}
                                aria-label={`Deal ${val} damage to ${label}`}
                                className="hp-btn"
                                style={dmgBtnStyle}
                            >
                                −{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Full restore button */}
                <div style={{ alignSelf: 'end' }}>
                    <div style={{ ...groupLabelStyle, visibility: 'hidden' }}>Full</div>
                    <button
                        onClick={onFull}
                        disabled={isAtFullHP}
                        aria-label={`Restore ${label} to full HP`}
                        className="hp-btn"
                        style={{
                            padding: '8px 10px',
                            background: 'transparent',
                            color: 'var(--stat-hp, #4caf50)',
                            border: '2px solid var(--stat-hp, #4caf50)',
                            borderRadius: '4px',
                            cursor: isAtFullHP ? 'not-allowed' : 'pointer',
                            fontSize: '13px', fontWeight: 'bold', minHeight: '44px', whiteSpace: 'nowrap',
                            opacity: isAtFullHP ? 0.4 : 1,
                        }}
                    >
                        ↺ Full
                    </button>
                </div>

                {/* Heal group */}
                <div>
                    <div style={groupLabelStyle}>Heal</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 5, 10].map(val => (
                            <button
                                key={`heal-${val}`}
                                onClick={() => onHeal(val)}
                                aria-label={`Heal ${val} HP for ${label}`}
                                className="hp-btn"
                                style={healBtnStyle}
                            >
                                +{val}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom amount divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 8px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Amount</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            </div>

            {/* Custom amount row */}
            <div className="hp-custom-row" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    aria-label={`Custom HP amount for ${label}`}
                    placeholder="Amount"
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                />
                <button
                    onClick={handleCustomDmg}
                    aria-label={`Deal custom damage to ${label}`}
                    className="hp-btn"
                    style={{
                        padding: '8px 12px', background: 'transparent',
                        color: 'var(--stat-atk, #f44336)', border: '2px solid var(--stat-atk, #f44336)',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', minHeight: '44px',
                    }}
                >
                    Dmg
                </button>
                <button
                    onClick={handleCustomHeal}
                    aria-label={`Heal custom HP for ${label}`}
                    className="hp-btn"
                    style={{
                        padding: '8px 12px', background: 'transparent',
                        color: 'var(--stat-hp, #4caf50)', border: '2px solid var(--stat-hp, #4caf50)',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', minHeight: '44px',
                    }}
                >
                    Heal
                </button>
            </div>
        </div>
    );
};

export default HPTracker;
