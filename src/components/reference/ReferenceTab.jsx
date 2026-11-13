// ============================================================
// Reference Tab Component
// ============================================================
// Quick reference section with type chart, moves, abilities, etc.

import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../contexts/index.js';

// Sub-components for each reference section
import TypeChartSection from './TypeChartSection.jsx';
import NaturesSection from './NaturesSection.jsx';
import MovesSection from './MovesSection.jsx';
import AbilitiesSection from './AbilitiesSection.jsx';
import ExpChartSection from './ExpChartSection.jsx';
import GameRulesSection from './GameRulesSection.jsx';
import PokedexSection from './PokedexSection.jsx';
import TrainerClassesSection from './TrainerClassesSection.jsx';
import TrainerFeaturesSection from './TrainerFeaturesSection.jsx';

/**
 * ReferenceTab - Quick reference database browser
 * Sub-components use context for showDetail directly
 */
const ReferenceTab = () => {
    const [activeSection, setActiveSection] = useState('pokedex');
    const visitedRef = useRef(new Set(['pokedex']));
    const { pokedexJumpTarget } = useUI();

    // A "View in Pokédex" link elsewhere in the app sets pokedexJumpTarget —
    // switch to the Pokédex sub-section so PokedexSection can pick it up.
    useEffect(() => {
        if (pokedexJumpTarget) {
            visitedRef.current.add('pokedex');
            setActiveSection('pokedex');
        }
    }, [pokedexJumpTarget]);

    const sections = [
        { id: 'pokedex', label: 'Pokédex' },
        { id: 'types', label: 'Type Chart' },
        { id: 'natures', label: 'Natures' },
        { id: 'moves', label: 'Moves Database' },
        { id: 'abilities', label: 'Abilities' },
        { id: 'classes', label: 'Trainer Classes' },
        { id: 'trainerFeatures', label: 'Trainer Features' },
        { id: 'rules', label: 'Game Rules' },
        { id: 'exp', label: 'EXP Chart' }
    ];

    return (
        <div>
            <h2 className="section-title">Quick Reference</h2>
            <p className="section-description">
                Browse the Pokédex, type chart, moves, abilities, natures, trainer classes/features, and game rules.
            </p>

            {/* Tab Navigation — wraps into as many rows as needed, never scrolls or overflows.
                Flex-wrap (not CSS Grid) deliberately: a grid with equal-width columns forces every
                chip as wide as the widest, over-packing short labels into unreadable fixed columns
                on wide screens — flex lets each chip size to its own label and simply wrap. */}
            <div role="tablist" className="tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                {sections.map(section => (
                    <button
                        key={section.id}
                        role="tab"
                        aria-selected={activeSection === section.id}
                        className={`tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => { visitedRef.current.add(section.id); setActiveSection(section.id); }}
                        title={section.label}
                        style={{
                            // Overrides the shared .tab class's `flex:1; min-width:80px` (set at
                            // ≤1024px for other tab bars that want equal-width columns) — these
                            // chips need to size to their own label instead, or they all get
                            // stretched to an identical width too narrow for the longer labels.
                            flexGrow: 0,
                            flexShrink: 0,
                            flexBasis: 'auto',
                            minWidth: 0,
                            maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: activeSection === section.id ? 'var(--poke-orange)' : 'transparent',
                            color: activeSection === section.id ? 'white' : 'var(--poke-orange)',
                            border: activeSection === section.id ? 'none' : '1px solid var(--poke-orange)',
                            fontWeight: activeSection === section.id ? 700 : 500
                        }}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Sections — kept mounted after first visit to preserve filter/scroll state */}
            {visitedRef.current.has('pokedex')    && <div style={{ display: activeSection === 'pokedex'    ? undefined : 'none' }}><PokedexSection /></div>}
            {visitedRef.current.has('types')      && <div style={{ display: activeSection === 'types'      ? undefined : 'none' }}><TypeChartSection /></div>}
            {visitedRef.current.has('natures')    && <div style={{ display: activeSection === 'natures'    ? undefined : 'none' }}><NaturesSection /></div>}
            {visitedRef.current.has('moves')      && <div style={{ display: activeSection === 'moves'      ? undefined : 'none' }}><MovesSection /></div>}
            {visitedRef.current.has('abilities')  && <div style={{ display: activeSection === 'abilities'  ? undefined : 'none' }}><AbilitiesSection /></div>}
            {visitedRef.current.has('classes')    && <div style={{ display: activeSection === 'classes'    ? undefined : 'none' }}><TrainerClassesSection /></div>}
            {visitedRef.current.has('trainerFeatures') && <div style={{ display: activeSection === 'trainerFeatures' ? undefined : 'none' }}><TrainerFeaturesSection /></div>}
            {visitedRef.current.has('rules')      && <div style={{ display: activeSection === 'rules'      ? undefined : 'none' }}><GameRulesSection /></div>}
            {visitedRef.current.has('exp')        && <div style={{ display: activeSection === 'exp'        ? undefined : 'none' }}><ExpChartSection /></div>}
        </div>
    );
};

export default ReferenceTab;
