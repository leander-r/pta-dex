// ============================================================
// GM Tab
// ============================================================
// Main Game Master tools tab with sub-section navigation.

import React, { useState } from 'react';
import CaptureCalculator from './CaptureCalculator.jsx';
import EncounterGuide from './EncounterGuide.jsx';
import RewardTables from './RewardTables.jsx';
import LoyaltyGuide from './LoyaltyGuide.jsx';
import SkillChecks from './SkillChecks.jsx';
import DeathSaves from './DeathSaves.jsx';
import BiomeEncounters from './BiomeEncounters.jsx';
import ContestRunner from './ContestRunner.jsx';

// Sections drawn directly from the PTA GM Guide (final).pdf
const SECTIONS = [
    { id: 'capture',   icon: '🎯', label: 'Capture Rates'    },
    { id: 'encounter', icon: '🌿', label: 'Wild Encounters'   },
    { id: 'biome',     icon: '🗺️', label: 'Habitats'         },
    { id: 'rewards',   icon: '⭐', label: 'EXP Calculator'   },
    { id: 'gym',       icon: '❤️', label: 'Loyalty Guide'    },
    { id: 'npc',       icon: '📋', label: 'Skill Checks'     },
    { id: 'death',     icon: '💀', label: 'Death Saves'      },
    { id: 'contest',   icon: '🎭', label: 'Contests'         },
];

const SECTION_COMPONENTS = {
    capture:   CaptureCalculator,
    encounter: EncounterGuide,
    biome:     BiomeEncounters,
    rewards:   RewardTables,
    gym:       LoyaltyGuide,
    npc:       SkillChecks,
    death:     DeathSaves,
    contest:   ContestRunner,
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
                                ? 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))'
                                : 'transparent',
                            color: activeSection === id ? 'white' : 'var(--text-secondary)',
                            fontWeight: activeSection === id ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
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
