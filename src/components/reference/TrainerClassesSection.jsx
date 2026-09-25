// ============================================================
// Trainer Classes Section Component
// ============================================================

import React, { useMemo, useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { useModal, useFilter } from '../../contexts/index.js';

const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };

/**
 * TrainerClassesSection - Browse the 9 Base Classes and their Advanced Classes
 * Uses ModalContext for showDetail, FilterContext for filter state
 */
const TrainerClassesSection = () => {
    const { showDetail } = useModal();
    const { trainerClassesFilter: filter, setTrainerClassesFilter: setFilter } = useFilter();
    const [hoveredClass, setHoveredClass] = useState(null);

    const allClasses = useMemo(() => Object.entries(GAME_DATA.trainerClasses || {}), []);
    const baseClasses = useMemo(() =>
        allClasses.filter(([, d]) => d.type === 'base').sort((a, b) => a[0].localeCompare(b[0])),
    [allClasses]);

    const featureCountByClass = useMemo(() => {
        const map = {};
        Object.values(GAME_DATA.features || {}).forEach(f => {
            if (f.category) map[f.category] = (map[f.category] || 0) + 1;
        });
        return map;
    }, []);

    const filteredClasses = useMemo(() => {
        return allClasses.filter(([name, data]) => {
            if (filter.type !== 'all' && data.type !== filter.type) return false;
            if (filter.search) {
                const search = filter.search.toLowerCase();
                if (!name.toLowerCase().includes(search) && !data.description?.toLowerCase().includes(search)) return false;
            }
            return true;
        });
    }, [allClasses, filter]);

    const filteredNames = useMemo(() => new Set(filteredClasses.map(([name]) => name)), [filteredClasses]);
    const totalClasses = allClasses.length;

    return (
        <div>
            <h3 style={{ marginBottom: '6px' }}>Trainer Classes ({totalClasses})</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                {baseClasses.length} Base Classes, each specializing into 7 Advanced Classes. A trainer may take a 2nd class
                (or 1st Advanced Class) at level 5, a 3rd at level 12, and a 4th at level 24 — or pick up an Advanced Class
                early through Cross-Classing at a higher cost. Click a class to see its details.
            </p>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search classes by name or description..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-medium)',
                            fontSize: '14px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />

                    <select
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="all">All Types</option>
                        <option value="base">Base Classes</option>
                        <option value="advanced">Advanced Classes</option>
                    </select>

                    {(filter.search || filter.type !== 'all') && (
                        <button
                            onClick={() => setFilter({ search: '', type: 'all' })}
                            style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: 'var(--danger-btn-start)', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredClasses.length} of {totalClasses} classes
            </div>

            {/* Classes List — grouped by Base Class family */}
            <div style={{ maxHeight: 'min(600px, 70vh)', overflowY: 'auto' }}>
                {filteredClasses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No classes found matching your search.
                    </div>
                ) : (
                    baseClasses.map(([baseName, baseData]) => {
                        const advNames = baseData.advancedClasses || [];
                        const groupNames = [baseName, ...advNames].filter(n => filteredNames.has(n));
                        if (groupNames.length === 0) return null;
                        return (
                            <div key={baseName} style={{ marginBottom: '18px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', paddingLeft: '2px' }}>
                                    {baseName} Family
                                </div>
                                {groupNames.map(name => {
                                    const data = GAME_DATA.trainerClasses[name];
                                    const isBase = data.type === 'base';
                                    return (
                                        <div
                                            key={name}
                                            style={{
                                                marginBottom: '8px',
                                                padding: '12px',
                                                background: hoveredClass === name ? 'var(--hover-bg)' : 'var(--abilities-card-bg)',
                                                borderRadius: '8px',
                                                borderLeft: `4px solid ${isBase ? 'var(--color-purple)' : 'var(--stat-satk)'}`,
                                                boxShadow: '0 1px 3px var(--abilities-card-shadow)',
                                                cursor: 'pointer',
                                                transition: 'background 0.12s'
                                            }}
                                            onClick={() => showDetail('trainerClass', name, data)}
                                            onMouseEnter={() => setHoveredClass(name)}
                                            onMouseLeave={() => setHoveredClass(null)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <strong style={{ fontSize: '14px', color: 'var(--abilities-name-text)' }}>{name}</strong>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        background: isBase ? 'var(--color-purple)' : 'var(--stat-satk)',
                                                        color: 'white'
                                                    }}>
                                                        {isBase ? 'Base' : 'Advanced'}
                                                    </span>
                                                    {isBase && (data.preferredStats || []).map(stat => (
                                                        <span key={stat} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: 'var(--tint-blue-bg)', color: 'var(--info-text)', border: '1px solid var(--tint-blue-border)' }}>
                                                            {STAT_LABELS[stat] || stat.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {featureCountByClass[name] > 0 && <span>{featureCountByClass[name]} features</span>}
                                                    <span style={{ fontSize: '16px', lineHeight: 1 }}>›</span>
                                                </div>
                                            </div>
                                            {data.description && (
                                                <div style={{ fontSize: '13px', color: 'var(--abilities-desc-text)', lineHeight: '1.4', marginTop: '4px' }}>
                                                    {data.description}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TrainerClassesSection;
