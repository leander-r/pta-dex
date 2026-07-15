import React from 'react';
import { parseHealFormula, parseReviveAmount, parseStatusCure, calculatePokemonHP } from '../../utils/dataUtils.js';
import { STATUS_CONDITIONS } from '../../data/statusConditions.js';
import PartyStrip from './PartyStrip.jsx';

const statusLabel = (key) => STATUS_CONDITIONS.find(c => c.key === key)?.label || key;

const HealModePanel = ({ selectedPokemonId, setSelectedPokemonId, party, healingInventory, onUseItem }) => {
    const selectedPoke = party.find(p => p.id === selectedPokemonId);
    const isFullHP = selectedPoke && (selectedPoke.currentDamage || 0) <= 0;
    const maxHP = selectedPoke ? calculatePokemonHP(selectedPoke) : 0;
    const isFainted = selectedPoke && (maxHP - (selectedPoke.currentDamage || 0)) <= 0;
    const activeConditions = selectedPoke?.statusConditions || {};
    const hasAnyStatus = Object.values(activeConditions).some(Boolean);

    return (
    <div>
        {party.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                No Pokémon in party to heal.
            </div>
        )}
        <PartyStrip
            party={party}
            selectedPokemonId={selectedPokemonId}
            onSelect={setSelectedPokemonId}
        />

        {healingInventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No healing items in your inventory.
                <div style={{ marginTop: 6, fontSize: 12 }}>
                    Switch to the <strong>Inventory</strong> tab to add Potions, Berries, or other healing items.
                </div>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
                {healingInventory.map(item => {
                    const effect = item.effect || '';
                    const reviveHp = parseReviveAmount(effect);
                    const statusCure = parseStatusCure(effect);
                    const formula = parseHealFormula(effect);

                    let formulaLabel, disabled, disabledReason;
                    if (reviveHp !== null) {
                        formulaLabel = `💫 Revive to ${reviveHp} HP`;
                        disabled = !selectedPokemonId || !isFainted;
                        disabledReason = !isFainted ? 'Only usable on a fainted Pokémon' : undefined;
                    } else if (statusCure !== null) {
                        const applicable = statusCure === 'all' ? hasAnyStatus : statusCure.some(k => activeConditions[k]);
                        formulaLabel = statusCure === 'all' ? '✨ Cures any status' : `✨ Cures ${statusCure.map(statusLabel).join('/')}`;
                        disabled = !selectedPokemonId || !applicable;
                        disabledReason = !applicable ? "Pokémon doesn't have a status this cures" : undefined;
                    } else {
                        const healsHP = formula.type === 'dice' || formula.type === 'fraction';
                        formulaLabel = formula.type === 'dice' ? `🎲 ${formula.formula}`
                            : formula.type === 'fraction' ? `📊 ${formula.num}/${formula.denom} Max HP`
                            : '✨ Status';
                        disabled = !selectedPokemonId || (healsHP && isFullHP);
                        disabledReason = healsHP && isFullHP ? 'Already at full HP' : undefined;
                    }

                    return (
                        <div
                            key={item.name}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--border-medium)' }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {formulaLabel} · ×{item.quantity || 1}
                                </div>
                            </div>
                            <button
                                onClick={() => onUseItem(item.name)}
                                disabled={disabled}
                                title={disabledReason}
                                style={{
                                    padding: '6px 14px',
                                    background: !disabled ? '#4caf50' : 'var(--collapsed-btn-bg)',
                                    color: !disabled ? 'white' : 'var(--collapsed-btn-text)', border: 'none', borderRadius: '4px',
                                    cursor: !disabled ? 'pointer' : 'not-allowed',
                                    fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap'
                                }}
                            >
                                Use
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    );
};

export default HealModePanel;
