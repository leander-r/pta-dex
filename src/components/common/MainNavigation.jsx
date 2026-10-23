// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx.
// Pure navigation only — Save/Load and Export actions live in the
// Header's menu (one place for actions, reachable on mobile too).

import React, { useState, useRef, useEffect } from 'react';
import { TABS } from '../../data/constants.js';
import OnboardingChecklist from './OnboardingChecklist.jsx';

// Primary tabs: always visible, including in the mobile bottom bar
const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: '👤', label: 'Trainer',         mobileLabel: 'Trainer' },
    { tab: TABS.POKEMON,   icon: '🐾', label: 'Pokémon Team',    mobileLabel: 'Pokémon' },
    { tab: TABS.INVENTORY, icon: '🎒', label: 'Inventory',       mobileLabel: 'Items'   },
    { tab: TABS.BATTLE,    icon: '🎲', label: 'Dice Roller',     mobileLabel: 'Battle'  },
    { tab: TABS.REFERENCE, icon: '📚', label: 'Quick Reference', mobileLabel: 'Refs'    },
];

// Less-frequently-used tabs: shown inline on desktop, tucked under
// a "More" popover on the mobile bottom bar so it stays at 6 icons
const MORE_NAV_ITEMS = [
    { tab: TABS.NOTES, icon: '📝', label: 'Campaign Notes', mobileLabel: 'Notes' },
    { tab: TABS.GM,    icon: '🎮', label: 'GM Tools',       mobileLabel: 'GM'    },
];

const MainNavigation = ({ activeTab, setActiveTab }) => {
    const [showMore, setShowMore] = useState(false);
    const moreRef = useRef(null);

    // Close the "More" popover on outside click/touch or Escape
    useEffect(() => {
        if (!showMore) return;
        const handleOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
        };
        const handleKeyDown = (e) => { if (e.key === 'Escape') setShowMore(false); };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside, { passive: true });
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showMore]);

    const isMoreActive = MORE_NAV_ITEMS.some(item => item.tab === activeTab);

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

            {/* Shown inline on desktop; hidden from the mobile bottom bar (see "More" below) */}
            {MORE_NAV_ITEMS.map(({ tab, icon, label, mobileLabel }) => (
                <button
                    key={tab}
                    className={`nav-button nav-overflow-item ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                    aria-label={label}
                >
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                    <span className="nav-mobile-label">{mobileLabel}</span>
                </button>
            ))}

            {/* Mobile-only overflow button — CSS-hidden on desktop, where the
                items above already render inline */}
            <div className="nav-more-wrapper" ref={moreRef}>
                <button
                    type="button"
                    className={`nav-button nav-more-button ${isMoreActive ? 'active' : ''}`}
                    onClick={() => setShowMore(prev => !prev)}
                    aria-haspopup="true"
                    aria-expanded={showMore}
                    aria-label="More navigation options"
                >
                    <span className="nav-icon">⋯</span>
                    <span className="nav-mobile-label">More</span>
                </button>
                {showMore && (
                    <div className="nav-more-popover" role="menu">
                        {MORE_NAV_ITEMS.map(({ tab, icon, label }) => (
                            <button
                                key={tab}
                                role="menuitem"
                                className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => { setActiveTab(tab); setShowMore(false); }}
                            >
                                <span className="nav-icon">{icon}</span>
                                <span className="nav-label">{label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="nav-divider" style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />

            {/* Onboarding checklist — hidden on mobile (bottom bar has no room);
                a mobile-visible copy is rendered in AppLayout's main content area instead */}
            <OnboardingChecklist setActiveTab={setActiveTab} layout="sidebar" className="nav-checklist" />
        </div>
    );
};

export default MainNavigation;
