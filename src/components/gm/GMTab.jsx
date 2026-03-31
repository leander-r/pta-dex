// ============================================================
// GM Tab
// ============================================================
// Main Game Master tools tab with sub-section navigation.

import React, { useState, useRef } from 'react';
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
    { id: 'capture',   icon: '🎯', label: 'Capture Rates',  desc: 'Calculate catch rate and roll against a target number' },
    { id: 'encounter', icon: '🌿', label: 'Wild Encounters', desc: 'Look up encounter tables by area and time of day' },
    { id: 'biome',     icon: '🗺️', label: 'Habitats',       desc: 'Browse Pokémon by habitat and terrain type' },
    { id: 'rewards',   icon: '⭐', label: 'EXP Calculator',  desc: 'Calculate EXP and money rewards after a battle' },
    { id: 'gym',       icon: '❤️', label: 'Loyalty Guide',  desc: 'Track Pokémon loyalty and happiness mechanics' },
    { id: 'npc',       icon: '📋', label: 'Skill Checks',   desc: 'Reference DCs and skill check rules for NPCs' },
    { id: 'death',     icon: '💀', label: 'Death Saves',    desc: 'Manage death saving throws and stabilization' },
    { id: 'contest',   icon: '🎭', label: 'Contests',       desc: 'Run Pokémon Contests with appeals and judging' },
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
    const visitedRef = useRef(new Set(['capture']));

    const handleSectionChange = (id) => {
        visitedRef.current.add(id);
        setActiveSection(id);
    };

    const activeDesc = SECTIONS.find(s => s.id === activeSection)?.desc;

    return (
        <div>
            {/* Page title */}
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
                🎮 GM Tools
            </h2>

            {/* Sub-tab navigation — wraps in a gradient-masked scroll container on mobile */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div
                className="tabs"
                style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '4px',
                    background: 'var(--surface-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    flexShrink: 0,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {SECTIONS.map(({ id, icon, label }) => (
                    <button
                        key={id}
                        onClick={() => handleSectionChange(id)}
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
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                        aria-current={activeSection === id ? 'true' : undefined}
                    >
                        <span aria-hidden="true">{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
            {/* Right-edge fade hint — only visible when content overflows (mobile) */}
            <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: 0, bottom: 0, width: '32px', borderRadius: '0 10px 10px 0', background: 'linear-gradient(to right, transparent, var(--surface-bg))' }} aria-hidden="true" />
            </div>

            {/* Active section description */}
            {activeDesc && (
                <p className="section-description" style={{ marginBottom: '12px', marginTop: '-8px' }}>
                    {activeDesc}
                </p>
            )}

            {/* Mount all visited sections, hide non-active — preserves state on tab switch */}
            {SECTIONS.map(({ id }) => {
                const SectionComponent = SECTION_COMPONENTS[id];
                if (!visitedRef.current.has(id)) return null;
                return (
                    <div key={id} style={{ display: activeSection === id ? 'block' : 'none' }}>
                        <SectionComponent />
                    </div>
                );
            })}
        </div>
    );
};

export default GMTab;
