// ============================================================
// Pokédex Species Browser
// ============================================================
// Read-only browser for all species: search, type filter, accordion

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useGameData } from '../../contexts/index.js';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getPokemonDisplayImage, getMegaSprite, getPokemonSprite } from '../../utils/pokemonSprite.js';
import { POKEMON_TYPES } from '../../data/typeChart.js';

const STAT_LABELS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];
const STAT_KEYS   = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_COLORS = {
    hp: 'var(--stat-hp)', atk: 'var(--stat-atk)', def: 'var(--stat-def)',
    satk: 'var(--stat-satk)', sdef: 'var(--stat-sdef)', spd: 'var(--stat-spd)'
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

const TypeChip = ({ type }) => (
    <span
        className={`type-pill-single type-${type.toLowerCase()}`}
        style={{ color: getContrastTextColor(getTypeColor(type)), flexShrink: 0 }}
    >{type}</span>
);

const DualTypeDisplay = ({ types }) => {
    if (!types || types.length === 0) return null;
    if (types.length === 1) return <TypeChip type={types[0]} />;
    return (
        <div className="type-pill-dual" style={{ flexShrink: 0 }}>
            <span
                className={`type-${types[0].toLowerCase()}`}
                style={{ color: getContrastTextColor(getTypeColor(types[0])) }}
            >{types[0]}</span>
            <span
                className={`type-${types[1].toLowerCase()}`}
                style={{ color: getContrastTextColor(getTypeColor(types[1])) }}
            >{types[1]}</span>
        </div>
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

// Size chip colour
const SIZE_COLORS = {
    Fine: '#9e9e9e', Diminutive: '#9e9e9e', Tiny: '#78909c',
    Small: '#5c6bc0', Medium: '#43a047', Large: '#f57c00',
    Huge: '#e53935', Gigantic: '#b71c1c'
};
// Weight chip colour
const WEIGHT_COLORS = {
    Featherweight: '#80cbc4', Light: '#81c784',
    Medium: '#ffb74d', Heavy: '#ef9a9a', Superweight: '#ce93d8'
};

const InfoChip = ({ label, color = 'var(--bg-section)', textColor }) => (
    <span style={{
        display: 'inline-block',
        padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
        background: color, color: textColor || 'var(--text-primary)',
        border: '1px solid var(--border-light)'
    }}>{label}</span>
);

const InfoRow = ({ icon, label, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', width: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, minWidth: '64px', marginTop: '2px' }}>{label}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{children}</div>
    </div>
);

const GenderBar = ({ genderRatio }) => {
    const isGenderless = !genderRatio || (genderRatio.male === 0 && genderRatio.female === 0);
    const isUnknown    = !genderRatio;
    if (isUnknown)    return <InfoChip label="⚲ Unknown" color="var(--bg-light)" />;
    if (isGenderless) return <InfoChip label="⚲ Genderless" color="var(--bg-light)" />;
    const { male = 0, female = 0 } = genderRatio;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', background: 'var(--border-light)' }}>
                {male   > 0 && <div style={{ width: `${male}%`,   background: '#5b8dde' }} />}
                {female > 0 && <div style={{ width: `${female}%`, background: '#e86eb0' }} />}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                {male   > 0 && <span style={{ color: '#5b8dde', fontWeight: 600 }}>♂ {male}%</span>}
                {female > 0 && <span style={{ color: '#e86eb0', fontWeight: 600 }}>♀ {female}%</span>}
            </div>
        </div>
    );
};

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
        types = [],
        size,
        weight,
        genderRatio,
        eggGroups,
        diet,
        habitat,
        megaForms,
        regionalForms,
    } = species;

    const bst = getBST(species);
    const moveName = (m) => (typeof m === 'string' ? m : m?.name || '');

    // Accent color from primary type
    const accentColor = types[0] ? getTypeColor(types[0]) : '#f5a623';
    const accentTextColor = getContrastTextColor(accentColor);

    const hasAbilities  = abilities.basic?.length > 0 || abilities.adv?.length > 0 || abilities.high?.length > 0;
    const hasSkills     = skills && Object.keys(skills).length > 0;
    const hasLvMoves    = levelUpMoves.length > 0;
    const hasEggMoves   = eggMoves?.length > 0;
    const hasTutor      = tutorMoves?.length > 0;
    const hasEvo        = evolvedFrom || evolutions?.length > 0;
    const hasProfileInfo = size || weight || genderRatio !== undefined || eggGroups?.length || diet?.length || habitat?.length;

    return (
        <div style={{ background: 'var(--bg-section)', borderTop: `2px solid ${accentColor}` }}>

            {/* Pokédex Profile Info */}
            {hasProfileInfo && (
            <DetailSection>
                <SectionLabel>Pokédex Info</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px 16px' }}>

                    {/* Size + Weight */}
                    {(size || weight) && (
                        <InfoRow icon="📏" label="Size">
                            {size   && <InfoChip label={size}   color={SIZE_COLORS[size]   || '#9e9e9e'} textColor="white" />}
                            {weight && <InfoChip label={weight} color={WEIGHT_COLORS[weight] || '#bdbdbd'} textColor="white" />}
                        </InfoRow>
                    )}

                    {/* Gender Ratio */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', width: '16px', flexShrink: 0, marginTop: '1px' }}>⚥</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, minWidth: '64px', marginTop: '2px' }}>Gender</span>
                        <GenderBar genderRatio={genderRatio} />
                    </div>

                    {/* Egg Groups */}
                    {eggGroups?.length > 0 && (
                        <InfoRow icon="🥚" label="Egg Groups">
                            {eggGroups.map(g => <InfoChip key={g} label={g} color="rgba(255,193,7,0.15)" />)}
                        </InfoRow>
                    )}

                    {/* Diet */}
                    {diet?.length > 0 && (
                        <InfoRow icon="🍃" label="Diet">
                            {diet.map(d => <InfoChip key={d} label={d} color="rgba(76,175,80,0.15)" />)}
                        </InfoRow>
                    )}

                    {/* Habitat */}
                    {habitat?.length > 0 && (
                        <InfoRow icon="🗺️" label="Habitat">
                            {habitat.map(h => <InfoChip key={h} label={h} color="rgba(33,150,243,0.15)" />)}
                        </InfoRow>
                    )}
                </div>
            </DetailSection>
            )}

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

            {/* Mega Forms */}
            {megaForms?.length > 0 && (
                <DetailSection>
                    <SectionLabel>✨ Mega Forms</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {megaForms.map((form, i) => {
                            const megaBst = STAT_KEYS.reduce((sum, k) => sum + ((baseStats[k] || 0) + (form.statBoosts?.[k] || 0)), 0);
                            const megaSprite = getMegaSprite(species, form);
                            const megaAccent = form.types?.[0] ? getTypeColor(form.types[0]) : accentColor;
                            return (
                                <div key={i} style={{ borderRadius: '8px', border: `1px solid var(--border-light)`, borderTop: `3px solid ${megaAccent}`, padding: '10px', background: 'var(--bg-light)' }}>
                                    {/* Header row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        {megaSprite && (
                                            <img src={megaSprite} alt={`${species.species} ${form.name}`}
                                                style={{ width: '48px', height: '48px', imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0 }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                                                {species.species} {form.name}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {form.types?.map(t => <TypeChip key={t} type={t} />)}
                                                {form.ability && (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>· {form.ability}</span>
                                                )}
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: getContrastTextColor(megaAccent), background: megaAccent, padding: '1px 6px', borderRadius: '8px', marginLeft: 'auto' }}>BST {megaBst}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stat boosts */}
                                    {form.statBoosts && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginTop: '4px' }}>
                                            {STAT_KEYS.map((k, ki) => {
                                                const base = baseStats[k] || 0;
                                                const boost = form.statBoosts[k] || 0;
                                                const total = base + boost;
                                                return (
                                                    <div key={k} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '8px', fontWeight: 700, color: STAT_COLORS[k] }}>{STAT_LABELS[ki]}</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
                                                        {boost !== 0 && (
                                                            <div style={{ fontSize: '9px', fontWeight: 700, color: boost > 0 ? 'var(--color-success-text, #4caf50)' : 'var(--color-danger-text, #ef5350)' }}>
                                                                {boost > 0 ? `+${boost}` : boost}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DetailSection>
            )}

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
                        {Object.entries(skills).map(([name, value]) => {
                            const label = name.charAt(0).toUpperCase() + name.slice(1);
                            const isFlag = value === true;
                            return (
                                <span key={name} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                                    background: isFlag ? 'rgba(245,166,35,0.15)' : 'var(--poke-gray)',
                                    border: `1px solid ${isFlag ? 'rgba(245,166,35,0.4)' : 'var(--border-light)'}`,
                                    color: isFlag ? 'var(--poke-orange-dark)' : 'var(--text-primary)'
                                }}>
                                    {label}
                                    {!isFlag && (
                                        <span style={{
                                            fontWeight: 700, fontSize: '12px',
                                            color: 'var(--poke-orange-dark)'
                                        }}>{value}</span>
                                    )}
                                </span>
                            );
                        })}
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
                                        background: i % 2 === 0 ? 'transparent' : 'var(--bg-light)'
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
                <DetailSection last={!regionalForms?.length}>
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
            {/* Regional Forms */}
            {regionalForms?.length > 0 && (
                <DetailSection last>
                    <SectionLabel>🗺️ Regional Forms</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {regionalForms.map((form, i) => {
                            const formBst = STAT_KEYS.reduce((sum, k) => sum + (form.baseStats?.[k] || 0), 0);
                            const formSprite = getPokemonSprite({ species: species.species, regionalForm: form.name });
                            const formAccent = form.types?.[0] ? getTypeColor(form.types[0]) : accentColor;
                            const hasFormAbilities = form.abilities?.basic?.length > 0 || form.abilities?.adv?.length > 0 || form.abilities?.high?.length > 0;
                            const formMoves = form.levelUpMoves || [];
                            const hasFormEgg = form.eggMoves?.length > 0;
                            const hasFormTutor = form.tutorMoves?.length > 0;
                            return (
                                <div key={i} style={{ borderRadius: '8px', border: `1px solid var(--border-light)`, borderTop: `3px solid ${formAccent}`, padding: '10px', background: 'var(--bg-light)' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        {formSprite && (
                                            <img src={formSprite} alt={`${form.name} ${species.species}`}
                                                style={{ width: '48px', height: '48px', imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0 }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{form.name} {species.species}</div>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {form.types?.map(t => <TypeChip key={t} type={t} />)}
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: getContrastTextColor(formAccent), background: formAccent, padding: '1px 6px', borderRadius: '8px', marginLeft: 'auto' }}>BST {formBst}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Base Stats */}
                                    {form.baseStats && STAT_KEYS.map((k, ki) => (
                                        <StatBar key={k} label={STAT_LABELS[ki]} statKey={k} value={form.baseStats[k] || 0} />
                                    ))}
                                    {/* Abilities */}
                                    {hasFormAbilities && (
                                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Abilities </span>
                                            {[
                                                form.abilities?.basic?.length > 0 && <span key="b"><span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Basic </span>{form.abilities.basic.join(', ')}</span>,
                                                form.abilities?.adv?.length > 0   && <span key="a"><span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> Adv </span>{form.abilities.adv.join(', ')}</span>,
                                                form.abilities?.high?.length > 0  && <span key="h"><span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> Hidden </span>{form.abilities.high.join(', ')}</span>,
                                            ].filter(Boolean)}
                                        </div>
                                    )}
                                    {/* Level-up moves */}
                                    {formMoves.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Level-up Moves</div>
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'var(--poke-white)' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                    <tbody>
                                                        {formMoves.map((move, mi) => (
                                                            <tr key={mi} style={{ borderBottom: mi < formMoves.length - 1 ? '1px solid var(--border-light)' : 'none', background: mi % 2 === 0 ? 'transparent' : 'var(--bg-light)' }}>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right', width: '32px' }}>{move.level ?? '—'}</td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-primary)' }}>{move.name || move.move || String(move)}</td>
                                                                <td style={{ padding: '4px 8px' }}>{move.type && <TypeChip type={move.type} />}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {/* Egg & Tutor moves */}
                                    {(hasFormEgg || hasFormTutor) && (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {hasFormEgg && (
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Egg Moves</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {form.eggMoves.map((m, mi) => <Chip key={mi} label={typeof m === 'string' ? m : m?.name || String(m)} />)}
                                                    </div>
                                                </div>
                                            )}
                                            {hasFormTutor && (
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Tutor Moves</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {form.tutorMoves.map((m, mi) => <Chip key={mi} label={typeof m === 'string' ? m : m?.name || String(m)} />)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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

// ── Memoized row ─────────────────────────────────────────────
// Extracted so only the 2 rows whose isExpanded/isHovered changes actually re-render.

const PokedexRow = memo(({ species, idx, isExpanded, isHovered, onRowClick, onMouseEnter, onMouseLeave }) => {
    const rowId    = species.id ?? species.species;
    const spriteUrl = getPokemonDisplayImage(species);
    const bst      = getBST(species);

    return (
        <div style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-light)' }}>
            <button
                onClick={onRowClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '7px 12px', border: 'none', cursor: 'pointer',
                    textAlign: 'left', color: 'var(--text-primary)',
                    transition: 'background 0.12s',
                    background: isExpanded ? 'var(--bg-section)' : isHovered ? 'var(--hover-bg)' : 'transparent'
                }}
            >
                <div style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {spriteUrl && (
                        <img
                            src={spriteUrl}
                            alt={species.species}
                            style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }}
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                    )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, width: '34px', flexShrink: 0, textAlign: 'right' }}>
                    #{species.id || '?'}
                </span>
                <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {species.species}
                </span>
                <DualTypeDisplay types={species.types} />
                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                    {species.megaForms?.length > 0 && (
                        <span title={`${species.megaForms.length} Mega Form${species.megaForms.length > 1 ? 's' : ''}`} style={{ fontSize: '11px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(102,126,234,0.15)', color: 'var(--color-purple)', border: '1px solid rgba(102,126,234,0.3)' }}>M</span>
                    )}
                    {species.regionalForms?.length > 0 && (
                        <span title={`${species.regionalForms.length} Regional Form${species.regionalForms.length > 1 ? 's' : ''}`} style={{ fontSize: '11px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,152,0,0.15)', color: 'var(--poke-orange-dark, #e65100)', border: '1px solid rgba(255,152,0,0.3)' }}>R</span>
                    )}
                </div>
                <span
                    className="pokedex-bst"
                    title="Base Stat Total"
                    style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, minWidth: '44px', textAlign: 'right' }}
                >
                    {bst} BST
                </span>
                <svg
                    width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink: 0, color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
            {isExpanded && <SpeciesDetail species={species} />}
        </div>
    );
});

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
    const [page,         setPage]         = useState(0);

    const PAGE_SIZE = 50;

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
        setPage(0);
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'name' || key === 'id' ? 'asc' : 'desc'); }
    };

    const hasFilters = search || typeFilter || type2Filter || abilitySearch;
    const isSorted   = sortKey !== 'id' || sortDir !== 'asc';

    const resetAll = () => {
        setSearch(''); setTypeFilter(''); setType2Filter('');
        setAbilitySearch(''); setSortKey('id'); setSortDir('asc'); setPage(0);
    };

    // Reset page when filters change
    const prevFiltersRef = React.useRef({ search, typeFilter, type2Filter, abilitySearch });
    if (
        prevFiltersRef.current.search       !== search       ||
        prevFiltersRef.current.typeFilter   !== typeFilter   ||
        prevFiltersRef.current.type2Filter  !== type2Filter  ||
        prevFiltersRef.current.abilitySearch !== abilitySearch
    ) {
        prevFiltersRef.current = { search, typeFilter, type2Filter, abilitySearch };
        if (page !== 0) setPage(0);
    }

    const handleRowClick = useCallback((id) => setExpandedId(prev => prev === id ? null : id), []);

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

            {/* ── Sort row — full (desktop) ── */}
            <div className="pokedex-sort-full" style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px', flexShrink: 0 }}>Sort:</span>
                {SORT_OPTIONS.map(opt => {
                    const isActive = sortKey === opt.key;
                    return (
                        <button
                            key={opt.key}
                            onClick={() => handleSort(opt.key)}
                            title={`Sort by ${opt.label}`}
                            style={{
                                padding: '4px 9px', borderRadius: '6px', fontSize: '12px', fontWeight: isActive ? 700 : 500,
                                border: isActive ? '1.5px solid var(--poke-orange)' : '1px solid var(--border-light)',
                                background: isActive ? 'rgba(245,166,35,0.12)' : 'var(--poke-gray)',
                                color: isActive ? 'var(--poke-orange-dark)' : 'var(--text-secondary)',
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

            {/* ── Sort row — compact (mobile) ── */}
            <div className="pokedex-sort-mobile" style={{ display: 'none', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Sort:</span>
                <select
                    value={sortKey}
                    onChange={e => { setSortKey(e.target.value); setSortDir(e.target.value === 'name' || e.target.value === 'id' ? 'asc' : 'desc'); }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                    {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
                <button
                    onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    title="Toggle sort direction"
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--poke-orange)', background: 'rgba(245,166,35,0.12)', color: 'var(--poke-orange-dark)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
                >
                    {sortDir === 'asc' ? '▲ Asc' : '▼ Desc'}
                </button>
            </div>

            {/* ── Count + pagination info ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {filtered.length === allSpecies.length
                        ? `${allSpecies.length} species`
                        : `${filtered.length} of ${allSpecies.length} species`}
                    {type2Filter && typeFilter && typeFilter !== type2Filter && (
                        <span style={{ marginLeft: '6px', opacity: 0.75 }}>
                            ({typeFilter} + {type2Filter} dual-type)
                        </span>
                    )}
                </div>
                {filtered.length > PAGE_SIZE && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
                    </div>
                )}
            </div>

            {/* ── Species List ── */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden', background: 'var(--poke-white)' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        No species found.{' '}
                        <button onClick={resetAll} style={{ background: 'none', border: 'none', color: 'var(--poke-orange)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, padding: 0 }}>
                            Reset filters
                        </button>
                    </div>
                ) : (
                    filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((s, idx) => {
                        const rowId = s.id ?? s.species;
                        return (
                            <PokedexRow
                                key={rowId}
                                species={s}
                                idx={idx}
                                isExpanded={expandedId === rowId}
                                isHovered={hoveredId === rowId && expandedId !== rowId}
                                onRowClick={() => handleRowClick(rowId)}
                                onMouseEnter={() => setHoveredId(rowId)}
                                onMouseLeave={() => setHoveredId(null)}
                            />
                        );
                    })
                )}
            </div>

            {/* ── Pagination controls ── */}
            {filtered.length > PAGE_SIZE && (() => {
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => { setPage(0); setExpandedId(null); }}
                            disabled={page === 0}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: '12px' }}
                        >«</button>
                        <button
                            onClick={() => { setPage(p => p - 1); setExpandedId(null); }}
                            disabled={page === 0}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: '12px' }}
                        >‹ Prev</button>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px' }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => { setPage(p => p + 1); setExpandedId(null); }}
                            disabled={page >= totalPages - 1}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: '12px' }}
                        >Next ›</button>
                        <button
                            onClick={() => { setPage(totalPages - 1); setExpandedId(null); }}
                            disabled={page >= totalPages - 1}
                            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: '12px' }}
                        >»</button>
                    </div>
                );
            })()}
        </div>
    );
};

export default PokedexSection;
