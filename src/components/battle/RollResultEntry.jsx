import { getTypeColor } from '../../utils/typeUtils.js';

// Renders a single roll's result card. Shared by RollHistory.jsx (the scrollable log)
// and BattleTab.jsx (an inline "just rolled" result shown right under the Roll button,
// so a roll is visible without having to scroll to the History panel — see ContestPanel's
// inline result box, which this generalizes to the other roll types).
const RollResultEntry = ({ roll }) => (
    <div
        className={`roll-history-item ${roll.isCrit ? 'crit' : ''}`}
        style={{
            padding: '10px', marginBottom: '8px', borderRadius: '6px',
            borderLeft: `4px solid ${
                roll.type === 'pokemon'         ? getTypeColor(roll.moveType || 'Normal') :
                roll.type === 'trainer_skill'   ? '#667eea' :
                roll.type === 'trainer_attack'  ? '#e53935' :
                roll.type === 'heal'            ? '#4caf50' :
                roll.type === 'status_cure'     ? '#9c27b0' :
                roll.type === 'contest'         ? (roll.contestTypeColor || '#e91e63') : '#95a5a6'
            }`
        }}
    >
        {roll.type === 'pokemon' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {roll.pokemon} - {roll.move}
                    {roll.isCrit && <span style={{ marginLeft: '8px', color: 'var(--color-danger-text)' }}>CRITICAL!</span>}
                    {!roll.isHit && <span style={{ marginLeft: '8px', color: 'var(--color-danger-text)', fontWeight: 'bold' }}>MISS!</span>}
                </div>
                <div style={{ fontSize: '12px', padding: '4px 8px', background: roll.isHit ? (roll.isCrit ? 'var(--roll-crit-bg)' : 'var(--roll-hit-bg)') : 'var(--roll-miss-bg)', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                    <span style={{ fontWeight: 'bold' }}>AC Roll: </span>
                    <span style={{ fontWeight: 'bold', color: roll.isCrit ? '#ff6f00' : (roll.isHit ? 'var(--color-success-text)' : 'var(--color-danger-text)') }}>
                        {roll.accRoll}
                        {roll.accModifier !== 0 && (
                            <span className="text-muted">{roll.accModifier > 0 ? '+' : ''}{roll.accModifier}={roll.modifiedAccRoll}</span>
                        )}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}> vs {roll.moveAC == null ? 'Auto-hit (no AC)' : `AC ${roll.moveAC}`}</span>
                    {roll.acWasOverridden && <span style={{ color: '#667eea', marginLeft: '4px' }}>(DM)</span>}
                    {roll.isCrit && <span style={{ color: '#ff6f00', marginLeft: '4px' }}>(Natural 20!)</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {roll.isStatus ? (
                        <span style={{ color: roll.isHit ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            Status Move - {roll.isHit ? 'Effect applies!' : 'No effect'}
                        </span>
                    ) : roll.isHit ? (
                        <>
                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{roll.total}</span>
                            <span> damage | [{roll.rolls?.join(', ')}] = {roll.diceTotal}{(roll.diceBonus ?? 0) > 0 ? ` + ${roll.diceBonus} (base)` : ''}{roll.statBonus > 0 ? ` + ${roll.statBonus} (stat)` : ''}{roll.stabBonus > 0 ? ` + ${roll.stabBonus} (STAB)` : ''}</span>
                            {/* PHB2 "Calculating Damage": this total is only steps 1-2 (dice + attack
                                stat + STAB) — the defender still subtracts Defense/Sp.Def and applies
                                Weakness/Resistance (steps 3-4) before it comes off their HP. The app
                                doesn't track an opposing Pokémon's stats, so that's a manual GM step. */}
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                                Before target's Defense &amp; type effectiveness
                            </div>
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Attack missed - no damage</span>
                    )}
                </div>
                {roll.statusPenalties?.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '3px' }}>
                        ⚠ Status penalties: {roll.statusPenalties.map(p => `${p.status} (${p.penalty})`).join(', ')}
                    </div>
                )}
            </>
        )}
        {roll.type === 'trainer_skill' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{roll.skill} ({roll.skillStat})</div>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                    <span> | [{roll.rolls?.join(', ')}]</span>
                    {/* Untrained skills apply no stat bonus at all (plain 1d20) — showing the raw
                        stat modifier here regardless of training status implied it was added when
                        it wasn't. And the old hardcoded "+2 trained" under-reported Rank 2's real
                        bonus (2×modifier+4, not modifier+2) — show the actual computed roll.bonus
                        instead of reconstructing it from parts. */}
                    {roll.hasSkill && roll.bonus > 0 && (
                        <span> +{roll.bonus} trained (stat {roll.modifier >= 0 ? '+' : ''}{roll.modifier})</span>
                    )}
                </div>
            </>
        )}
        {roll.type === 'trainer_attack' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚔ {roll.trainer} — {roll.weapon}
                    {roll.isCrit && <span style={{ marginLeft: '8px', color: '#ff6f00' }}>CRITICAL!</span>}
                    {!roll.isHit && <span style={{ marginLeft: '8px', color: 'var(--color-danger-text)', fontWeight: 'bold' }}>MISS!</span>}
                </div>
                <div style={{ fontSize: '12px', padding: '4px 8px', background: roll.isHit ? (roll.isCrit ? 'var(--roll-crit-bg)' : 'var(--roll-hit-bg)') : 'var(--roll-miss-bg)', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                    <span style={{ fontWeight: 'bold' }}>AC Roll: </span>
                    <span style={{ fontWeight: 'bold', color: roll.isCrit ? '#ff6f00' : (roll.isHit ? 'var(--color-success-text)' : 'var(--color-danger-text)') }}>
                        {roll.accRoll}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}> vs AC {roll.weaponAC}</span>
                    {roll.isCrit && <span style={{ color: '#ff6f00', marginLeft: '4px' }}>(Natural 20!)</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {roll.isHit ? (
                        <>
                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{roll.total}</span>
                            <span> damage | [{roll.rolls?.join(', ')}] = {roll.diceTotal}</span>
                            {(roll.diceBonus ?? 0) > 0 && <span> + {roll.diceBonus} (base)</span>}
                            {roll.statMod !== 0 && <span> {roll.statMod > 0 ? '+' : ''}{roll.statMod} ({roll.statModLabel})</span>}
                            <div className="text-muted" style={{ marginTop: '2px' }}>DB{roll.db} — {roll.dice} · {roll.weaponSource}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                                Before target's Defense &amp; type effectiveness
                            </div>
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Attack missed — no damage</span>
                    )}
                </div>
            </>
        )}
        {roll.type === 'custom' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Custom: {roll.dice}</div>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                    <span> | [{roll.rolls?.join(', ')}]</span>
                    {!!roll.bonus && <span> {roll.bonus > 0 ? '+' : ''}{roll.bonus}</span>}
                </div>
            </>
        )}
        {roll.type === 'contest' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    🎭 {roll.pokemon} — {roll.moveName}
                    {roll.contestType && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', padding: '1px 7px', borderRadius: '8px', background: roll.contestTypeColor || '#e91e63', color: 'white', fontWeight: 700 }}>
                            {roll.contestType}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: roll.contestTypeColor || '#e91e63' }}>{roll.total}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                        {roll.contestDice}: [{(roll.rolls || []).join(', ')}]{roll.bonus ? ` ${roll.bonus > 0 ? '+' : ''}${roll.bonus}` : ''} = {roll.total}
                    </span>
                </div>
                {roll.contestEffect && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontStyle: 'italic' }}>
                        {roll.contestEffect}
                    </div>
                )}
            </>
        )}
        {roll.type === 'heal' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🩹 {roll.pokemon} — {roll.item}</div>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#4caf50' }}>+{roll.amount} HP</span>
                    {roll.rolls?.length > 0 && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                            {roll.formula}: [{roll.rolls.join(', ')}]{roll.bonus > 0 ? `+${roll.bonus}` : ''} = {roll.amount}
                        </span>
                    )}
                    {roll.rolls?.length === 0 && roll.formula && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({roll.formula})</span>
                    )}
                </div>
            </>
        )}
        {roll.type === 'status_cure' && (
            <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✨ {roll.pokemon} — {roll.item}</div>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold', color: '#9c27b0' }}>Cured: {roll.cured}</span>
                </div>
            </>
        )}
    </div>
);

export default RollResultEntry;
