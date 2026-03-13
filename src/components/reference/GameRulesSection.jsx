// ============================================================
// Game Rules Section Component
// ============================================================

import React, { useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const GameRulesSection = () => {
    const [expandedSection, setExpandedSection] = useState('combat');

    const sections = [
        {
            id: 'combat',
            title: 'Combat Basics',
            content: (
                <div>
                    <h4>Turn Order</h4>
                    <ul>
                        <li>Speed determines initiative order (highest first)</li>
                        <li>Ties are resolved by Speed stat, then coin flip</li>
                    </ul>

                    <h4>Actions Per Turn</h4>
                    <ul>
                        <li><strong>Command Action:</strong> Command your Pokémon to use a move</li>
                        <li><strong>Trainer Action:</strong> Use a feature, item, or personal attack</li>
                        <li><strong>Shift Action:</strong> Move up to your Speed in meters</li>
                        <li><strong>Free Actions:</strong> Minor actions (recall, etc.)</li>
                    </ul>

                    <h4>Accuracy Rolls</h4>
                    <ul>
                        <li>Roll 1d20 to hit; meet or beat the move's AC to hit</li>
                        <li>Subtract target's Evasion from the roll</li>
                        <li>Critical Hit: roll meets or beats the move's crit range (default: 20); doubles the full damage notation (dice + fixed bonus)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'damage',
            title: 'Damage & HP',
            content: (
                <div>
                    <h4>Damage Calculation</h4>
                    <p>Total Damage = Dice Roll + Stat Bonus + STAB</p>
                    <ul>
                        <li>Physical moves use ATK stat</li>
                        <li>Special moves use SATK stat</li>
                        <li>STAB: +1 at Lv5, +2 at Lv10, etc.</li>
                    </ul>

                    <h4>HP Formula</h4>
                    <ul>
                        <li><strong>Pokemon:</strong> Level + (HP Stat x 3)</li>
                        <li><strong>Trainer:</strong> (HP Stat x 4) + (Level x 4)</li>
                    </ul>

                    <h4>Type Effectiveness</h4>
                    <ul>
                        <li>Super Effective (1 weakness): ×2 damage</li>
                        <li>Double Super Effective (2 weaknesses): ×4 damage</li>
                        <li>Resistant (1 resistance): ÷2 damage</li>
                        <li>Double Resistant (2 resistances): ÷4 damage</li>
                        <li>One weakness + one resistance: ×1 (neutral)</li>
                        <li>Immune: 0 damage</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'stats',
            title: 'Stats & Combat Stages',
            content: (
                <div>
                    <h4>Combat Stages</h4>
                    <p>Buffs and debuffs affect stats through Combat Stages (−6 to +6)</p>
                    <ul>
                        <li>Each +1 stage: +25% of original stat (additive)</li>
                        <li>Each −1 stage: −10% of original stat (additive)</li>
                        <li>At +6: 250% of original</li>
                        <li>At −6: 40% of original</li>
                    </ul>

                    <h4>Pokémon Evasion</h4>
                    <ul>
                        <li>Physical Evasion = +1 per 5 DEF (max +6) — vs Physical moves</li>
                        <li>Special Evasion = +1 per 5 SDEF (max +6) — vs Special moves</li>
                        <li>Speed Evasion = +1 per 10 SPD (max +6) — vs any move</li>
                        <li>Only one evasion score may be applied per accuracy check</li>
                        <li>Max total evasion applied to any one check: +9</li>
                    </ul>
                    <h4>Trainer Evasion</h4>
                    <ul>
                        <li>Evasion = SPD modifier (negative counts as 0, capped at +6)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'trainer',
            title: 'Trainer Rules',
            content: (
                <div>
                    <h4>Character Creation</h4>
                    <ul>
                        <li>Start at Level 0 with 30 stat points</li>
                        <li>Each stat starts at 6, cap at 14 during creation</li>
                        <li>Level up to 1 after spending points and picking a class</li>
                    </ul>

                    <h4>Level Progression</h4>
                    <ul>
                        <li>Gain stat points and features at each level</li>
                        <li>Max 1 class until Level 5</li>
                        <li>Max 2 classes from Level 5-11</li>
                        <li>Max 3 classes from Level 12-23</li>
                        <li>Max 4 classes from Level 24+</li>
                    </ul>

                    <h4>Skill Checks</h4>
                    <ul>
                        <li>No skill: Roll 1d20 plain</li>
                        <li>Skill (rank 1): 1d20 + 2 + stat modifier</li>
                        <li>Skill (rank 2): 1d20 + 4 + (2 × stat modifier)</li>
                        <li>HP skills are passive — no roll required</li>
                    </ul>
                    <h4>Stat Modifier Formula</h4>
                    <ul>
                        <li><strong>Above 10:</strong> +1 per 2 points above 10 (e.g. 12 → +1, 14 → +2)</li>
                        <li><strong>Below 10:</strong> −1 per 1 point below 10 (e.g. 9 → −1, 8 → −2, 6 → −4)</li>
                        <li>Stat 10 = modifier 0</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'capture',
            title: 'Capture Rules',
            content: (
                <div>
                    <h4>Capture Formula</h4>
                    <p>Roll 1d100 against Capture DC</p>

                    <h4>Capture Modifiers</h4>
                    <ul>
                        <li>HP remaining lowers the DC (less HP = easier to catch)</li>
                        <li>Status conditions lower the DC</li>
                        <li>Ball type modifiers are not defined in the GM Guide — ask your GM</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div>
            <h3>Game Rules Quick Reference</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                Essential rules for Pokemon Tabletop Adventures gameplay.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sections.map(section => (
                    <div
                        key={section.id}
                        style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}
                    >
                        <button
                            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                background: expandedSection === section.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa',
                                color: expandedSection === section.id ? 'white' : '#333',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>{section.title}</span>
                            <span>{expandedSection === section.id ? '' : '+'}</span>
                        </button>

                        {expandedSection === section.id && (
                            <div style={{
                                padding: '15px 20px',
                                background: 'white',
                                fontSize: '13px',
                                lineHeight: '1.6'
                            }}
                            className="game-rules-content"
                            >
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameRulesSection;
