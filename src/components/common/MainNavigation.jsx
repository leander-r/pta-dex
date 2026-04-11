// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx

import React from 'react';
import { TABS } from '../../data/constants.js';
import { useModal, useData } from '../../contexts/index.js';
import { useTrainerContext } from '../../contexts/TrainerContext.jsx';
import { useOnboarding } from '../../hooks/useOnboarding.js';

const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: '👤', label: 'Trainer',        mobileLabel: 'Trainer' },
    { tab: TABS.POKEMON,   icon: '🎮', label: 'Pokémon Team',   mobileLabel: 'Pokémon' },
    { tab: TABS.INVENTORY, icon: '🎒', label: 'Inventory',      mobileLabel: 'Items'   },
    { tab: TABS.BATTLE,    icon: '🎲', label: 'Dice Roller',    mobileLabel: 'Battle'  },
    { tab: TABS.REFERENCE, icon: '📚', label: 'Quick Reference', mobileLabel: 'Refs'   },
    { tab: TABS.NOTES,     icon: '📝', label: 'Campaign Notes', mobileLabel: 'Notes'   },
    { tab: TABS.GM,        icon: '🎮', label: 'GM Tools',       mobileLabel: 'GM'      },
];


const MainNavigation = ({ activeTab, setActiveTab }) => {
    const { openSaveLoadModal, setShowCardModal, openPrintSheet } = useModal();
    const { trainer } = useTrainerContext();
    const { loadDemoTrainer } = useData();
    const { steps, allDone, dismissed, dismiss } = useOnboarding();

    const showChecklist = !dismissed && !allDone;
    const showAllDone   = !dismissed && allDone;

    return (
        <div className="sidebar" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map(({ tab, icon, label, mobileLabel }) => (
                <button
                    key={tab}
                    className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                    aria-label={label}
                >
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                    <span className="nav-mobile-label">{mobileLabel}</span>
                </button>
            ))}

            <div className="nav-divider" style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />

            <button
                className="nav-button nav-saveload"
                onClick={openSaveLoadModal}
                title="Save or load a game state snapshot"
                aria-label="Open save and load menu"
            >
                <span className="nav-icon">💾</span>
                <span className="nav-label">Save / Load</span>
                <span className="nav-mobile-label">Save</span>
            </button>

            {/* Export section — hidden on mobile (bottom bar has no room) */}
            <div className="nav-checklist" style={{ margin: '8px 0 0' }}>
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '0 8px 6px' }} />
                <div style={{
                    padding: '2px 10px 4px',
                    fontSize: '10px', fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.8px'
                }}>
                    Share &amp; Export
                </div>
                <button
                    className="nav-button"
                    onClick={() => setShowCardModal(true)}
                    title={`Export trainer and Pokémon cards for ${trainer?.name || 'trainer'}`}
                    style={{ marginBottom: '2px' }}
                >
                    <span className="nav-icon">🃏</span>
                    <span className="nav-label">Export Cards</span>
                    <span className="nav-mobile-label">Cards</span>
                </button>
                <button
                    className="nav-button"
                    onClick={openPrintSheet}
                    title="Print or save a character sheet as PDF"
                >
                    <span className="nav-icon">🖨️</span>
                    <span className="nav-label">Print Sheet</span>
                    <span className="nav-mobile-label">Print</span>
                </button>
            </div>

            {/* Onboarding checklist — hidden on mobile (bottom bar has no room) */}
            {showChecklist && (
                <div className="nav-checklist" style={{
                    margin: '10px 8px 0',
                    borderRadius: '8px',
                    border: '1px solid var(--tint-orange-border)',
                    overflow: 'hidden',
                    fontSize: '12px'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))',
                        color: 'white',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.3px'
                    }}>
                        <span>✦ Getting Started</span>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss getting started checklist"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '4px 6px',
                                minWidth: '28px',
                                minHeight: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >✕</button>
                    </div>

                    {/* Steps */}
                    <div style={{ padding: '6px 0', background: 'var(--surface-bg)' }}>
                        {steps.map(step => (
                            step.done ? (
                                <div key={step.id} style={{
                                    padding: '5px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    color: 'var(--color-success-text)',
                                    fontWeight: 600
                                }}>
                                    <span style={{ flexShrink: 0 }}>✓</span>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{step.label}</span>
                                </div>
                            ) : (
                                <button
                                    key={step.id}
                                    onClick={() => step.tab ? setActiveTab(step.tab) : openSaveLoadModal()}
                                    style={{
                                        width: '100%',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '7px',
                                        color: 'var(--text-color)',
                                        fontSize: '13px'
                                    }}
                                    title={step.tab ? `Go to ${step.tab} tab` : 'Open Save / Load'}
                                >
                                    <span style={{ flexShrink: 0, marginTop: '1px', color: 'var(--poke-orange)' }}>○</span>
                                    <span>
                                        <span style={{ display: 'block', fontWeight: 600 }}>{step.label}</span>
                                        {step.hint && (
                                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', lineHeight: '1.4' }}>
                                                {step.hint}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            )
                        ))}
                    </div>

                    {/* Demo trainer link */}
                    <div style={{
                        padding: '6px 10px 8px',
                        background: 'var(--surface-bg)',
                        borderTop: '1px solid var(--border-light)',
                    }}>
                        <button
                            onClick={loadDemoTrainer}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                textAlign: 'center',
                                lineHeight: '1.4'
                            }}
                            title="Load a pre-built trainer to explore the app"
                        >
                            ★ Load example trainer
                        </button>
                    </div>
                </div>
            )}

            {/* All done message — hidden on mobile */}
            {showAllDone && (
                <div className="nav-checklist" style={{
                    margin: '10px 8px 0',
                    borderRadius: '8px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    fontSize: '12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '7px 10px',
                        background: 'var(--color-success-text)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>✓ Setup complete!</span>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '2px 4px'
                            }}
                        >✕</button>
                    </div>
                    <div style={{ padding: '8px 10px', color: 'var(--color-success-text)', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>What to do next:</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', opacity: 0.9 }}>
                            <li>Add more Pokémon to your party</li>
                            <li>Browse the Inventory tab for items</li>
                            <li>Set abilities &amp; held items per Pokémon</li>
                            <li>Roll dice in the Battle tab</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainNavigation;
