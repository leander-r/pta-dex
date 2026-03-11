// ============================================================
// GM Tab
// ============================================================
// Main Game Master tools tab with sub-section navigation.

import React, { useState } from 'react';
import CaptureCalculator from './CaptureCalculator.jsx';
import EncounterGuide from './EncounterGuide.jsx';
import RewardTables from './RewardTables.jsx';
import GymLeaderGuide from './GymLeaderGuide.jsx';
import NpcGenerator from './NpcGenerator.jsx';
import ContestTracker from './ContestTracker.jsx';

// Sections drawn directly from the PTA GM Guide (final).pdf
const SECTIONS = [
    { id: 'capture',   icon: '🎯', label: 'Capture Rates'    },
    { id: 'encounter', icon: '🌿', label: 'Wild Encounters'   },
    { id: 'rewards',   icon: '⭐', label: 'EXP Calculator'   },
    { id: 'gym',       icon: '❤️', label: 'Loyalty Guide'    },
    { id: 'npc',       icon: '📋', label: 'Skill Checks'     },
    { id: 'contest',   icon: '💀', label: 'Death Saves'      },
];

const SECTION_COMPONENTS = {
    capture:   CaptureCalculator,
    encounter: EncounterGuide,
    rewards:   RewardTables,
    gym:       GymLeaderGuide,
    npc:       NpcGenerator,
    contest:   ContestTracker,
};

const GMTab = () => {
    const [activeSection, setActiveSection] = useState('capture');

    const ActiveComponent = SECTION_COMPONENTS[activeSection];

    return (
        <div>
            {/* Page title */}
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
                🎮 GM Tools
            </h2>

            {/* Sub-tab navigation */}
            <div
                className="tabs"
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '20px',
                    padding: '4px',
                    background: 'var(--surface-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                }}
            >
                {SECTIONS.map(({ id, icon, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={activeSection === id ? 'tab active' : 'tab'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            background: activeSection === id
                                ? 'linear-gradient(135deg, #f5a623, #e8941c)'
                                : 'transparent',
                            color: activeSection === id ? 'white' : 'var(--text-secondary)',
                            fontWeight: activeSection === id ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                        }}
                        aria-current={activeSection === id ? 'true' : undefined}
                    >
                        <span aria-hidden="true">{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Active section content */}
            <ActiveComponent />
        </div>
    );
};

export default GMTab;
