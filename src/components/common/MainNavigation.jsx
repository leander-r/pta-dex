// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx.
// Pure navigation only — Save/Load and Export actions live in the
// Header's menu (one place for actions, reachable on mobile too).

import React, { useState, useRef, useEffect } from 'react';
import { TABS } from '../../data/constants.js';
import OnboardingChecklist from './OnboardingChecklist.jsx';

// Icon set: same stroke-SVG language as the header's menu icons (currentColor
// so active/hover states recolor them for free, unlike emoji).
const svgProps = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };

const IconTrainer = () => (
    <svg {...svgProps}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const IconPokemon = () => (
    <svg {...svgProps}>
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
);
const IconInventory = () => (
    <svg {...svgProps}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);
const IconDice = () => (
    <svg {...svgProps}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </svg>
);
const IconReference = () => (
    <svg {...svgProps}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const IconNotes = () => (
    <svg {...svgProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);
const IconGM = () => (
    <svg {...svgProps}>
        <rect x="2" y="6" width="20" height="12" rx="6" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <circle cx="15" cy="10.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="18" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
);
const IconMore = () => (
    <svg {...svgProps}>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);

// Primary tabs: always visible, including in the mobile bottom bar
const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: <IconTrainer />,   label: 'Trainer',         mobileLabel: 'Trainer' },
    { tab: TABS.POKEMON,   icon: <IconPokemon />,   label: 'Pokémon Team',    mobileLabel: 'Pokémon' },
    { tab: TABS.INVENTORY, icon: <IconInventory />, label: 'Inventory',       mobileLabel: 'Items'   },
    { tab: TABS.BATTLE,    icon: <IconDice />,      label: 'Dice Roller',     mobileLabel: 'Battle'  },
    { tab: TABS.REFERENCE, icon: <IconReference />, label: 'Quick Reference', mobileLabel: 'Refs'    },
];

// Less-frequently-used tabs: shown inline on desktop, tucked under
// a "More" popover on the mobile bottom bar so it stays at 6 icons
const MORE_NAV_ITEMS = [
    { tab: TABS.NOTES, icon: <IconNotes />, label: 'Campaign Notes', mobileLabel: 'Notes' },
    { tab: TABS.GM,    icon: <IconGM />,    label: 'GM Tools',       mobileLabel: 'GM'    },
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
                    <span className="nav-icon"><IconMore /></span>
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
