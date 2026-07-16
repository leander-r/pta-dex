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
        { id: 'rules', label: 'Game Rules' },
        { id: 'exp', label: 'EXP Chart' }
    ];

    return (
        <div>
            <h2 className="section-title">Quick Reference</h2>
            <p className="section-description">
                Browse the Pokédex, type chart, moves, abilities, natures, and game rules.
            </p>

            {/* Tab Navigation — wraps in a gradient-masked scroll container on mobile */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div role="tablist" className="tabs" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', gap: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {sections.map(section => (
                    <button
                        key={section.id}
                        role="tab"
                        aria-selected={activeSection === section.id}
                        className={`tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => { visitedRef.current.add(section.id); setActiveSection(section.id); }}
                        style={{
                            flexShrink: 0,
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
            {/* Right-edge fade hint — only visible when content overflows (mobile) */}
            <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: 0, bottom: 0, width: '32px', borderRadius: '0 10px 10px 0', background: 'linear-gradient(to right, transparent, var(--card-bg, var(--surface-bg)))' }} aria-hidden="true" />
            </div>

            {/* Content Sections — kept mounted after first visit to preserve filter/scroll state */}
            {visitedRef.current.has('pokedex')    && <div style={{ display: activeSection === 'pokedex'    ? undefined : 'none' }}><PokedexSection /></div>}
            {visitedRef.current.has('types')      && <div style={{ display: activeSection === 'types'      ? undefined : 'none' }}><TypeChartSection /></div>}
            {visitedRef.current.has('natures')    && <div style={{ display: activeSection === 'natures'    ? undefined : 'none' }}><NaturesSection /></div>}
            {visitedRef.current.has('moves')      && <div style={{ display: activeSection === 'moves'      ? undefined : 'none' }}><MovesSection /></div>}
            {visitedRef.current.has('abilities')  && <div style={{ display: activeSection === 'abilities'  ? undefined : 'none' }}><AbilitiesSection /></div>}
            {visitedRef.current.has('rules')      && <div style={{ display: activeSection === 'rules'      ? undefined : 'none' }}><GameRulesSection /></div>}
            {visitedRef.current.has('exp')        && <div style={{ display: activeSection === 'exp'        ? undefined : 'none' }}><ExpChartSection /></div>}
        </div>
    );
};

export default ReferenceTab;
