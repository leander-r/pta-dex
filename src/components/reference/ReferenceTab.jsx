// ============================================================
// Reference Tab Component
// ============================================================
// Quick reference section with type chart, moves, abilities, etc.

import React, { useState } from 'react';

// Sub-components for each reference section
import TypeChartSection from './TypeChartSection.jsx';
import NaturesSection from './NaturesSection.jsx';
import MovesSection from './MovesSection.jsx';
import AbilitiesSection from './AbilitiesSection.jsx';
import ExpChartSection from './ExpChartSection.jsx';
import GameRulesSection from './GameRulesSection.jsx';
import PokedexSection from './PokedexSection.jsx';

/**
 * ReferenceTab - Quick reference database browser
 * Sub-components use context for showDetail directly
 */
const ReferenceTab = () => {
    const [activeSection, setActiveSection] = useState('pokedex');

    const sections = [
        { id: 'pokedex', label: 'Pokédex' },
        { id: 'types', label: 'Type Chart' },
        { id: 'natures', label: 'Natures' },
        { id: 'moves', label: 'Moves Database' },
        { id: 'abilities', label: 'Abilities' },
        { id: 'rules', label: 'Game Rules' },
        { id: 'exp', label: 'EXP Chart' }
    ];

    return (
        <div>
            <h2 className="section-title">Quick Reference</h2>

            {/* Tab Navigation */}
            <div className="tabs" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', gap: '4px', marginBottom: '16px' }}>
                {sections.map(section => (
                    <button
                        key={section.id}
                        className={`tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            flexShrink: 0,
                            background: activeSection === section.id ? 'var(--poke-orange, #667eea)' : 'transparent',
                            color: activeSection === section.id ? 'white' : 'var(--poke-orange, #667eea)',
                            border: activeSection === section.id ? 'none' : '1px solid var(--poke-orange, #667eea)',
                            fontWeight: activeSection === section.id ? 700 : 500
                        }}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {activeSection === 'pokedex' && <PokedexSection />}
            {activeSection === 'types' && <TypeChartSection />}
            {activeSection === 'natures' && <NaturesSection />}
            {activeSection === 'moves' && <MovesSection />}
            {activeSection === 'abilities' && <AbilitiesSection />}
            {activeSection === 'rules' && <GameRulesSection />}
            {activeSection === 'exp' && <ExpChartSection />}
        </div>
    );
};

export default ReferenceTab;
