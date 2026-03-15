// ============================================================
// Pokédex Species Browser
// ============================================================
// Read-only browser for all species: search, type filter, accordion

import React, { useState, useMemo } from 'react';
import { useGameData } from '../../contexts/index.js';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';
import { POKEMON_TYPES } from '../../data/typeChart.js';

const STAT_LABELS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];
const STAT_KEYS   = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_COLORS = {
    hp: '#4caf50', atk: '#f44336', def: '#2196f3',
    satk: '#9c27b0', sdef: '#ff9800', spd: '#00bcd4'
};

const SORT_OPTIONS = [
    { key: 'id',   label: '#'    },
    { key: 'name', label: 'Name' },
    { key: 'hp',   label: 'HP'   },
    { key: 'atk',  label: 'ATK'  },
    { key: 'def',  label: 'DEF'  },
    { key: 'satk', label: 'SATK' },
    { key: 'sdef', label: 'SDEF' },
    { key: 'spd',  label: 'SPD'  },
    { key: 'bst',  label: 'BST'  },
];

const getBST = (s) => STAT_KEYS.reduce((sum, k) => sum + (s.baseStats?.[k] || 0), 0);

// ── Sub-components ───────────────────────────────────────────

const TypeChip = ({ type }) => {
    const bg    = getTypeColor(type);
    const color = getContrastTextColor(bg);
    return (
        <span style={{
            background: bg, color, padding: '2px 8px', borderRadius: '10px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
            flexShrink: 0, display: 'inline-block'
        }}>{type}</span>
    );
};

const StatBar = ({ label, statKey, value }) => {
    const pct = Math.min(100, Math.round((value / 20) * 100));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
                width: '34px', fontSize: '10px', fontWeight: 700,
                color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0
            }}>{label}</span>
            <div style={{
                flex: 1, height: '7px',
                background: 'var(--border-medium)',
                borderRadius: '4px', overflow: 'hidden'
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: STAT_COLORS[statKey], borderRadius: '4px',
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <span style={{
                width: '22px', fontSize: '12px', fontWeight: 700,
                textAlign: 'right', flexShrink: 0, color: 'var(--text-primary)'
            }}>{value}</span>
        </div>
    );
};

const Chip = ({ label, accent }) => (
    <span style={{
        fontSize: '11px',
        background: accent ? 'rgba(245,166,35,0.12)' : 'var(--poke-gray)',
        border: `1px solid ${accent ? 'rgba(245,166,35,0.35)' : 'var(--border-light)'}`,
        color: accent ? 'var(--poke-orange-dark)' : 'var(--text-primary)',
        borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap',
        fontWeight: accent ? 700 : 500
    }}>{label}</span>
);

const SectionLabel = ({ children }) => (
    <div style={{
        fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px'
    }}>{children}</div>
);

const DetailSection = ({ children, last }) => (
    <div style={{
        padding: '12px 16px',
        borderBottom: last ? 'none' : '1px solid var(--border-light)'
    }}>{children}</div>
);

// ── Expanded panel ────────────────────────────────────────────

const SpeciesDetail = ({ species }) => {
    const {
        baseStats = {},
        abilities = {},
        skills = {},
        levelUpMoves = [],
        eggMoves,
        tutorMoves,
        evolvedFrom,
        evolutions,
        types = []
    } = species;

    const bst = getBST(species);
    const moveName = (m) => (typeof m === 'string' ? m : m?.name || '');

    // Accent color from primary type
    const accentColor = types[0] ? getTypeColor(types[0]) : '#f5a623';
    const accentTextColor = getContrastTextColor(accentColor);

    const hasAbilities = abilities.basic?.length > 0 || abilities.adv?.length > 0 || abilities.high?.length > 0;
    const hasSkills    = skills && Object.keys(skills).length > 0;
    const hasLvMoves   = levelUpMoves.length > 0;
    const hasEggMoves  = eggMoves?.length > 0;
    const hasTutor     = tutorMoves?.length > 0;
    const hasEvo       = evolvedFrom || evolutions?.length > 0;

    return (
        <div style={{ background: 'var(--bg-section)', borderTop: `2px solid ${accentColor}` }}>

            {/* Stats */}
            <DetailSection>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <SectionLabel>Base Stats</SectionLabel>
                    <span style={{
                        fontSize: '11px', fontWeight: 700, color: accentTextColor,
                        background: accentColor, padding: '2px 8px', borderRadius: '8px'
                    }}>BST {bst}</span>
                </div>
                {STAT_KEYS.map((key, i) => (
                    <StatBar key={key} label={STAT_LABELS[i]} statKey={key} value={baseStats[key] || 0} />
                ))}
            </DetailSection>

            {/* Abilities */}
            {hasAbilities && (
                <DetailSection>
                    <SectionLabel>Abilities</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        {abilities.basic?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Basic </span>
                                {abilities.basic.join(', ')}
                            </div>
                        )}
                        {abilities.adv?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Advanced </span>
                                {abilities.adv.join(', ')}
                            </div>
                        )}
                        {abilities.high?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Hidden </span>
                                {abilities.high.join(', ')}
                            </div>
                        )}
                    </div>
                </DetailSection>
            )}

            {/* Skills */}
            {hasSkills && (
                <DetailSection>
                    <SectionLabel>Skills</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {Object.entries(skills).map(([name, value]) => (
                            <Chip key={name} label={`${name.charAt(0).toUpperCase() + name.slice(1)} ${value}`} />
                        ))}
                    </div>
                </DetailSection>
            )}

            {/* Level-up Moves */}
            {hasLvMoves && (
                <DetailSection>
                    <SectionLabel>Level-up Moves</SectionLabel>
                    <div style={{
                        maxHeight: '200px', overflowY: 'auto',
                        border: '1px solid var(--border-light)', borderRadius: '6px',
                        background: 'var(--poke-white)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-section)' }}>
                                    <th style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)', width: '36px' }}>Lv</th>
                                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Move</th>
                                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levelUpMoves.map((move, i) => (
                                    <tr key={i} style={{
                                        borderBottom: i < levelUpMoves.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                                    }}>
                                        <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                                            {move.level ?? '—'}
                                        </td>
                                        <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {move.name || moveName(move)}
                                        </td>
                                        <td style={{ padding: '5px 8px' }}>
                                            {move.type && <TypeChip type={move.type} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

            {/* Egg & Tutor Moves */}
            {(hasEggMoves || hasTutor) && (
                <DetailSection>
                    {hasEggMoves && (
                        <div style={{ marginBottom: hasTutor ? '10px' : 0 }}>
                            <SectionLabel>Egg Moves</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {eggMoves.map((m, i) => <Chip key={i} label={moveName(m)} />)}
                            </div>
                        </div>
                    )}
                    {hasTutor && (
                        <div>
                            <SectionLabel>Tutor Moves</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {tutorMoves.map((m, i) => <Chip key={i} label={moveName(m)} />)}
                            </div>
                        </div>
                    )}
                </DetailSection>
            )}

            {/* Evolution */}
            {hasEvo && (
                <DetailSection last>
                    <SectionLabel>Evolution</SectionLabel>
                    <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                        {evolvedFrom && (
                            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                                ← Evolves from{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>
                                    {typeof evolvedFrom === 'string' ? evolvedFrom : (evolvedFrom.species || evolvedFrom.name || String(evolvedFrom))}
                                </strong>
                            </div>
                        )}
                        {evolutions?.length > 0 && evolutions.map((evo, i) => (
                            <div key={i}>
                                {'→ '}
                                <strong>{evo.into || evo.species || evo.name || String(evo)}</strong>
                                {evo.level && <span style={{ color: 'var(--text-muted)' }}>{` (Lv. ${evo.level})`}</span>}
                                {evo.condition && <span style={{ color: 'var(--text-muted)' }}>{` — ${evo.condition}`}</span>}
                            </div>
                        ))}
                    </div>
                </DetailSection>
            )}
        </div>
    );
};

// ── Shared input/select style ─────────────────────────────────

const inputStyle = {
    padding: '7px 10px', borderRadius: '8px',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)', fontSize: '13px',
    color: 'var(--text-primary)', outline: 'none',
    boxSizing: 'border-box', width: '100%'
};

// ── Main component ────────────────────────────────────────────

const PokedexSection = () => {
    const { pokedex, customSpecies, pokedexLoading } = useGameData();

    const [search,       setSearch]       = useState('');
    const [typeFilter,   setTypeFilter]   = useState('');
    const [type2Filter,  setType2Filter]  = useState('');
    const [abilitySearch,setAbilitySearch]= useState('');
    const [sortKey,      setSortKey]      = useState('id');
    const [sortDir,      setSortDir]      = useState('asc');
    const [expandedId,   setExpandedId]   = useState(null);
    const [hoveredId,    setHoveredId]    = useState(null);

    const allSpecies = useMemo(() =>
        [...(pokedex || []), ...(customSpecies || [])],
        [pokedex, customSpecies]
    );

    const filtered = useMemo(() => {
        const nameLower    = search.toLowerCase();
        const abilityLower = abilitySearch.toLowerCase();

        return allSpecies
            .filter(s => {
                if (search && !s.species?.toLowerCase().includes(nameLower)) return false;
                if (typeFilter && !s.types?.includes(typeFilter)) return false;
                if (type2Filter && !s.types?.includes(type2Filter)) return false;
                if (abilitySearch) {
                    const allAbilities = [
                        ...(s.abilities?.basic || []),
                        ...(s.abilities?.adv   || []),
                        ...(s.abilities?.high  || []),
                    ];
                    if (!allAbilities.some(a => a.toLowerCase().includes(abilityLower))) return false;
                }
                return true;
            })
            .sort((a, b) => {
                let va, vb;
                if (sortKey === 'id')   { va = a.id || 0;         vb = b.id || 0; }
                else if (sortKey === 'name') { va = a.species || ''; vb = b.species || ''; }
                else if (sortKey === 'bst') { va = getBST(a);     vb = getBST(b); }
                else { va = a.baseStats?.[sortKey] || 0; vb = b.baseStats?.[sortKey] || 0; }
                const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
                return sortDir === 'asc' ? cmp : -cmp;
            });
    }, [allSpecies, search, typeFilter, type2Filter, abilitySearch, sortKey, sortDir]);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'name' || key === 'id' ? 'asc' : 'desc'); }
    };

    const hasFilters = search || typeFilter || type2Filter || abilitySearch;
    const isSorted   = sortKey !== 'id' || sortDir !== 'asc';

    const resetAll = () => {
        setSearch(''); setTypeFilter(''); setType2Filter('');
        setAbilitySearch(''); setSortKey('id'); setSortDir('asc');
    };

    const handleRowClick = (id) => setExpandedId(prev => prev === id ? null : id);

    if (pokedexLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Loading Pokédex…
            </div>
        );
    }

    return (
        <div>
            {/* ── Filter row ── */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {/* Name search */}
                <div style={{ flex: '2 1 160px', position: 'relative', minWidth: '140px' }}>
                    <input
                        type="text"
                        placeholder="Search species…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, paddingRight: search ? '28px' : '10px' }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1, padding: '2px' }}
                        >×</button>
                    )}
                </div>

                {/* Type 1 */}
                <div style={{ flex: '1 1 110px', minWidth: '100px' }}>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
                        <option value="">All Types</option>
                        {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Type 2 */}
                <div style={{ flex: '1 1 110px', minWidth: '100px' }}>
                    <select value={type2Filter} onChange={e => setType2Filter(e.target.value)} style={{ ...inputStyle, opacity: type2Filter ? 1 : 0.7 }}>
                        <option value="">+ 2nd Type</option>
                        {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Ability search */}
                <div style={{ flex: '1 1 130px', position: 'relative', minWidth: '120px' }}>
                    <input
                        type="text"
                        placeholder="Ability…"
                        value={abilitySearch}
                        onChange={e => setAbilitySearch(e.target.value)}
                        style={{ ...inputStyle, paddingRight: abilitySearch ? '28px' : '10px' }}
                    />
                    {abilitySearch && (
                        <button
                            onClick={() => setAbilitySearch('')}
                            aria-label="Clear ability filter"
                            style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1, padding: '2px' }}
                        >×</button>
                    )}
                </div>

                {/* Reset button — only shown when something is active */}
                {(hasFilters || isSorted) && (
                    <button
                        onClick={resetAll}
                        title="Reset all filters and sort"
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        ↺ Reset
                    </button>
                )}
            </div>

            {/* ── Sort row ── */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px', flexShrink: 0 }}>Sort:</span>
                {SORT_OPTIONS.map(opt => {
                    const isActive = sortKey === opt.key;
                    return (
                        <button
                            key={opt.key}
                            onClick={() => handleSort(opt.key)}
                            title={`Sort by ${opt.label}`}
                            style={{
                                padding: '4px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: isActive ? 700 : 500,
                                border: isActive ? '1.5px solid var(--poke-orange, #f5a623)' : '1px solid var(--border-light)',
                                background: isActive ? 'rgba(245,166,35,0.12)' : 'var(--poke-gray)',
                                color: isActive ? 'var(--poke-orange-dark, #c47d00)' : 'var(--text-secondary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                                transition: 'all 0.1s'
                            }}
                        >
                            {opt.label}
                            {isActive && (
                                <span style={{ fontSize: '10px', lineHeight: 1 }}>
                                    {sortDir === 'asc' ? '▲' : '▼'}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Count ── */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {filtered.length === allSpecies.length
                    ? `${allSpecies.length} species`
                    : `${filtered.length} of ${allSpecies.length} species`}
                {type2Filter && typeFilter && typeFilter !== type2Filter && (
                    <span style={{ marginLeft: '6px', opacity: 0.75 }}>
                        ({typeFilter} + {type2Filter} dual-type)
                    </span>
                )}
            </div>

            {/* ── Species List ── */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden', background: 'var(--poke-white)' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        No species found.{' '}
                        <button onClick={resetAll} style={{ background: 'none', border: 'none', color: 'var(--poke-orange, #f5a623)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, padding: 0 }}>
                            Reset filters
                        </button>
                    </div>
                ) : (
                    filtered.map((s, idx) => {
                        const rowId      = s.id ?? s.species;
                        const isExpanded = expandedId === rowId;
                        const isHovered  = hoveredId === rowId && !isExpanded;
                        const spriteUrl  = getPokemonDisplayImage(s);
                        const bst        = getBST(s);

                        return (
                            <div
                                key={rowId}
                                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-light)' }}
                            >
                                {/* Collapsed row */}
                                <button
                                    onClick={() => handleRowClick(rowId)}
                                    onMouseEnter={() => setHoveredId(rowId)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '7px 12px', border: 'none', cursor: 'pointer',
                                        textAlign: 'left', color: 'var(--text-primary)',
                                        transition: 'background 0.12s',
                                        background: isExpanded
                                            ? 'var(--bg-section)'
                                            : isHovered
                                                ? 'var(--hover-bg)'
                                                : 'transparent'
                                    }}
                                >
                                    {/* Sprite */}
                                    <div style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {spriteUrl && (
                                            <img
                                                src={spriteUrl}
                                                alt={s.species}
                                                style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                    </div>
                                    {/* Dex # */}
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, width: '34px', flexShrink: 0, textAlign: 'right' }}>
                                        #{s.id || '?'}
                                    </span>
                                    {/* Name */}
                                    <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0 }}>
                                        {s.species}
                                    </span>
                                    {/* Types */}
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {(s.types || []).map(t => <TypeChip key={t} type={t} />)}
                                    </div>
                                    {/* BST */}
                                    <span
                                        title="Base Stat Total"
                                        style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, minWidth: '44px', textAlign: 'right' }}
                                    >
                                        {bst} BST
                                    </span>
                                    {/* Chevron */}
                                    <svg
                                        width="13" height="13" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2.5"
                                        style={{ flexShrink: 0, color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>

                                {/* Expanded panel */}
                                {isExpanded && <SpeciesDetail species={s} />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PokedexSection;
