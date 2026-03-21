// ============================================================
// EXP Chart Section Component
// ============================================================

import React from 'react';
import { GAME_DATA } from '../../data/configs.js';

const ExpChartSection = () => {
    const expChart = GAME_DATA.pokemonExpChart || {};
    const levels = Object.keys(expChart).map(Number).sort((a, b) => a - b);

    return (
        <div>
            <h3>Pokémon Experience Chart</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Experience points required to reach each level.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-purple)', color: 'white' }}>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: Math.ceil(levels.length / 3) }).map((_, rowIdx) => {
                            const colSize = Math.ceil(levels.length / 3);
                            const level1 = levels[rowIdx];
                            const level2 = levels[rowIdx + colSize];
                            const level3 = levels[rowIdx + colSize * 2];

                            return (
                                <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? 'var(--bg-light)' : 'var(--input-bg)' }}>
                                    {level1 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{level1}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level1] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level1 === undefined && <><td></td><td></td></>}

                                    {level2 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid var(--border-medium)' }}>{level2}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level2] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level2 === undefined && <><td style={{ borderLeft: '2px solid var(--border-medium)' }}></td><td></td></>}

                                    {level3 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid var(--border-medium)' }}>{level3}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level3] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level3 === undefined && <><td style={{ borderLeft: '2px solid var(--border-medium)' }}></td><td></td></>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Quick Reference */}
            <div style={{ marginTop: '20px', padding: '15px', background: 'var(--tint-purple-bg)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Key Milestones</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(level => (
                        <div key={level} style={{ padding: '8px', background: 'var(--input-bg)', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-purple)' }}>Level {level}</div>
                            <div style={{ fontSize: '12px' }}>{(expChart[level] || 0).toLocaleString()} EXP</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExpChartSection;
