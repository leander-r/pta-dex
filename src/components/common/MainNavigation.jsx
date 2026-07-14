// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx

import React from 'react';
import { TABS } from '../../data/constants.js';
import { useModal, useData } from '../../contexts/index.js';
import { useTrainerContext } from '../../contexts/TrainerContext.jsx';
import OnboardingChecklist from './OnboardingChecklist.jsx';

const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: '👤', label: 'Trainer',        mobileLabel: 'Trainer' },
    { tab: TABS.POKEMON,   icon: '🐾', label: 'Pokémon Team',   mobileLabel: 'Pokémon' },
    { tab: TABS.INVENTORY, icon: '🎒', label: 'Inventory',      mobileLabel: 'Items'   },
    { tab: TABS.BATTLE,    icon: '🎲', label: 'Dice Roller',    mobileLabel: 'Battle'  },
    { tab: TABS.REFERENCE, icon: '📚', label: 'Quick Reference', mobileLabel: 'Refs'   },
    { tab: TABS.NOTES,     icon: '📝', label: 'Campaign Notes', mobileLabel: 'Notes'   },
    { tab: TABS.GM,        icon: '🎮', label: 'GM Tools',       mobileLabel: 'GM'      },
];


const MainNavigation = ({ activeTab, setActiveTab }) => {
    const { openSaveLoadModal, setShowCardModal, openPrintSheet } = useModal();
    const { trainer } = useTrainerContext();

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

            {/* Onboarding checklist — hidden on mobile (bottom bar has no room);
                a mobile-visible copy is rendered in AppLayout's main content area instead */}
            <OnboardingChecklist setActiveTab={setActiveTab} layout="sidebar" className="nav-checklist" />
        </div>
    );
};

export default MainNavigation;
