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
    const displayHP = Math.max(currentHP, -maxHP); // clamp display at -maxHP
    const hpPercent = maxHP > 0 ? Math.max(0, Math.min(100, (currentHP / maxHP) * 100)) : 0;

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
    const lethalNote = isTrainer
        ? 'Trainers below level 20 cannot deal lethal damage.'
        : 'Pokémon below level 30 cannot deal lethal damage (HP floors at −90% max).';

    return (
        <div className="hp-tracker-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                    {label}
                    <button
                        onClick={() => showHelp('hp-tracking')}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: HP tracking"
                        title="About HP tracking"
                    >?</button>
                </span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: hpColor }}>
                    {displayHP} / {maxHP}
                </span>
            </div>

            {/* Fainted banner */}
            {isFainted && !isDeathThreshold && (
                <div className="hp-fainted-banner" style={{
                    marginBottom: '6px', padding: '5px 10px', borderRadius: '5px',
                    fontSize: '12px', fontWeight: 'bold', textAlign: 'center'
                }}>
                    ✖ Fainted — 0 HP
                </div>
            )}

            {/* Death Saving Throw banner */}
            {isDeathThreshold && (
                <div className="hp-death-banner" style={{
                    marginBottom: '6px', padding: '8px 10px', borderRadius: '6px',
                    fontSize: '12px',
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>☠ Death Saving Throw Required!</div>
                    <div>Each round: roll {deathDice}. Roll ≤ {deathSaveTarget} to stabilize. Rolling above = death.</div>
                    <div style={{ marginTop: '2px', opacity: 0.8, fontSize: '11px' }}>{lethalNote}</div>
                </div>
            )}

            <div style={{ background: 'var(--collapsed-hp-track)', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="text-muted" style={{ fontSize: '12px', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                    Damage ← → Heal
                </span>
                {[10, 5, 1].map(val => (
                    <button
                        key={`dmg-${val}`}
                        onClick={() => onDamage(val)}
                        aria-label={`Deal ${val} damage to ${label}`}
                        style={{ padding: '4px 8px', minHeight: '34px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        −{val}
                    </button>
                ))}
                <button
                    onClick={onFull}
                    aria-label={`Restore ${label} to full HP`}
                    style={{ padding: '4px 8px', minHeight: '34px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Full
                </button>
                {[1, 5, 10].map(val => (
                    <button
                        key={`heal-${val}`}
                        onClick={() => onHeal(val)}
                        aria-label={`Heal ${val} HP for ${label}`}
                        style={{ padding: '4px 8px', minHeight: '34px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        +{val}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px', justifyContent: 'center' }}>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    aria-label={`Custom HP amount for ${label}`}
                    placeholder="Amt"
                    style={{ width: '70px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center' }}
                />
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onDamage(val); inputRef.current.value = ''; }
                        else { toast.warning('Enter a positive number.'); if (inputRef.current) inputRef.current.value = ''; }
                    }}
                    aria-label={`Deal custom damage to ${label}`}
                    style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Dmg
                </button>
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onHeal(val); inputRef.current.value = ''; }
                        else { toast.warning('Enter a positive number.'); if (inputRef.current) inputRef.current.value = ''; }
                    }}
                    aria-label={`Heal custom HP for ${label}`}
                    style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Heal
                </button>
            </div>
        </div>
    );
};

export default HPTracker;
