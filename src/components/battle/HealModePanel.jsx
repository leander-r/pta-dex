import React from 'react';
import { parseHealFormula } from '../../utils/dataUtils.js';
import PartyStrip from './PartyStrip.jsx';

const HealModePanel = ({ selectedPokemonId, setSelectedPokemonId, party, healingInventory, onUseItem }) => (
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
                    const formula = parseHealFormula(item.effect || '');
                    const formulaLabel = formula.type === 'dice' ? `🎲 ${formula.formula}`
                        : formula.type === 'fraction' ? `📊 ${formula.num}/${formula.denom} Max HP`
                        : '✨ Status';
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
                                disabled={!selectedPokemonId}
                                style={{
                                    padding: '6px 14px',
                                    background: selectedPokemonId ? '#4caf50' : 'var(--collapsed-btn-bg)',
                                    color: selectedPokemonId ? 'white' : 'var(--collapsed-btn-text)', border: 'none', borderRadius: '4px',
                                    cursor: selectedPokemonId ? 'pointer' : 'not-allowed',
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

export default HealModePanel;
