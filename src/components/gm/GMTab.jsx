// ============================================================
// GM Tab
// ============================================================
// Main Game Master tools tab with sub-section navigation.

import { useState, useRef } from 'react';
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
    { id: 'capture',   icon: '🎯', label: 'Capture Rates',   description: 'Roll a capture check against a wild Pokémon\'s catch rate and modifiers.' },
    { id: 'encounter', icon: '🌿', label: 'Wild Encounters', description: 'Rules for encounter composition, wild Pokémon stats, and allying.' },
    { id: 'biome',     icon: '🗺️', label: 'Habitats',        description: 'Browse which species can appear in each habitat/biome.' },
    { id: 'rewards',   icon: '⭐', label: 'EXP Calculator',  description: 'Look up EXP and prize money awards for defeating a given species.' },
    { id: 'gym',       icon: '❤️', label: 'Loyalty Guide',   description: 'Reference for what raises or lowers a Pokémon\'s Loyalty rank.' },
    { id: 'npc',       icon: '📋', label: 'Skill Checks',    description: 'Roll a skill check and look up DCs for every trainer skill.' },
    { id: 'death',     icon: '💀', label: 'Death Saves',     description: 'Rules reference for Death Saves and the Fainted condition.' },
    { id: 'contest',   icon: '🎭', label: 'Contests',        description: 'Run a Pokémon Contest — appeal rounds, judging, and scoring.' },
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

    return (
        <div>
            {/* Page title */}
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
                🎮 GM Tools
            </h2>

            {/* Sub-tab navigation — wraps into as many rows as needed, never scrolls or overflows.
                Flex-wrap (not CSS Grid) deliberately: a grid with equal-width columns forces every
                chip as wide as the widest, over-packing short labels into unreadable fixed columns
                on wide screens — flex lets each chip size to its own label and simply wrap. */}
            <div
                role="tablist"
                className="tabs"
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '4px',
                    marginBottom: '20px',
                    background: 'var(--surface-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                }}
            >
                {SECTIONS.map(({ id, icon, label, description }) => (
                    <button
                        key={id}
                        role="tab"
                        onClick={() => handleSectionChange(id)}
                        className={activeSection === id ? 'tab active' : 'tab'}
                        aria-selected={activeSection === id}
                        aria-label={`${label} — ${description}`}
                        title={description}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            fontWeight: activeSection === id ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            // Overrides the shared .tab class's `flex:1; min-width:80px` (set at
                            // ≤1024px for other tab bars that want equal-width columns) — these
                            // chips need to size to their own label instead, or they all get
                            // stretched to an identical width too narrow for the longer labels.
                            flexGrow: 0,
                            flexShrink: 0,
                            flexBasis: 'auto',
                            minWidth: 0,
                            maxWidth: '100%',
                        }}
                    >
                        <span aria-hidden="true" style={{ flexShrink: 0 }}>{icon}</span>
                        <span className="gm-tab-label" style={{ whiteSpace: 'nowrap' }}>{label}</span>
                    </button>
                ))}
            </div>

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
