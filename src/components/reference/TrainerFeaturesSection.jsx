// ============================================================
// Trainer Features Section Component
// ============================================================
// Read-only browse of the full Features catalog. For managing a
// trainer's own features, see components/trainer/TrainerFeatures.jsx.

import React, { useMemo, useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { useModal, useFilter } from '../../contexts/index.js';

const GENERAL_CATEGORIES = ['General', 'General (Free)', 'Arms'];

/**
 * TrainerFeaturesSection - Display and search the full trainer features database
 * Uses ModalContext for showDetail, FilterContext for filter state
 */
const TrainerFeaturesSection = () => {
    const { showDetail } = useModal();
    const { trainerFeaturesFilter: filter, setTrainerFeaturesFilter: setFilter } = useFilter();
    const [hoveredFeature, setHoveredFeature] = useState(null);

    const allFeatures = useMemo(() => Object.entries(GAME_DATA.features || {}), []);

    const { generalCats, baseClassCats, advClassCats } = useMemo(() => {
        const cats = new Set();
        allFeatures.forEach(([, f]) => { if (f.category) cats.add(f.category); });
        const general = GENERAL_CATEGORIES.filter(c => cats.has(c));
        const base = [];
        const adv = [];
        cats.forEach(c => {
            if (GENERAL_CATEGORIES.includes(c)) return;
            const classData = GAME_DATA.trainerClasses?.[c];
            if (classData?.type === 'base') base.push(c);
            else if (classData?.type === 'advanced') adv.push(c);
        });
        base.sort();
        adv.sort();
        return { generalCats: general, baseClassCats: base, advClassCats: adv };
    }, [allFeatures]);

    const filteredFeatures = useMemo(() => {
        return allFeatures
            .filter(([name, data]) => {
                if (filter.category !== 'all' && data.category !== filter.category) return false;
                if (filter.search) {
                    const search = filter.search.toLowerCase();
                    if (!name.toLowerCase().includes(search) &&
                        !data.effect?.toLowerCase().includes(search) &&
                        !data.description?.toLowerCase().includes(search)) return false;
                }
                return true;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [allFeatures, filter]);

    const totalFeatures = allFeatures.length;

    return (
        <div>
            <h3 style={{ marginBottom: '6px' }}>Trainer Features ({totalFeatures})</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Every Trainer Feature, including each class's Class Features. Class Features (marked "Base") come in a pair
                the moment a class is taken. Click a feature to see its full prerequisites, frequency, and effect.
            </p>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search features by name or effect..."
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
                        value={filter.category}
                        onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="all">All Categories</option>
                        <optgroup label="━━ General ━━">
                            {generalCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </optgroup>
                        <optgroup label="━━ Base Classes ━━">
                            {baseClassCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </optgroup>
                        <optgroup label="━━ Advanced Classes ━━">
                            {advClassCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </optgroup>
                    </select>

                    {(filter.search || filter.category !== 'all') && (
                        <button
                            onClick={() => setFilter({ search: '', category: 'all' })}
                            style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: 'var(--danger-btn-start)', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredFeatures.length} of {totalFeatures} features
            </div>

            {/* Features List */}
            <div style={{ maxHeight: 'min(550px, 65vh)', overflowY: 'auto' }}>
                {filteredFeatures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No features found matching your search.
                    </div>
                ) : (
                    filteredFeatures.map(([name, data]) => (
                        <div
                            key={name}
                            style={{
                                marginBottom: '8px',
                                padding: '12px',
                                background: hoveredFeature === name ? 'var(--hover-bg)' : 'var(--abilities-card-bg)',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${data.category === 'General (Free)' ? 'var(--poke-orange)' : 'var(--color-purple)'}`,
                                boxShadow: '0 1px 3px var(--abilities-card-shadow)',
                                cursor: 'pointer',
                                transition: 'background 0.12s'
                            }}
                            onClick={() => showDetail('feature', name, data)}
                            onMouseEnter={() => setHoveredFeature(name)}
                            onMouseLeave={() => setHoveredFeature(null)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '14px', color: 'var(--abilities-name-text)' }}>{name}</strong>
                                    {data.category && (
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: 'var(--tint-purple-bg)', color: 'var(--color-purple)', border: '1px solid var(--tint-purple-border)' }}>
                                            {data.category}
                                        </span>
                                    )}
                                    {data.isBase && (
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: 'var(--poke-orange)', color: 'white' }}>
                                            Base
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {data.frequency && <span>{data.frequency}</span>}
                                    <span style={{ fontSize: '16px', lineHeight: 1 }}>›</span>
                                </div>
                            </div>
                            {data.prerequisites && (
                                <div style={{ fontSize: '12px', color: 'var(--poke-orange-dark)', marginTop: '4px' }}>
                                    Requires: {data.prerequisites}
                                </div>
                            )}
                            {(data.effect || data.description) && (
                                <div style={{ fontSize: '13px', color: 'var(--abilities-desc-text)', lineHeight: '1.4', marginTop: '4px' }}>
                                    {(() => {
                                        const text = data.effect || data.description;
                                        return text.length > 150 ? text.substring(0, 150) + '...' : text;
                                    })()}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TrainerFeaturesSection;
