// ============================================================
// Pokemon Card Component
// ============================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP, calculateSTAB, getBaseRelationViolations, applyNature } from '../../utils/dataUtils.js';
import { exportSinglePokemon, copyPokemonToClipboard } from '../../utils/exportUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useModal, usePokemonContext, useUI, useData } from '../../contexts/index.js';
import { buildPokemonSkills } from '../../contexts/PokemonContext.jsx';
import { MAX_NATURAL_MOVES, MAX_TAUGHT_MOVES, MAX_TOTAL_MOVES } from '../../data/constants.js';
import { getPokemonDisplayImage, getPokemonSprite } from '../../utils/pokemonSprite.js';

import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { STATUS_CONDITIONS } from '../../data/statusConditions.js';

const PokemonCard = ({
    // Pokemon-specific props (must be passed per-card)
    pokemon,
    isEditing,
    setEditing,
    updatePokemon,
    restorePokemon,
    deletePokemon,
    isInParty,
    canMoveToParty,
    onMoveToParty,
    onMoveToReserve,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    // These props are kept for backward compatibility during migration
    evolvePokemon,
    devolvePokemon,
    // Drag-and-drop props
    isDragging,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    // Compare mode props
    compareMode,
    isCompareSelected,
    onToggleCompare
}) => {
    // Get shared state from contexts
    const { pokedex, pokedexLoading, GAME_DATA, customSpecies, setCustomSpecies } = useGameData();
    const { showDetail, setShowCustomSpeciesModal, setEditingCustomSpeciesId, setShowMoveLearnModal, setMoveLearnData, showConfirm } = useModal();
    const { getEvolutionOptions } = usePokemonContext();
    const { showHelp } = useUI();
    const { inventory } = useData();
    const [editTab, setEditTab] = useState('info');
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [speciesTypeFilter, setSpeciesTypeFilter] = useState('all');
    const [speciesSort, setSpeciesSort] = useState('name'); // 'name', 'bst-high', 'bst-low', 'id'
    const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
    // Move selection state
    const [moveSearch, setMoveSearch] = useState('');
    const [moveTypeFilter, setMoveTypeFilter] = useState('all');
    const [moveCategoryFilter, setMoveCategoryFilter] = useState('all');
    const [moveSourceFilter, setMoveSourceFilter] = useState('all'); // 'all'|'levelup'|'tutor'|'egg'
    const [showMoveDropdown, setShowMoveDropdown] = useState(true);
    // Held item selection state
    const [heldItemSearch, setHeldItemSearch] = useState('');
    const [showHeldItemDropdown, setShowHeldItemDropdown] = useState(false);
    // Collapsed view expanded sections
    const [expandedSection, setExpandedSection] = useState(null); // 'abilities', 'moves', 'skills', or null
    // Regional form selection state
    const [showRegionalFormSelect, setShowRegionalFormSelect] = useState(false);
    const [pendingSpeciesData, setPendingSpeciesData] = useState(null);
    // Info tab — contest section collapsed by default
    const [showContestSection, setShowContestSection] = useState(false);

    // Snapshot taken when editing opens — used to revert on Cancel.
    // Only captured once per edit session (not updated as the user types).
    const [snapshot, setSnapshot] = useState(null);
    const snapshotTaken = useRef(false);
    useEffect(() => {
        if (isEditing && !snapshotTaken.current) {
            snapshotTaken.current = true;
            setSnapshot({ ...pokemon });
        } else if (!isEditing) {
            snapshotTaken.current = false;
            setSnapshot(null);
        }
        // Intentionally omit `pokemon` — we want the state at edit-open, not on every change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    // P22: Close regional form overlay on Escape
    useEffect(() => {
        if (!showRegionalFormSelect) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                setShowRegionalFormSelect(false);
                setPendingSpeciesData(null);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [showRegionalFormSelect]);

    const actualStats = useMemo(() => getActualStats(pokemon), [pokemon]);
    const maxHP = useMemo(() => calculatePokemonHP(pokemon), [pokemon]);
    const currentHP = maxHP - (pokemon.currentDamage || 0);
    const stabBonus = useMemo(() => calculateSTAB(pokemon.level || 1), [pokemon.level]);

    const primaryType = pokemon.types?.[0] || 'Normal';
    const secondaryType = pokemon.types?.[1] || null;
    const primaryColor = getTypeColor(primaryType);
    const secondaryColor = secondaryType ? getTypeColor(secondaryType) : primaryColor;
    // For backwards compatibility
    const borderColor = primaryColor;

    // Pokemon type colors for filter chips
    const pokemonTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];

    // Calculate base stat total
    const getBaseStatTotal = (pokemon) => {
        if (!pokemon.baseStats) return 0;
        const stats = pokemon.baseStats;
        return (stats.hp || 0) + (stats.atk || 0) + (stats.def || 0) + (stats.satk || 0) + (stats.sdef || 0) + (stats.spd || 0);
    };

    // Filter and sort species for selection (includes custom species)
    const filteredSpecies = useMemo(() => {
        if (!pokedex) return [];

        // Combine pokedex with custom species
        let results = [...pokedex, ...(customSpecies || [])];

        // Apply type filter (check both base form and regional forms)
        if (speciesTypeFilter !== 'all') {
            results = results.filter(p => {
                // Check base form types
                const baseMatch = p.types && p.types.some(t => t.toLowerCase() === speciesTypeFilter.toLowerCase());
                if (baseMatch) return true;

                // Check regional form types
                if (p.regionalForms) {
                    return p.regionalForms.some(form =>
                        form.types && form.types.some(t => t.toLowerCase() === speciesTypeFilter.toLowerCase())
                    );
                }
                return false;
            });
        }

        // Apply search filter (check species name and regional form names)
        if (speciesSearch) {
            const search = speciesSearch.toLowerCase();
            results = results.filter(p => {
                // Check species name
                if (p.species.toLowerCase().includes(search)) return true;

                // Check regional form names (e.g., "Alolan", "Galarian")
                if (p.regionalForms) {
                    return p.regionalForms.some(form =>
                        form.name && form.name.toLowerCase().includes(search)
                    );
                }
                return false;
            });
        }

        // Apply sorting (custom species first when sorting by name)
        results.sort((a, b) => {
            // Custom species always come first
            if (a.isCustom && !b.isCustom) return -1;
            if (!a.isCustom && b.isCustom) return 1;

            switch (speciesSort) {
                case 'name':
                    return a.species.localeCompare(b.species);
                case 'bst-high':
                    return getBaseStatTotal(b) - getBaseStatTotal(a);
                case 'bst-low':
                    return getBaseStatTotal(a) - getBaseStatTotal(b);
                case 'id':
                    return (a.id || 0) - (b.id || 0);
                default:
                    return a.species.localeCompare(b.species);
            }
        });

        return results;
    }, [pokedex, customSpecies, speciesSearch, speciesTypeFilter, speciesSort]);

    // Filter held items from inventory for selection
    const filteredHeldItems = useMemo(() => {
        const holdable = (inventory || []).filter(item =>
            typeof item.type === 'string' && /held|hold/i.test(item.type) && (item.quantity ?? 1) > 0
        );
        if (!heldItemSearch) return holdable;
        const q = heldItemSearch.toLowerCase();
        return holdable.filter(item =>
            item.name.toLowerCase().includes(q) || (item.effect || '').toLowerCase().includes(q)
        );
    }, [heldItemSearch, inventory]);

    // Filter and sort moves for selection
    const filteredMoves = useMemo(() => {
        if (!GAME_DATA?.moves) return [];

        let moves;
        let levelUpLevels = {}; // track level for level-up moves

        if (moveSourceFilter === 'levelup') {
            const available = pokemon.availableLevelUpMoves || [];
            available.forEach(m => { levelUpLevels[m.move] = m.level; });
            moves = available
                .map(m => [m.move, GAME_DATA.moves[m.move] || { type: m.type, category: 'Physical' }])
                .filter(([name]) => name);
            // Sort by level, then alphabetically
            moves.sort((a, b) => (levelUpLevels[a[0]] ?? 999) - (levelUpLevels[b[0]] ?? 999) || a[0].localeCompare(b[0]));
        } else if (moveSourceFilter === 'tutor') {
            const available = pokemon.availableTutorMoves || [];
            moves = available
                .map(name => [name, GAME_DATA.moves[name] || {}])
                .filter(([name]) => name);
            moves.sort((a, b) => a[0].localeCompare(b[0]));
        } else if (moveSourceFilter === 'egg') {
            const available = pokemon.availableEggMoves || [];
            moves = available
                .map(name => [name, GAME_DATA.moves[name] || {}])
                .filter(([name]) => name);
            moves.sort((a, b) => a[0].localeCompare(b[0]));
        } else {
            moves = Object.entries(GAME_DATA.moves);
            moves.sort((a, b) => a[0].localeCompare(b[0]));
        }

        // Apply type filter
        if (moveTypeFilter !== 'all') {
            moves = moves.filter(([_, data]) =>
                data.type && data.type.toLowerCase() === moveTypeFilter.toLowerCase()
            );
        }

        // Apply category filter
        if (moveCategoryFilter !== 'all') {
            moves = moves.filter(([_, data]) =>
                data.category && data.category.toLowerCase() === moveCategoryFilter.toLowerCase()
            );
        }

        // Apply search filter
        if (moveSearch) {
            const search = moveSearch.toLowerCase();
            moves = moves.filter(([name, data]) =>
                name.toLowerCase().includes(search) ||
                (data.effect || '').toLowerCase().includes(search)
            );
        }

        // Cap 'all' at 100 to avoid rendering thousands of rows; source-filtered lists are already small
        if (moveSourceFilter === 'all') moves = moves.slice(0, 100);

        // Attach level info for level-up moves so the render can display it
        return moves.map(([name, data]) => [name, data, levelUpLevels[name]]);
    }, [moveSearch, moveTypeFilter, moveCategoryFilter, moveSourceFilter, GAME_DATA, pokemon.availableLevelUpMoves, pokemon.availableTutorMoves, pokemon.availableEggMoves]);

    // Helper function to add a move with specified source (natural/taught)
    const addMoveWithSource = (moveName, moveData, source) => {
        // Check if already knows move
        const alreadyKnows = pokemon.moves?.some(m =>
            m.name?.toLowerCase() === moveName?.toLowerCase()
        );
        if (alreadyKnows) {
            toast.warning(`${pokemon.name || pokemon.species} already knows ${moveName}!`);
            return;
        }

        // Check move limits based on source
        const naturalCount = pokemon.moves?.filter(m => m.source === 'natural').length || 0;
        const taughtCount = pokemon.moves?.filter(m => m.source === 'taught').length || 0;

        // If trying to add a natural move when at limit, show replacement modal
        if (source === 'natural' && (naturalCount >= MAX_NATURAL_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES)) {
            if (naturalCount === 0) {
                toast.warning('Cannot add natural move - no natural moves to replace.');
                return;
            }
            // Use the shared MoveLearnModal
            setMoveLearnData({
                pokemonId: pokemon.id,
                pokemonName: pokemon.name || pokemon.species,
                newMove: {
                    move: moveName,
                    type: moveData.type,
                    category: moveData.category,
                    damage: moveData.damage,
                    frequency: moveData.frequency,
                    range: moveData.range,
                    effect: moveData.effect,
                    source: source
                },
                currentMoves: pokemon.moves || [],
                inParty: isInParty,
                source: source
            });
            setShowMoveLearnModal(true);
            return;
        }

        // If trying to add a taught move when at limit, show replacement modal
        if (source === 'taught' && (taughtCount >= MAX_TAUGHT_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES)) {
            if (taughtCount === 0) {
                toast.warning('Cannot add taught move - no taught moves to replace.');
                return;
            }
            // Use the shared MoveLearnModal
            setMoveLearnData({
                pokemonId: pokemon.id,
                pokemonName: pokemon.name || pokemon.species,
                newMove: {
                    move: moveName,
                    type: moveData.type,
                    category: moveData.category,
                    damage: moveData.damage,
                    frequency: moveData.frequency,
                    range: moveData.range,
                    effect: moveData.effect,
                    source: source
                },
                currentMoves: pokemon.moves || [],
                inParty: isInParty,
                source: source
            });
            setShowMoveLearnModal(true);
            return;
        }

        updatePokemon({
            moves: [...(pokemon.moves || []), {
                name: moveName,
                type: moveData.type,
                category: moveData.category,
                damage: moveData.damage,
                frequency: moveData.frequency,
                range: moveData.range,
                effect: moveData.effect,
                source: source
            }]
        });

        setMoveSearch('');
        setMoveTypeFilter('all');
        setMoveCategoryFilter('all');
    };

    // Calculate current move counts for UI
    const naturalMoveCount = pokemon.moves?.filter(m => m.source === 'natural').length || 0;
    const taughtMoveCount = pokemon.moves?.filter(m => m.source === 'taught').length || 0;

    // Get all available abilities from species data
    const getAvailableAbilities = (speciesData) => {
        const abilities = [];
        if (speciesData?.abilities) {
            if (speciesData.abilities.basic) {
                speciesData.abilities.basic.forEach(a => abilities.push({ name: a, type: 'Basic' }));
            }
            if (speciesData.abilities.adv) {
                speciesData.abilities.adv.forEach(a => abilities.push({ name: a, type: 'Advanced' }));
            }
            if (speciesData.abilities.high) {
                speciesData.abilities.high.forEach(a => abilities.push({ name: a, type: 'High' }));
            }
        }
        return abilities;
    };

    // Derive available abilities from pokedex if not stored on pokemon
    const derivedAbilities = useMemo(() => {
        if (pokemon.availableAbilities && pokemon.availableAbilities.length > 0) {
            return pokemon.availableAbilities;
        }
        if (pokedex && pokemon.species) {
            const speciesData = pokedex.find(p => p.species === pokemon.species);
            if (speciesData) {
                return getAvailableAbilities(speciesData);
            }
        }
        return [];
    }, [pokemon.availableAbilities, pokemon.species, pokedex]);

    const handleSelectSpecies = (speciesData) => {
        const doApply = () => {
            // Check if species has regional forms - let user choose
            if (speciesData.regionalForms && speciesData.regionalForms.length > 0) {
                setPendingSpeciesData(speciesData);
                setShowRegionalFormSelect(true);
                setShowSpeciesDropdown(false);
                return;
            }
            // No regional forms, apply directly
            applySpeciesForm(speciesData, null);
        };

        // Confirm species change if one is already set (would reset moves/abilities)
        if (pokemon.species && pokemon.species !== speciesData.species) {
            showConfirm({
                title: 'Change Species?',
                message: `Change species from ${pokemon.species} to ${speciesData.species}? This will reset abilities and starting moves.`,
                confirmLabel: 'Change',
                danger: true,
                onConfirm: doApply
            });
        } else {
            doApply();
        }
    };

    const applySpeciesForm = (speciesData, regionalForm) => {
        const isRegional = regionalForm && !regionalForm.isBase;
        const formData = isRegional ? regionalForm : null;

        // Use form-specific data if regional, otherwise use base species data
        const types = formData?.types || speciesData.types || [];
        const baseStats = formData?.baseStats || speciesData.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };
        const abilities = formData?.abilities || speciesData.abilities;
        const levelUpMoves = formData?.levelUpMoves || speciesData.levelUpMoves || [];

        // Build available abilities from the correct form
        const availableAbilities = [];
        if (abilities) {
            if (abilities.basic) abilities.basic.forEach(a => availableAbilities.push({ name: a, tier: 'Basic' }));
            if (abilities.adv) abilities.adv.forEach(a => availableAbilities.push({ name: a, tier: 'Advanced' }));
            if (abilities.high) abilities.high.forEach(a => availableAbilities.push({ name: a, tier: 'High' }));
        }

        const initialAbilities = availableAbilities.length > 0 ? [availableAbilities[0].name] : [];

        // Auto-add starting moves (level 0 and 1) as natural moves
        const startingMoves = levelUpMoves
            .filter(m => m.level <= 1)
            .slice(0, MAX_NATURAL_MOVES)
            .map(m => {
                const moveData = GAME_DATA?.moves?.[m.move];
                return {
                    name: m.move,
                    source: 'natural',
                    learnedAtLevel: m.level,
                    type: moveData?.type || 'Normal'
                };
            });

        updatePokemon({
            species: speciesData.species,
            name: pokemon.name === 'New Pokemon' || !pokemon.name ? speciesData.species : pokemon.name,
            types: types,
            baseStats: baseStats,
            abilities: initialAbilities,
            availableAbilities: availableAbilities,
            availableLevelUpMoves: levelUpMoves,
            moves: startingMoves,
            regionalForm: isRegional ? regionalForm.name : null,
            pokemonSkills: buildPokemonSkills(speciesData.skills)
        });
        setSpeciesSearch('');
        setShowSpeciesDropdown(false);
        setShowRegionalFormSelect(false);
        setPendingSpeciesData(null);
        setSpeciesTypeFilter('all');
    };

    // Collapsed view
    if (!isEditing) {
        return (
            <div
                className="pokemon-card pokemon-card-collapsed"
                draggable={!compareMode}
                onDragStart={!compareMode ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(pokemon.id); } : undefined}
                onDragOver={!compareMode ? (e) => { e.preventDefault(); onDragOver?.(pokemon.id); } : undefined}
                onDrop={!compareMode ? (e) => { e.preventDefault(); onDrop?.(pokemon.id); } : undefined}
                onDragEnd={!compareMode ? () => onDragEnd?.() : undefined}
                style={{
                    '--type-primary': primaryColor,
                    '--type-secondary': secondaryColor,
                    '--type-shadow-color': `${primaryColor}33`,
                    borderLeft: `4px solid ${primaryColor}`,
                    borderRight: secondaryType ? `4px solid ${secondaryColor}` : 'none',
                    backgroundImage: secondaryType
                        ? `linear-gradient(to right, ${primaryColor}12 0%, transparent 35%, transparent 65%, ${secondaryColor}12 100%)`
                        : `linear-gradient(to right, ${primaryColor}12 0%, transparent 35%)`,
                    opacity: isDragging ? 0.5 : 1,
                    transform: isDragging ? 'scale(0.98)' : 'none',
                    outline: isDragOver ? '2px dashed var(--color-purple)' : 'none',
                    transition: 'opacity 0.2s, outline 0.1s, transform 0.1s'
                }}
                onClick={() => { if (!compareMode) setEditing(true); }}
            >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Drag grip handle or Compare checkbox */}
                    {compareMode ? (
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggleCompare?.(pokemon.id); }}
                            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}
                        >
                            <input
                                type="checkbox"
                                checked={!!isCompareSelected}
                                onChange={() => onToggleCompare?.(pokemon.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>
                    ) : (
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Drag to reorder"
                            title="Drag to reorder"
                            style={{ flexShrink: 0, cursor: 'grab', fontSize: '18px', color: 'var(--text-muted)', userSelect: 'none', width: '20px', textAlign: 'center' }}
                        >
                            ⠿
                        </div>
                    )}
                    {/* Avatar */}
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.45) 0%, ${primaryColor}cc 45%, ${secondaryColor}ff 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: `0 2px 12px ${primaryColor}88, inset 0 1px 3px rgba(255,255,255,0.3)`
                    }}>
                        {(() => {
                            const img = getPokemonDisplayImage(pokemon);
                            return img
                                ? <img src={img} alt={pokemon.name || pokemon.species || 'Pokémon'} style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '24px', opacity: 0.35 }}>⬤</span>;
                        })()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span title={pokemon.name || pokemon.species || 'Unknown'} style={{ fontWeight: 'bold', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'clamp(130px, 28%, 240px)' }}>
                                {pokemon.name || pokemon.species || 'Unknown'}
                            </span>
                            {pokemon.species && pokemon.species !== pokemon.name && (
                                <span className="text-muted" style={{ fontSize: '13px' }}>({pokemon.species})</span>
                            )}
                            {customSpecies?.some(cs => cs.species === pokemon.species) && (
                                <span style={{
                                    fontSize: '12px', fontWeight: 'bold', padding: '1px 6px',
                                    borderRadius: '8px', background: 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))',
                                    color: 'white'
                                }} title="This Pokémon uses a homebrew species">Homebrew</span>
                            )}
                            <span className="text-muted" style={{ fontSize: '13px' }}>Lv.{pokemon.level || 1}</span>
                            {(() => {
                                const loy = pokemon.loyalty ?? 1;
                                return (
                                    <span style={{
                                        fontSize: '12px', fontWeight: 'bold', padding: '1px 6px',
                                        borderRadius: '8px', background: LOYALTY_COLORS[loy],
                                        color: loy === 2 ? 'black' : 'white'
                                    }} title={`Loyalty: ${loy} — ${LOYALTY_LABELS[loy]} (GM Guide pp.10–13)`}>
                                        ❤ {LOYALTY_LABELS[loy]}
                                    </span>
                                );
                            })()}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {pokemon.types?.map(type => (
                                <span
                                    key={type}
                                    className={`type-pill-single type-${type.toLowerCase()}`}
                                    style={{ color: getContrastTextColor(getTypeColor(type)) }}
                                >
                                    {type}
                                </span>
                            ))}
                            {pokemon.heldItem && (() => {
                                const itemData = GAME_DATA?.items?.[pokemon.heldItem];
                                return (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail && itemData) showDetail('item', pokemon.heldItem, itemData);
                                        }}
                                        title={itemData ? 'Click to view item details' : pokemon.heldItem}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            background: 'var(--tint-blue-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            border: '1px solid var(--tint-blue-border)',
                                            cursor: showDetail && itemData ? 'pointer' : 'default'
                                        }}
                                    >
                                        🎒 {pokemon.heldItem}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Status Conditions — above HP bar for gameplay visibility */}
                        {(() => {
                            const active = STATUS_CONDITIONS.filter(c => pokemon.statusConditions?.[c.key]);
                            if (!active.length) return null;
                            return (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {active.map(c => (
                                        <span key={c.key} style={{
                                            padding: '1px 6px', borderRadius: '10px',
                                            background: c.color, color: 'white',
                                            fontSize: '12px', fontWeight: 'bold'
                                        }}>
                                            {c.icon} {c.label}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* HP Bar */}
                        <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                    role="progressbar"
                                    aria-valuenow={currentHP}
                                    aria-valuemin={0}
                                    aria-valuemax={maxHP}
                                    aria-label={`HP: ${currentHP} of ${maxHP}`}
                                    style={{
                                        flex: 1,
                                        height: '10px',
                                        background: 'var(--collapsed-hp-track)',
                                        borderRadius: '5px',
                                        overflow: 'hidden'
                                    }}>
                                    <div style={{
                                        width: `${Math.max(0, Math.min(100, (currentHP / maxHP) * 100))}%`,
                                        height: '100%',
                                        background: currentHP / maxHP > 0.5 ? 'var(--stat-hp)' : currentHP / maxHP > 0.25 ? 'var(--poke-orange)' : 'var(--danger-btn-start)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentHP / maxHP > 0.5 ? 'var(--stat-hp)' : currentHP / maxHP > 0.25 ? 'var(--poke-orange)' : 'var(--danger-btn-start)', minWidth: '55px' }}>
                                    {currentHP}/{maxHP}
                                </span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>
                                {pokemon.nature || 'Hardy'} Nature
                            </span>
                        </div>

                        {/* Expandable Section Buttons */}
                        {(() => {
                            const expandBtnStyle = (section) => {
                                const tints = {
                                    abilities: { border: 'var(--tint-purple-border)', bg: 'var(--tint-purple-bg)', color: 'var(--color-purple)' },
                                    moves:     { border: 'var(--stat-hp)',            bg: 'var(--tint-success-bg)', color: 'var(--color-success-text)' },
                                    skills:    { border: 'var(--stat-satk)',          bg: 'var(--tint-blue-bg)',    color: 'var(--stat-satk)' },
                                };
                                const t = tints[section] || {};
                                const active = expandedSection === section;
                                return {
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    border: active ? '1.5px solid transparent' : `1.5px solid ${t.border || 'var(--border-medium)'}`,
                                    background: active ? 'var(--gradient-purple)' : (t.bg || 'var(--collapsed-btn-bg)'),
                                    color: active ? 'white' : (t.color || 'var(--collapsed-btn-text)'),
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease'
                                };
                            };
                            const abilities = (pokemon.abilities && pokemon.abilities.length > 0)
                                ? pokemon.abilities
                                : (pokemon.ability ? [pokemon.ability] : []);
                            const moves = pokemon.moves || [];
                            const natCount = moves.filter(m => m.source === 'natural').length;
                            const taughtCount = moves.filter(m => m.source === 'taught').length;
                            const atNatLimit = natCount >= MAX_NATURAL_MOVES;
                            const atTaughtLimit = taughtCount >= MAX_TAUGHT_MOVES;
                            const visibleSkills = (pokemon.pokemonSkills || []).filter(s => s.value === undefined || s.value > 0);
                            return (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {/* Abilities Button */}
                            {abilities.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedSection(expandedSection === 'abilities' ? null : 'abilities');
                                        }}
                                        style={expandBtnStyle('abilities')}
                                    >
                                        <span>✨</span> Abilities ({abilities.length})
                                    </button>
                            )}
                            {/* Moves Button */}
                            {moves.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedSection(expandedSection === 'moves' ? null : 'moves');
                                        }}
                                        title={`Natural: ${natCount}/${MAX_NATURAL_MOVES} | Taught: ${taughtCount}/${MAX_TAUGHT_MOVES}`}
                                        style={expandBtnStyle('moves')}
                                    >
                                        <span>⚔️</span> Moves
                                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <span style={{ color: atNatLimit ? (expandedSection === 'moves' ? 'white' : 'var(--color-danger-text)') : 'inherit' }}>
                                                {natCount}/{MAX_NATURAL_MOVES}
                                            </span>
                                            {atNatLimit && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: expandedSection === 'moves' ? 'white' : 'var(--color-danger-text)', flexShrink: 0, display: 'inline-block' }} />}
                                        </span>
                                    </button>
                            )}
                            {/* Skills Button */}
                            {visibleSkills.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSection(expandedSection === 'skills' ? null : 'skills');
                                    }}
                                    style={expandBtnStyle('skills')}
                                >
                                    <span>🎯</span> Skills ({visibleSkills.length})
                                </button>
                            )}
                        </div>
                        );
                        })()}

                        {/* Expanded Abilities */}
                        {expandedSection === 'abilities' && (() => {
                            const abilities = (pokemon.abilities && pokemon.abilities.length > 0)
                                ? pokemon.abilities
                                : (pokemon.ability ? [pokemon.ability] : []);
                            return (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-abilities-bg)', borderRadius: '8px' }}>
                                    {abilities.map((abilityName, idx) => (
                                        <span
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (showDetail) {
                                                    const abilityData = GAME_DATA?.abilities?.[abilityName];
                                                    if (abilityData) showDetail('ability', abilityName, abilityData);
                                                }
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                background: 'var(--gradient-purple)',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {abilityName}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Expanded Moves */}
                        {expandedSection === 'moves' && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-moves-bg)', borderRadius: '8px' }}>
                                {(pokemon.moves || []).map((move, idx) => (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail) {
                                                const moveData = GAME_DATA?.moves?.[move.name] || move;
                                                showDetail('move', move.name, { ...moveData, type: move.type });
                                            }
                                        }}
                                        title={move.source === 'taught' ? 'Taught move' : 'Natural move'}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: getTypeColor(move.type),
                                            color: getContrastTextColor(getTypeColor(move.type)),
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {move.name}
                                        <span style={{ fontSize: '10px', opacity: 0.75, fontWeight: 'normal' }}>
                                            {move.source === 'taught' ? 'T' : move.source === 'egg' ? 'E' : 'N'}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Expanded Skills */}
                        {expandedSection === 'skills' && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-skills-bg)', borderRadius: '8px' }}>
                                {(pokemon.pokemonSkills || []).filter(s => s.value === undefined || s.value > 0).map((skill, idx) => (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail) {
                                                let skillData = GAME_DATA?.pokemonSkills?.[skill.name];
                                                if (!skillData && GAME_DATA?.pokemonSkills) {
                                                    const normalizedName = skill.name.toLowerCase().replace(/\s+/g, '');
                                                    const matchingKey = Object.keys(GAME_DATA.pokemonSkills).find(key =>
                                                        key.toLowerCase().replace(/\s+/g, '') === normalizedName
                                                    );
                                                    if (matchingKey) skillData = GAME_DATA.pokemonSkills[matchingKey];
                                                }
                                                showDetail('pokemonSkill', skill.name, { ...skillData, value: skill.value });
                                            }
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: skill.value !== undefined
                                                ? 'var(--skill-value-color)'
                                                : 'var(--skill-no-value-color)',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {skill.name}{skill.value !== undefined ? ` ${skill.value}` : ''}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {canMoveUp && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={quickBtnLabelStyle} className="quick-action-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                                <span>Up</span>
                            </button>
                        )}
                        {canMoveDown && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={quickBtnLabelStyle} className="quick-action-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                <span>Down</span>
                            </button>
                        )}
                        {/* Move to Party/Reserve Button */}
                        {isInParty ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveToReserve && onMoveToReserve(); }}
                                style={{ ...quickBtnLabelStyle, background: 'var(--collapsed-reserve-btn-bg)', borderColor: 'var(--poke-orange)', color: 'var(--poke-orange-dark)' }}
                                className="quick-action-btn"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--poke-orange-dark)" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                                <span>Reserve</span>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); canMoveToParty && onMoveToParty && onMoveToParty(); }}
                                disabled={!canMoveToParty}
                                style={{
                                    ...quickBtnLabelStyle,
                                    background: canMoveToParty ? 'var(--collapsed-party-btn-bg)' : 'var(--collapsed-btn-bg)',
                                    borderColor: canMoveToParty ? 'var(--stat-hp)' : 'var(--collapsed-quick-btn-border)',
                                    color: canMoveToParty ? 'var(--color-success-text)' : 'var(--collapsed-btn-text)',
                                    cursor: canMoveToParty ? 'pointer' : 'not-allowed',
                                    opacity: canMoveToParty ? 1 : 0.7
                                }}
                                title={canMoveToParty ? 'Move to Party' : 'Party is full (6/6)'}
                                className="quick-action-btn"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canMoveToParty ? 'var(--color-success-text)' : 'var(--collapsed-btn-text)'} strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                <span>Party</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Expanded/Editing view
    return (
        <div
            className="pokemon-card pokemon-card-expanded"
            style={{
                '--type-primary': primaryColor,
                '--type-secondary': secondaryColor,
                '--type-shadow-color': `${primaryColor}33`,
                borderLeft: `4px solid ${primaryColor}`,
                borderRight: secondaryType ? `4px solid ${secondaryColor}` : 'none'
            }}
        >
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                padding: '15px',
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}>
                <div className="pokemon-expanded-header">
                    <div className="pokemon-expanded-header-left">
                        {(() => {
                            const headerSprite = getPokemonSprite(pokemon);
                            return headerSprite ? (
                                <img
                                    src={headerSprite}
                                    alt=""
                                    aria-hidden="true"
                                    style={{ width: '48px', height: '48px', imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, opacity: 0.9 }}
                                    onError={e => { e.target.style.visibility = 'hidden'; }}
                                />
                            ) : null;
                        })()}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                                type="text"
                                value={pokemon.name || ''}
                                onChange={(e) => updatePokemon({ name: e.target.value })}
                                placeholder={pokemon.species || 'Nickname'}
                                className="pokemon-expanded-nickname"
                                aria-label="Pokémon nickname"
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.45)',
                                    borderRadius: '6px 6px 0 0',
                                    padding: '8px 12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {pokemon.species && pokemon.name && pokemon.name !== pokemon.species && (
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', paddingLeft: '12px', marginTop: '2px' }}>
                                    {pokemon.regionalForm ? `${pokemon.regionalForm} ` : ''}{pokemon.species}
                                </div>
                            )}
                            {/* Level controls — inline below nickname */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', opacity: 0.9, background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '3px 6px', alignSelf: 'flex-start' }}>
                                <button
                                    onClick={() => updatePokemon({ level: Math.max(1, (pokemon.level || 1) - 1) })}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '4px', color: 'white', cursor: 'pointer', width: '26px', height: '26px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    title="Level down"
                                    aria-label="Level down"
                                >−</button>
                                <span style={{ whiteSpace: 'nowrap', minWidth: '42px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>Lv.{pokemon.level}</span>
                                <button
                                    onClick={() => updatePokemon({ level: Math.min(100, (pokemon.level || 1) + 1) })}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '4px', color: 'white', cursor: 'pointer', width: '26px', height: '26px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    title="Level up"
                                    aria-label="Level up"
                                >+</button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* Export & Copy — icon-only to keep header compact */}
                        <button
                            onClick={() => exportSinglePokemon(pokemon)}
                            title="Export this Pokémon as a file"
                            aria-label="Export Pokémon"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '6px', padding: '7px 9px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => copyPokemonToClipboard(pokemon)}
                            title="Copy Pokémon data to clipboard"
                            aria-label="Copy Pokémon"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '6px', padding: '7px 9px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                        {/* Visual separator */}
                        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.25)', alignSelf: 'center' }} aria-hidden="true" />
                        <button
                            onClick={() => {
                                const hasChanges = snapshot && JSON.stringify(snapshot) !== JSON.stringify(pokemon);
                                if (hasChanges) {
                                    showConfirm({
                                        title: 'Discard Changes?',
                                        message: 'You have unsaved changes. Discard them and revert to the previous state?',
                                        confirmLabel: 'Discard',
                                        danger: true,
                                        onConfirm: () => {
                                            if (restorePokemon) restorePokemon(snapshot);
                                            setEditing(false);
                                        }
                                    });
                                } else {
                                    if (snapshot && restorePokemon) restorePokemon(snapshot);
                                    setEditing(false);
                                }
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.35)',
                                borderRadius: '6px',
                                padding: '8px 14px',
                                color: 'rgba(255,255,255,0.75)',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                border: '2px solid rgba(255,255,255,0.8)',
                                borderRadius: '6px',
                                padding: '8px 22px',
                                color: 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Tabs */}
            <div className="tabs pokemon-card-tabs" style={{ padding: '0 15px', overflowX: 'auto', flexShrink: 0 }}>
                {[
                    { id: 'info',      icon: 'ℹ️',  label: 'Info'   },
                    { id: 'stats',     icon: '📊',  label: 'Stats',  badge: (pokemon.statPointsAvailable || 0) > 0 ? String(pokemon.statPointsAvailable) : null },
                    { id: 'moves',     icon: '⚔️',  label: 'Moves',  badge: (pokemon.moves || []).length > 0 ? String((pokemon.moves || []).length) : null },
                    { id: 'skills',    icon: '🎯',  label: 'Skills', badge: (() => { const n = (pokemon.pokemonSkills || []).filter(s => s.value > 0).length; return n > 0 ? String(n) : null; })() },
                    { id: 'evolution', icon: '✨',  label: 'Evolve', badge: (() => { if (!getEvolutionOptions) return null; const { canEvolve } = getEvolutionOptions(pokemon); return canEvolve?.some(e => e.canEvolveNow) ? '↑' : null; })() },
                ].map(({ id, icon, label, badge }) => (
                    <button
                        key={id}
                        className={`tab ${editTab === id ? 'active' : ''}`}
                        onClick={() => setEditTab(id)}
                        style={{ position: 'relative' }}
                    >
                        <span aria-hidden="true">{icon}</span> {label}
                        {badge != null && (
                            <span style={{
                                position: 'absolute', top: '4px', right: '4px',
                                minWidth: '16px', height: '16px', lineHeight: '16px',
                                borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                                background: id === 'stats' || id === 'evolution' ? 'var(--color-success-text)' : (id === 'moves' && (pokemon.moves || []).length >= MAX_TOTAL_MOVES) ? 'var(--color-success-text)' : 'var(--text-muted)',
                                color: 'white', textAlign: 'center', padding: '0 2px'
                            }}>{badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '15px', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
                {editTab === 'info' && (
                    <div>
                        {/* Species Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ marginBottom: '4px' }}>
                                <label htmlFor="species-search-input" style={{ fontSize: '13px', fontWeight: 'bold', display: 'block' }}>
                                    Species
                                </label>
                                {pokemon.species && !showSpeciesDropdown && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Current: <strong style={{ color: 'var(--text-secondary)' }}>{pokemon.regionalForm ? `${pokemon.regionalForm} ` : ''}{pokemon.species}</strong>
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                {/* Click-outside backdrop for species dropdown */}
                                {showSpeciesDropdown && (
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                        onClick={() => { setShowSpeciesDropdown(false); setSpeciesSearch(''); setSpeciesTypeFilter('all'); }}
                                        aria-hidden="true"
                                    />
                                )}
                                {/* P3: Search input — shows current species as placeholder, doesn't blank on focus */}
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="species-search-input"
                                        aria-label="Search Pokémon species"
                                        type="text"
                                        value={speciesSearch}
                                        onChange={(e) => {
                                            setSpeciesSearch(e.target.value);
                                            setShowSpeciesDropdown(true);
                                        }}
                                        onFocus={() => setShowSpeciesDropdown(true)}
                                        placeholder="Search species by name…"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            paddingRight: '32px',
                                            borderRadius: '6px',
                                            border: showSpeciesDropdown ? '2px solid var(--color-purple)' : '1px solid var(--species-input-border)',
                                            boxSizing: 'border-box',
                                            background: 'var(--species-dropdown-bg)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    {!speciesSearch && (
                                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) ${showSpeciesDropdown ? 'rotate(180deg)' : ''}`, color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '12px', transition: 'transform 0.2s ease' }}>▼</span>
                                    )}
                                    {speciesSearch && (
                                        <button
                                            onClick={() => setSpeciesSearch('')}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'var(--text-muted)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            aria-label="Clear species search"
                                        >✕</button>
                                    )}
                                </div>
                                {/* P4: warning moved inside dropdown — see below */}

                                {/* Species Dropdown */}
                                {showSpeciesDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--species-dropdown-bg)',
                                        border: '2px solid var(--color-purple)',
                                        borderTop: 'none',
                                        borderRadius: '0 0 8px 8px',
                                        zIndex: 100,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}>
                                        {/* Filter & Sort Controls */}
                                        <div style={{
                                            padding: '10px',
                                            background: 'var(--species-filter-bg)',
                                            borderBottom: '1px solid var(--species-border)'
                                        }}>
                                            {/* P4: Warning shown inside dropdown when species is already set */}
                                            {pokemon.species && (
                                                <div style={{ marginBottom: '8px', padding: '5px 8px', borderRadius: '5px', background: 'var(--tint-fail-bg)', border: '1px solid var(--tint-fail-border)', fontSize: '12px', color: 'var(--color-danger-text)' }}>
                                                    ⚠ Changing species resets types, abilities, learned moves, and the available move pool.
                                                </div>
                                            )}
                                            {/* Type Filter Chips */}
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--species-label-text)', marginBottom: '4px' }}>Filter by Type:</div>
                                                <div role="group" aria-label="Filter by type" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: '4px', paddingBottom: '3px' }}>
                                                    <button
                                                        onClick={() => setSpeciesTypeFilter('all')}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            background: speciesTypeFilter === 'all' ? 'var(--color-purple)' : 'var(--species-filter-inactive)',
                                                            color: speciesTypeFilter === 'all' ? 'white' : 'var(--species-label-text)',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer'
                                                        }}
                                                    >All</button>
                                                    {pokemonTypes.map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setSpeciesTypeFilter(type)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '12px',
                                                                border: 'none',
                                                                background: speciesTypeFilter === type ? getTypeColor(type) : 'var(--species-filter-inactive)',
                                                                color: speciesTypeFilter === type ? 'white' : 'var(--species-label-text)',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer'
                                                            }}
                                                        >{type}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sort Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--species-label-text)' }}>Sort:</span>
                                                    <select
                                                        value={speciesSort}
                                                        onChange={(e) => setSpeciesSort(e.target.value)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--species-input-border)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            background: 'var(--species-dropdown-bg)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                    >
                                                        <option value="name">Name (A-Z)</option>
                                                        <option value="id">Dex Number</option>
                                                        <option value="bst-high">BST (High → Low)</option>
                                                        <option value="bst-low">BST (Low → High)</option>
                                                    </select>
                                                </div>
                                                <span style={{ fontSize: '12px', color: 'var(--species-muted-text)', fontWeight: filteredSpecies.length > 50 ? 'bold' : 'normal' }}>
                                                    {filteredSpecies.length > 50
                                                        ? `Showing 50 of ${filteredSpecies.length} — refine search`
                                                        : `${filteredSpecies.length} result${filteredSpecies.length !== 1 ? 's' : ''}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Species List */}
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {pokedexLoading ? (
                                                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--species-muted-text)' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        border: '3px solid var(--border-light)',
                                                        borderTopColor: 'var(--color-purple)',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite',
                                                        margin: '0 auto 10px'
                                                    }} />
                                                    <div style={{ fontSize: '12px' }}>Loading Pokédex...</div>
                                                </div>
                                            ) : filteredSpecies.length > 0 ? (
                                                filteredSpecies.slice(0, 50).map(sp => {
                                                    const hasRegionalForms = sp.regionalForms && sp.regionalForms.length > 0;
                                                    // Get all unique types from regional forms
                                                    const regionalTypes = hasRegionalForms
                                                        ? [...new Set(sp.regionalForms.flatMap(f => f.types || []))]
                                                            .filter(t => !sp.types?.includes(t))
                                                        : [];

                                                    return (
                                                        <div
                                                            key={sp.id}
                                                            onClick={() => handleSelectSpecies(sp)}
                                                            className="species-list-item"
                                                            style={{
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid var(--species-border)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-hover-bg)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontWeight: 'bold' }}>{sp.species}</span>
                                                                {sp.isCustom ? (
                                                                    <span style={{
                                                                        fontSize: '12px',
                                                                        color: 'white',
                                                                        background: 'var(--color-purple)',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        Custom
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '12px', color: 'var(--species-muted-text)' }}>
                                                                        #{sp.id || '???'}
                                                                    </span>
                                                                )}
                                                                {hasRegionalForms && (
                                                                    <span style={{ fontSize: '12px', color: 'var(--stat-satk)' }}>
                                                                        🌍
                                                                    </span>
                                                                )}
                                                                {/* Edit/Delete buttons for custom species */}
                                                                {sp.isCustom && setCustomSpecies && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (setEditingCustomSpeciesId) {
                                                                                    setEditingCustomSpeciesId(sp.id);
                                                                                }
                                                                                if (setShowCustomSpeciesModal) {
                                                                                    setShowCustomSpeciesModal(true);
                                                                                }
                                                                                setShowSpeciesDropdown(false);
                                                                            }}
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                background: 'var(--color-purple)',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '3px',
                                                                                fontSize: '12px',
                                                                                cursor: 'pointer',
                                                                                marginLeft: '4px'
                                                                            }}
                                                                            title={`Edit ${sp.species}`}
                                                                            aria-label={`Edit ${sp.species}`}
                                                                        >Edit</button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                showConfirm({
                                                                                    title: 'Delete Species',
                                                                                    message: `Delete custom species "${sp.species}"?`,
                                                                                    danger: true,
                                                                                    onConfirm: () => setCustomSpecies(prev => prev.filter(s => s.id !== sp.id))
                                                                                });
                                                                            }}
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                background: 'var(--danger-btn-start)',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '3px',
                                                                                fontSize: '12px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title={`Delete ${sp.species}`}
                                                                            aria-label={`Delete ${sp.species}`}
                                                                        >×</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                                {sp.types?.map(t => (
                                                                    <span
                                                                        key={t}
                                                                        style={{
                                                                            padding: '2px 6px',
                                                                            background: getTypeColor(t),
                                                                            color: 'white',
                                                                            borderRadius: '8px',
                                                                            fontSize: '12px',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >{t}</span>
                                                                ))}
                                                                {regionalTypes.map(t => (
                                                                    <span
                                                                        key={`regional-${t}`}
                                                                        style={{
                                                                            padding: '2px 6px',
                                                                            background: getTypeColor(t),
                                                                            color: 'white',
                                                                            borderRadius: '8px',
                                                                            fontSize: '12px',
                                                                            fontWeight: 'bold',
                                                                            opacity: 0.6,
                                                                            border: '1px dashed white'
                                                                        }}
                                                                        title="Regional form type"
                                                                    >{t}</span>
                                                                ))}
                                                                <span style={{ fontSize: '12px', color: 'var(--species-muted-text)', marginLeft: '4px' }}>
                                                                    BST: {getBaseStatTotal(sp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--species-muted-text)' }}>
                                                    {speciesSearch || speciesTypeFilter !== 'all'
                                                        ? 'No Pokémon match your filters — try clearing them'
                                                        : 'Try searching by name or filtering by type'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Buttons */}
                                        <div style={{
                                            padding: '8px',
                                            borderTop: '1px solid var(--species-border)',
                                            background: 'var(--species-filter-bg)',
                                            display: 'flex',
                                            gap: '8px',
                                            justifyContent: 'center'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setShowSpeciesDropdown(false);
                                                    setSpeciesSearch('');
                                                    setSpeciesTypeFilter('all');
                                                }}
                                                style={{
                                                    padding: '6px 16px',
                                                    background: 'var(--bg-light)',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border-medium)',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >Close</button>
                                        </div>
                                    </div>
                                )}

                                {/* Regional Form Selection Modal */}
                                {showRegionalFormSelect && pendingSpeciesData && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--species-dropdown-bg)',
                                        border: '1px solid var(--species-input-border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        zIndex: 1001,
                                        marginTop: '4px'
                                    }}>
                                        <div style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--species-border)',
                                            background: 'var(--gradient-purple)',
                                            borderRadius: '8px 8px 0 0',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                🌍 Choose Form for {pendingSpeciesData.species}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                                This Pokémon has regional variants
                                            </div>
                                        </div>

                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {/* Normal Form */}
                                            <div
                                                onClick={() => applySpeciesForm(pendingSpeciesData, { isBase: true })}
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--species-border)',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-hover-bg)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>🔵 Normal Form</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        {pendingSpeciesData.types?.map(t => (
                                                            <span
                                                                key={t}
                                                                style={{
                                                                    padding: '2px 6px',
                                                                    background: getTypeColor(t),
                                                                    color: 'white',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Regional Forms */}
                                            {pendingSpeciesData.regionalForms.map((form, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => applySpeciesForm(pendingSpeciesData, form)}
                                                    style={{
                                                        padding: '12px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid var(--species-border)',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-regional-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <span style={{ fontWeight: 'bold' }}>🌴 {form.name} Form</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {form.types?.map(t => (
                                                                <span
                                                                    key={t}
                                                                    style={{
                                                                        padding: '2px 6px',
                                                                        background: getTypeColor(t),
                                                                        color: 'white',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Cancel Button */}
                                        <div style={{
                                            padding: '8px',
                                            borderTop: '1px solid var(--species-border)',
                                            background: 'var(--species-filter-bg)',
                                            textAlign: 'center',
                                            borderRadius: '0 0 8px 8px'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setShowRegionalFormSelect(false);
                                                    setPendingSpeciesData(null);
                                                }}
                                                style={{
                                                    padding: '6px 16px',
                                                    background: 'var(--bg-light)',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border-medium)',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: EXP & Nature */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>Experience &amp; Nature</div>
                        <div className="pokemon-info-grid">
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                    Experience
                                    <span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                        (auto-levels)
                                    </span>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <input
                                        type="number"
                                        value={pokemon.exp || 0}
                                        onChange={(e) => updatePokemon({ exp: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => updatePokemon({ exp: (pokemon.exp || 0) + 100 })}
                                            style={{
                                                flex: 1, padding: '5px 0',
                                                borderRadius: '4px',
                                                border: '1px solid var(--stat-hp)',
                                                background: 'var(--stat-hp)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                            title="Add 100 EXP"
                                        >
                                            +100
                                        </button>
                                        <button
                                            onClick={() => updatePokemon({ exp: Math.max(0, (pokemon.exp || 0) - 100) })}
                                            disabled={!pokemon.exp || pokemon.exp <= 0}
                                            style={{
                                                flex: 1, padding: '5px 0',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-medium)',
                                                background: 'var(--bg-light)',
                                                color: 'var(--text-secondary)',
                                                cursor: (!pokemon.exp || pokemon.exp <= 0) ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                opacity: (!pokemon.exp || pokemon.exp <= 0) ? 0.4 : 1
                                            }}
                                            title="Remove 100 EXP"
                                        >
                                            −100
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {/* P1: Nature with inline modifier hint */}
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px' }}>
                                    <span>Nature</span>
                                    {(() => {
                                        const nd = GAME_DATA?.natures?.[pokemon.nature];
                                        if (!nd?.buff || !nd?.nerf) return null;
                                        return (
                                            <span style={{ fontWeight: 'normal', fontSize: '12px' }}>
                                                <span style={{ color: 'var(--color-success-text)' }}>+{nd.buff.toUpperCase()}</span>
                                                {' / '}
                                                <span style={{ color: 'var(--color-danger-text)' }}>−{nd.nerf.toUpperCase()}</span>
                                            </span>
                                        );
                                    })()}
                                </label>
                                <select
                                    value={pokemon.nature || 'Hardy'}
                                    onChange={(e) => updatePokemon({ nature: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                >
                                    {Object.keys(GAME_DATA.natures || {}).map(nature => (
                                        <option key={nature} value={nature}>{nature}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Section: Gender & Origin */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>Gender &amp; Origin</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Gender</label>
                                <select
                                    value={pokemon.gender || ''}
                                    onChange={(e) => updatePokemon({ gender: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Unknown</option>
                                    <option value="male">Male ♂</option>
                                    <option value="female">Female ♀</option>
                                    <option value="genderless">Genderless</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Origin</label>
                                <select
                                    value={pokemon.origin || 'caught'}
                                    onChange={(e) => {
                                        const origin = e.target.value;
                                        const updates = { origin };
                                        if (origin === 'hatched') {
                                            updates.loyalty = Math.max(pokemon.loyalty ?? 1, 2);
                                        }
                                        updatePokemon(updates);
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                >
                                    <option value="caught">Caught</option>
                                    <option value="hatched">Hatched</option>
                                    <option value="traded">Traded</option>
                                    <option value="befriended">Befriended</option>
                                </select>
                                {pokemon.origin === 'hatched' && (
                                    <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '8px', background: 'var(--tint-blue-bg)', border: '1px solid var(--tint-blue-border)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                                        ⬆ min. Loyalty 2
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Loyalty */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>Loyalty</div>
                        {(() => {
                            const currentLoyalty = pokemon.loyalty ?? 1;
                            return (
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                                            background: LOYALTY_COLORS[currentLoyalty], color: currentLoyalty === 2 ? 'black' : 'white'
                                        }}>
                                            {currentLoyalty} — {LOYALTY_LABELS[currentLoyalty]}
                                        </span>
                                        <button
                                            style={{ ...HELP_BTN_STYLE, marginLeft: 'auto' }}
                                            title="About Loyalty"
                                            aria-label="Help: Loyalty"
                                            onClick={() => showHelp('pokemon-loyalty')}
                                        >?</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[0, 1, 2, 3, 4].map(rank => (
                                            <button
                                                key={rank}
                                                onClick={() => updatePokemon({ loyalty: rank })}
                                                title={`${rank} — ${LOYALTY_LABELS[rank]}`}
                                                aria-label={`Set loyalty to ${rank} — ${LOYALTY_LABELS[rank]}`}
                                                style={{
                                                    flex: 1, padding: '7px 4px', borderRadius: '6px', border: '2px solid',
                                                    borderColor: currentLoyalty === rank ? LOYALTY_COLORS[rank] : LOYALTY_COLORS[rank] + '55',
                                                    background: currentLoyalty === rank ? LOYALTY_COLORS[rank] : LOYALTY_COLORS[rank] + '18',
                                                    color: currentLoyalty === rank ? (rank === 2 ? 'black' : 'white') : 'var(--text-secondary)',
                                                    cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.15s',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                                                }}
                                            >
                                                <span style={{ fontSize: '14px', lineHeight: 1 }}>{rank}</span>
                                                <span style={{ fontSize: '10px', fontWeight: currentLoyalty === rank ? 'bold' : 'normal', opacity: currentLoyalty === rank ? 1 : 0.7, lineHeight: 1 }}>{LOYALTY_LABELS[rank]}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {currentLoyalty === 0 && '⚠ Can use Frustration. May refuse to evolve.'}
                                        {currentLoyalty === 1 && '⚠ May occasionally ignore commands.'}
                                        {currentLoyalty === 2 && '✓ Immune to Snagging. Follows commands.'}
                                        {currentLoyalty >= 3 && '★ Can use Return. Immune to Snagging.'}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* P7: Contest Stats & Ribbons — collapsible, fixed wrapper padding */}
                        <div style={{ marginBottom: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '6px 10px' }}>
                        <button
                            onClick={() => setShowContestSection(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)',
                                marginBottom: showContestSection ? '10px' : '0'
                            }}
                            aria-expanded={showContestSection}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                style={{ transition: 'transform 0.15s ease', transform: showContestSection ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                            🎭 Contest Stats &amp; Ribbons
                            {!showContestSection && (() => {
                                const contestStats = pokemon.contestStats || {};
                                const ribbons = pokemon.ribbons || {};
                                const anyContest = Object.values(contestStats).some(v => v > 0);
                                const anyRibbons = Object.values(ribbons).some(v => v > 0);
                                if (!anyContest && !anyRibbons) return <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(none)</span>;
                                const totalRibbons = Object.values(ribbons).reduce((s, v) => s + (v || 0), 0);
                                return <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{totalRibbons > 0 ? `${totalRibbons} ribbon${totalRibbons !== 1 ? 's' : ''}` : 'stats set'}</span>;
                            })()}
                        </button>
                        {showContestSection && (() => {
                            const CONTEST_STATS = [['cool', '😎'], ['beauty', '💎'], ['cute', '🌸'], ['smart', '🔮'], ['tough', '💪']];
                            const contestStats = pokemon.contestStats || {};
                            return (
                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Contest Stats</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(52px, 1fr))', gap: '4px' }}>
                                        {CONTEST_STATS.map(([stat, icon]) => {
                                            const val = contestStats[stat] || 0;
                                            return (
                                                <div key={stat} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'capitalize' }}>{icon}<br/>{stat}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                        <button
                                                            onClick={() => updatePokemon({ contestStats: { ...contestStats, [stat]: Math.max(0, val - 1) } })}
                                                            disabled={val === 0}
                                                            style={{ width: '28px', flexShrink: 0, padding: '4px 0', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: val === 0 ? 'not-allowed' : 'pointer', opacity: val === 0 ? 0.4 : 1, fontSize: '13px', color: 'var(--text-secondary)' }}
                                                        >−</button>
                                                        <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{val}</span>
                                                        <button
                                                            onClick={() => updatePokemon({ contestStats: { ...contestStats, [stat]: val + 1 } })}
                                                            style={{ width: '28px', flexShrink: 0, padding: '4px 0', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Ribbons */}
                        {showContestSection && (() => {
                            const RIBBON_TYPES = [['cool', '😎'], ['beauty', '💎'], ['cute', '🌸'], ['smart', '🔮'], ['tough', '💪']];
                            const ribbons = pokemon.ribbons || {};
                            const totalRibbons = Object.values(ribbons).reduce((s, v) => s + (v || 0), 0);
                            return (
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ borderTop: '1px solid var(--border-light)', margin: '6px 0 10px' }} />
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>Ribbons</span>
                                        {totalRibbons > 0 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{totalRibbons} total</span>}
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(52px, 1fr))', gap: '4px' }}>
                                        {RIBBON_TYPES.map(([type, icon]) => {
                                            const count = ribbons[type] || 0;
                                            return (
                                                <div key={type} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'capitalize' }}>{icon}<br/>{type}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                        <button
                                                            onClick={() => updatePokemon({ ribbons: { ...ribbons, [type]: Math.max(0, count - 1) } })}
                                                            disabled={count === 0}
                                                            style={{ width: '28px', flexShrink: 0, padding: '4px 0', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.4 : 1, fontSize: '13px', color: 'var(--text-secondary)' }}
                                                        >−</button>
                                                        <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{count}</span>
                                                        <button
                                                            onClick={() => updatePokemon({ ribbons: { ...ribbons, [type]: count + 1 } })}
                                                            style={{ width: '28px', flexShrink: 0, padding: '4px 0', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                        </div>

                        {/* Abilities Section - Up to 3 */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                            Abilities <span style={{ fontWeight: 'normal', fontSize: '12px', letterSpacing: 0, opacity: 0.7 }}>({(pokemon.abilities || []).length}/3)</span>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            {/* Empty state when no abilities selected */}
                            {(pokemon.abilities || []).length === 0 && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-light)', border: '1px dashed var(--border-medium)' }}>
                                    None added yet — select from the list below.
                                </div>
                            )}

                            {/* Selected Abilities */}
                            {(pokemon.abilities || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {(pokemon.abilities || []).map((abilityName, idx) => {
                                        const abilityData = GAME_DATA.abilities?.[abilityName];
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 10px',
                                                    background: 'var(--gradient-purple)',
                                                    color: 'white',
                                                    borderRadius: '16px',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <span
                                                    onClick={() => {
                                                        if (showDetail && abilityData) {
                                                            showDetail('ability', abilityName, abilityData);
                                                        }
                                                    }}
                                                    style={{ cursor: showDetail ? 'pointer' : 'default' }}
                                                >
                                                    {abilityName}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const prevAbilities = [...(pokemon.abilities || [])];
                                                        const newAbilities = prevAbilities.filter(a => a !== abilityName);
                                                        updatePokemon({ abilities: newAbilities });
                                                        toast.show(
                                                            `Removed ${abilityName}`,
                                                            'success',
                                                            4000,
                                                            { label: 'Undo', onClick: () => updatePokemon({ abilities: prevAbilities }) }
                                                        );
                                                    }}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.25)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Available Abilities to Add */}
                            {derivedAbilities.length > 0 ? (
                                <div className="abilities-available-box" style={{ padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <span className="text-muted" style={{ fontSize: '12px' }}>Select to add · click name for details</span>
                                        <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>● Basic · ★ Adv. · ◆ High</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {derivedAbilities.map((ab, idx) => {
                                            const isSelected = (pokemon.abilities || []).includes(ab.name);
                                            const canAdd = (pokemon.abilities || []).length < 3;
                                            const abilityData = GAME_DATA.abilities?.[ab.name];
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`ability-option ${isSelected ? 'selected' : ''}`}
                                                    title={abilityData?.effect || abilityData?.description || ab.name}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        opacity: isSelected || canAdd ? 1 : 0.5
                                                    }}
                                                >
                                                    <span
                                                        onClick={() => {
                                                            if (showDetail && abilityData) {
                                                                showDetail('ability', ab.name, abilityData);
                                                            }
                                                        }}
                                                        style={{ cursor: showDetail ? 'pointer' : 'default' }}
                                                    >
                                                        {ab.name}
                                                    </span>
                                                    <span style={{ marginLeft: '4px', marginRight: '6px', opacity: 0.7, fontSize: '12px' }}>
                                                        {ab.type === 'Basic' ? '●' : ab.type === 'Advanced' ? '★' : '◆'}
                                                    </span>
                                                    {!isSelected && canAdd && (
                                                        <button
                                                            onClick={() => {
                                                                const newAbilities = [...(pokemon.abilities || []), ab.name];
                                                                updatePokemon({ abilities: newAbilities });
                                                            }}
                                                            style={{
                                                                background: 'var(--stat-hp)',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '22px',
                                                                height: '22px',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                flexShrink: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                    {isSelected && (
                                                        <span style={{ color: 'var(--stat-hp)', fontSize: '12px' }}>✓</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px', marginBottom: '6px' }}>
                                        No species data — type an ability name and press Enter to add ({(pokemon.abilities || []).length}/3 used).
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ability name..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                const newAbilities = [...(pokemon.abilities || [])];
                                                if (newAbilities.length < 3 && !newAbilities.includes(e.target.value.trim())) {
                                                    newAbilities.push(e.target.value.trim());
                                                    updatePokemon({ abilities: newAbilities });
                                                }
                                                e.target.value = '';
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>Held Item</div>

                        {/* Held Item */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="text"
                                        placeholder={pokemon.heldItem ? `Current: ${pokemon.heldItem} — search to change…` : 'Search or type item name…'}
                                        value={heldItemSearch}
                                        onChange={(e) => {
                                            setHeldItemSearch(e.target.value);
                                            setShowHeldItemDropdown(true);
                                        }}
                                        onFocus={() => { if (!showHeldItemDropdown) setHeldItemSearch(''); setShowHeldItemDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowHeldItemDropdown(false), 150)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && heldItemSearch.trim()) {
                                                updatePokemon({ heldItem: heldItemSearch.trim() });
                                                setHeldItemSearch('');
                                                setShowHeldItemDropdown(false);
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', paddingRight: '28px', borderRadius: '6px', border: showHeldItemDropdown ? '2px solid var(--color-purple)' : '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                                    />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) ${showHeldItemDropdown ? 'rotate(180deg)' : ''}`, color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '12px', transition: 'transform 0.2s ease' }}>▼</span>
                                    </div>
                                    {pokemon.heldItem && (
                                        <button
                                            onClick={() => { updatePokemon({ heldItem: '' }); setHeldItemSearch(''); }}
                                            style={{ padding: '6px 8px', background: 'var(--danger-btn-start)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
                                            title="Clear held item"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                {/* P6: badge removed — input already shows the held item value */}
                                {showHeldItemDropdown && (filteredHeldItems.length > 0 || heldItemSearch) && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--input-bg)', border: '1px solid var(--border-medium)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                        {filteredHeldItems.map(item => (
                                            <div
                                                key={item.name}
                                                onMouseDown={() => {
                                                    updatePokemon({ heldItem: item.name });
                                                    setHeldItemSearch('');
                                                    setShowHeldItemDropdown(false);
                                                }}
                                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                                                className="pokemon-import-option"
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                                    {item.effect && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.effect}</div>}
                                                </div>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px', marginTop: '2px' }}>×{item.quantity ?? 1}</span>
                                            </div>
                                        ))}
                                        {filteredHeldItems.length === 0 && !heldItemSearch && (
                                            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                No held items in inventory
                                            </div>
                                        )}
                                        {heldItemSearch && !filteredHeldItems.some(i => i.name.toLowerCase() === heldItemSearch.toLowerCase()) && (
                                            <div
                                                onMouseDown={() => {
                                                    updatePokemon({ heldItem: heldItemSearch.trim() });
                                                    setHeldItemSearch('');
                                                    setShowHeldItemDropdown(false);
                                                }}
                                                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-purple)', fontWeight: 'bold', background: 'var(--tint-purple-bg)', borderTop: filteredHeldItems.length > 0 ? '1px solid var(--border-light)' : 'none' }}
                                            >
                                                + Use "{heldItemSearch.trim()}" as custom item
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pokémon Image */}
                        <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '10px', paddingTop: '10px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Appearance <span style={{ fontWeight: 'normal', fontSize: '13px', letterSpacing: 0, opacity: 0.7 }}>(optional)</span></div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {(() => {
                                    const autoSprite = getPokemonSprite(pokemon);
                                    const displayImg = pokemon.avatar || autoSprite;
                                    if (displayImg) {
                                        return (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={displayImg}
                                                    alt={pokemon.name || pokemon.species}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '8px',
                                                        objectFit: 'cover',
                                                        border: pokemon.avatar ? '2px solid var(--border-medium)' : '2px solid transparent',
                                                        imageRendering: !pokemon.avatar ? 'pixelated' : 'auto',
                                                    }}
                                                />
                                                {pokemon.avatar && (
                                                    <button
                                                        onClick={() => updatePokemon({ avatar: '' })}
                                                        aria-label="Remove custom image"
                                                        title="Remove custom image"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: 'rgba(0,0,0,0.55)',
                                                            color: 'white',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            background: 'var(--bg-light)',
                                            border: '2px dashed var(--border-medium)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    );
                                })()}
                                <div style={{ flex: 1, alignSelf: 'flex-start' }}>
                                    <label
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 20px',
                                            background: 'var(--gradient-purple)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Choose Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        updatePokemon({ avatar: event.target.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                        Upload an image file (PNG, JPG, etc.)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger zone */}
                        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)', marginTop: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Danger Zone</div>
                            <button
                                onClick={() => {
                                    showConfirm({
                                        title: 'Delete Pokémon',
                                        message: `Delete ${pokemon.name || pokemon.species || 'this Pokémon'}? This cannot be undone.`,
                                        danger: true,
                                        onConfirm: () => deletePokemon()
                                    });
                                }}
                                className="pokemon-action-btn"
                                style={{ background: 'linear-gradient(135deg, var(--danger-btn-start), var(--danger-btn-end))' }}
                                title="Delete this Pokémon"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                    <path d="M10 11v6M14 11v6"></path>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                </svg>
                                Delete Pokémon
                            </button>
                        </div>
                    </div>
                )}

                {editTab === 'stats' && (
                    <div>
                        {/* Pre-existing Base Relation violation — offers reset as escape hatch */}
                        {(() => {
                            const violations = getBaseRelationViolations(pokemon);
                            if (!violations.length) return null;
                            return (
                                <div style={{
                                    marginBottom: '12px', padding: '14px 16px', borderRadius: '8px',
                                    background: 'var(--tint-fail-bg)', border: '1px solid var(--color-danger-text)'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-danger-text)', marginBottom: '6px' }}>
                                        ⚠️ Base Relation Violated — stat allocation is stuck
                                    </div>
                                    <ul style={{ margin: '0 0 8px 0', paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                        {violations.map(v => <li key={v}>{v}</li>)}
                                    </ul>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                        These violations prevent any +/− moves from being allowed. Reset the allocation to start fresh — all spent points are returned.
                                    </div>
                                    <button
                                        onClick={() => showConfirm({
                                            title: 'Reset Stat Allocation',
                                            message: `Clear all added stats for ${pokemon.name || pokemon.species}? All spent points will be returned.`,
                                            confirmLabel: 'Reset',
                                            danger: true,
                                            onConfirm: () => updatePokemon({
                                                addedStats: {},
                                                statPointsAvailable: Math.max(0, (pokemon.highestLevelReached || pokemon.level || 1) - 1),
                                                statAllocationHistory: []
                                            })
                                        })}
                                        style={{
                                            padding: '5px 14px', borderRadius: '6px', border: 'none',
                                            background: 'var(--color-danger-text)', color: 'white',
                                            fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        Reset Stat Allocation
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Nature is already shown in Info tab — no redundant box here */}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Stat Allocation</div>
                            <div style={{
                                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '3px 8px', borderRadius: '6px',
                                background: (pokemon.statPointsAvailable || 0) > 0 ? 'var(--tint-success-bg)' : 'var(--bg-light)',
                                border: `1px solid ${(pokemon.statPointsAvailable || 0) > 0 ? 'var(--stat-hp)' : 'var(--border-light)'}`,
                                transition: 'background 0.2s, border-color 0.2s'
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stat Points:</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: (pokemon.statPointsAvailable || 0) > 0 ? 'var(--color-success-text)' : 'var(--text-muted)' }} title="Spend these to increase stats. Pokémon gain stat points when leveling up.">{pokemon.statPointsAvailable || 0}</span>
                            </div>
                            <button
                                onClick={() => showHelp('pokemon-stats')}
                                style={HELP_BTN_STYLE}
                                aria-label="Help: Pokémon Stats"
                                title="About Pokémon stat allocation"
                            >?</button>
                        </div>

                        <div className="stat-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {(() => {
                                const natureModifiedBase = applyNature(pokemon.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 }, pokemon.nature);
                                return ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => {
                                const statColor = `var(--stat-${stat})`;
                                const addedVal = pokemon.addedStats?.[stat] || 0;
                                const pointsLeft = pokemon.statPointsAvailable || 0;
                                const addBlockReason = pointsLeft > 0 ? getBaseRelationBlockReason(stat, natureModifiedBase, pokemon.addedStats || {}, 1) : null;
                                const removeBlockReason = addedVal > 0 ? getBaseRelationBlockReason(stat, natureModifiedBase, pokemon.addedStats || {}, -1) : null;
                                const addViolates = !!addBlockReason;
                                const removeViolates = !!removeBlockReason;
                                const minusDisabled = addedVal <= 0 || removeViolates;
                                const plusDisabled = pointsLeft <= 0 || addViolates;
                                const canAdd = pointsLeft > 0 && !addViolates;
                                return (
                                <div key={stat} className="bg-light" style={{ padding: '10px', paddingBottom: '8px', borderRadius: '8px', textAlign: 'center', boxShadow: canAdd ? `0 0 0 2px ${statColor}` : '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${statColor}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: statColor }}>
                                        {stat.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }} title="Nature-modified base stat">
                                        {natureModifiedBase[stat] || 10}
                                    </div>
                                    {/* −/+ buttons flanking the added-points counter */}
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                        <button
                                            onClick={() => {
                                                if (!minusDisabled) {
                                                    const history = [...(pokemon.statAllocationHistory || [])];
                                                    const lastIdx = history.lastIndexOf(stat);
                                                    if (lastIdx !== -1) history.splice(lastIdx, 1);
                                                    updatePokemon({
                                                        addedStats: { ...pokemon.addedStats, [stat]: addedVal - 1 },
                                                        statPointsAvailable: pointsLeft + 1,
                                                        statAllocationHistory: history
                                                    });
                                                }
                                            }}
                                            disabled={minusDisabled}
                                            title={removeBlockReason || undefined}
                                            className="stat-alloc-btn"
                                            style={{ ...statBtnStyle, opacity: minusDisabled ? 0.45 : 1, cursor: minusDisabled ? 'not-allowed' : 'pointer', background: minusDisabled ? 'var(--border-light)' : statBtnStyle.background, color: minusDisabled ? 'var(--text-muted)' : statBtnStyle.color }}
                                        >
                                            −
                                        </button>
                                        <span style={{ minWidth: '28px', fontSize: '12px', fontWeight: 'bold', color: addedVal > 0 ? statColor : 'var(--text-muted)', opacity: addedVal > 0 ? 1 : 0.4 }} title="Points added from level-up bonuses">
                                            {addedVal > 0 ? `+${addedVal}` : '+0'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (!plusDisabled) {
                                                    updatePokemon({
                                                        addedStats: { ...pokemon.addedStats, [stat]: addedVal + 1 },
                                                        statPointsAvailable: pointsLeft - 1,
                                                        statAllocationHistory: [...(pokemon.statAllocationHistory || []), stat]
                                                    });
                                                }
                                            }}
                                            disabled={plusDisabled}
                                            title={addBlockReason || undefined}
                                            className="stat-alloc-btn"
                                            style={{ ...statBtnStyle, opacity: plusDisabled ? 0.45 : 1, cursor: plusDisabled ? 'not-allowed' : 'pointer', background: plusDisabled ? 'var(--border-light)' : statBtnStyle.background, color: plusDisabled ? 'var(--text-muted)' : statBtnStyle.color }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px', paddingTop: '4px', fontSize: '20px', fontWeight: 'bold' }} title="Total stat (base ± added). Used for damage calculations and skill checks.">
                                        {actualStats[stat]}
                                    </div>
                                    {(addViolates || removeViolates) && (
                                        <div style={{ fontSize: '11px', color: 'var(--color-danger-text)', lineHeight: 1.3, textAlign: 'center', opacity: 0.85 }}>
                                            ⚠ Base Relation
                                        </div>
                                    )}
                                </div>
                                );
                            });
                            })()}
                        </div>

                        <div style={{ marginTop: '8px', padding: '12px 14px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border-light)', borderTop: '3px solid var(--stat-hp)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                                <div title="Maximum Hit Points = Level + (HP stat × 3)">
                                    <div style={{ fontSize: '12px', color: 'var(--stat-hp)', opacity: 0.75, marginBottom: '2px' }}>Max HP</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--stat-hp)' }}>{maxHP}</div>
                                </div>
                                <div title="Same Type Attack Bonus: +0 at Lv.1–4, then +1 per 5 levels (Lv.5=+1, Lv.10=+2, Lv.15=+3 … Lv.100=+20)">
                                    <div style={{ fontSize: '12px', color: 'var(--color-purple)', opacity: 0.75, marginBottom: '2px' }}>STAB Bonus</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-purple)' }}>+{stabBonus}</div>
                                </div>
                                <div title="Current HP after damage. When reduced to 0, the Pokémon faints.">
                                    <div style={{ fontSize: '12px', color: 'var(--stat-hp)', opacity: 0.75, marginBottom: '2px' }}>Current HP</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--stat-hp)' }}>{currentHP}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '8px', textAlign: 'right' }}>
                            <button onClick={() => setEditing(false)} style={{ background: 'var(--tint-purple-bg)', border: '1px solid var(--tint-purple-border)', borderRadius: '12px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-purple)', cursor: 'pointer', fontWeight: 'bold' }}>Set current HP in Battle tab →</button>
                        </div>
                    </div>
                )}

                {editTab === 'moves' && (
                    <div>
                        {/* Known Moves section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Known Moves</span>
                            <button
                                onClick={() => showHelp('move-slots')}
                                style={HELP_BTN_STYLE}
                                aria-label="Help: Move Slots"
                                title="About move slots"
                            >?</button>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px', background: naturalMoveCount >= MAX_NATURAL_MOVES ? 'var(--tint-fail-bg)' : 'var(--tint-success-bg)', color: naturalMoveCount >= MAX_NATURAL_MOVES ? 'var(--color-danger-text)' : 'var(--stat-hp)', border: `1px solid ${naturalMoveCount >= MAX_NATURAL_MOVES ? 'var(--color-danger-text)' : 'var(--stat-hp)'}` }} title={`Natural moves: ${naturalMoveCount} of ${MAX_NATURAL_MOVES}`}>Nat {naturalMoveCount}/{MAX_NATURAL_MOVES}</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px', background: taughtMoveCount >= MAX_TAUGHT_MOVES ? 'var(--tint-fail-bg)' : 'var(--tint-purple-bg)', color: taughtMoveCount >= MAX_TAUGHT_MOVES ? 'var(--color-danger-text)' : 'var(--color-taught)', border: `1px solid ${taughtMoveCount >= MAX_TAUGHT_MOVES ? 'var(--color-danger-text)' : 'var(--color-taught)'}` }} title={`Taught moves: ${taughtMoveCount} of ${MAX_TAUGHT_MOVES}`}>Taught {taughtMoveCount}/{MAX_TAUGHT_MOVES}</span>
                            </div>
                        </div>

                        {(pokemon.moves || []).length === 0 && !showMoveDropdown && (
                            <div style={{ textAlign: 'center', padding: '18px 16px', marginBottom: '10px', borderRadius: '8px', background: 'var(--bg-light)', border: '1px dashed var(--border-medium)' }}>
                                <div style={{ fontSize: '22px', marginBottom: '6px' }}>📭</div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>No moves learned yet</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Use the <strong>Browse</strong> panel below to search for moves, or pick a source filter to see species-specific options.</div>
                            </div>
                        )}

                        {(pokemon.moves || []).map((move, idx) => (
                            <div
                                key={idx}
                                className="move-card"
                                title={showDetail ? `Click to view ${move.name} details` : undefined}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    marginBottom: '6px',
                                    borderRadius: '6px',
                                    borderLeft: `4px solid ${getTypeColor(move.type)}`,
                                    background: `${getTypeColor(move.type)}18`,
                                    cursor: showDetail ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                    if (showDetail) {
                                        const moveData = GAME_DATA?.moves?.[move.name] || move;
                                        showDetail('move', move.name, { ...moveData, type: move.type });
                                    }
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                        <span style={{ padding: '1px 5px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: getTypeColor(move.type), color: getContrastTextColor(getTypeColor(move.type)) }}>{move.type}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 'bold', padding: '1px 5px',
                                            borderRadius: '4px',
                                            background: move.source === 'taught' ? 'var(--color-taught)'
                                                : move.source === 'egg' ? 'var(--stat-satk)'
                                                : move.source === 'custom' ? 'var(--stat-spd)'
                                                : 'var(--stat-hp)',
                                            color: 'white'
                                        }}>{move.source === 'taught' ? 'Taught' : move.source === 'egg' ? 'Egg' : move.source === 'custom' ? 'Custom' : 'Nat'}</span>
                                        <span style={{ padding: '1px 5px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', background: move.category === 'Physical' ? 'var(--move-cat-physical)' : move.category === 'Special' ? 'var(--move-cat-special)' : 'var(--move-cat-status)', color: 'white' }}>{move.category || 'Status'}</span>
                                        <span className="text-muted" style={{ fontSize: '11px' }}>
                                            {move.damage || '—'} · {(() => { const f = GAME_DATA?.moves?.[move.name]?.frequency || move.frequency || 'At-Will'; return f.charAt(0).toUpperCase() + f.slice(1); })()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const removedMove = move;
                                        const removedIdx = idx;
                                        const newMoves = [...(pokemon.moves || [])];
                                        newMoves.splice(idx, 1);
                                        updatePokemon({ moves: newMoves });
                                        toast.show(`Removed ${removedMove.name}`, 'info', 5000, {
                                            label: 'Undo',
                                            onClick: () => {
                                                const restored = [...(pokemon.moves || [])].filter(m => m.name !== removedMove.name);
                                                restored.splice(removedIdx, 0, removedMove);
                                                updatePokemon({ moves: restored });
                                            }
                                        });
                                    }}
                                    aria-label={`Remove ${move.name}`}
                                    title={`Remove ${move.name}`}
                                    style={{
                                        background: 'var(--tint-fail-bg)',
                                        color: 'var(--color-danger-text)',
                                        border: '1px solid var(--tint-fail-border)',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {((pokemon.moves || []).length < MAX_TOTAL_MOVES || naturalMoveCount > 0 || taughtMoveCount > 0) && (
                            <div style={{ marginTop: '14px' }}>
                            {/* Browse toggle — chevron divider style */}
                            <button
                                onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                    padding: '6px 10px', background: 'var(--bg-light)', border: '1px solid var(--border-light)',
                                    borderRadius: showMoveDropdown ? '6px 6px 0 0' : '6px',
                                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px',
                                    transition: 'border-radius 0.1s'
                                }}
                                aria-expanded={showMoveDropdown}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    style={{ transition: 'transform 0.15s ease', transform: showMoveDropdown ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
                                    aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                                Browse Moves
                            </button>
                            {showMoveDropdown && (
                            <div className="add-move-panel" style={{ padding: '10px 12px', border: '1px solid var(--border-light)', borderTop: 'none', borderRadius: '0 0 6px 6px', background: 'var(--bg-light)' }}>

                                {(pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES && (
                                    <div style={{ padding: '6px 10px', background: 'var(--tint-fail-bg)', border: '1px solid var(--tint-fail-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-danger-text)', marginBottom: '8px' }}>
                                        ⚠ All {MAX_TOTAL_MOVES} move slots full — adding a new move will replace an existing one.
                                    </div>
                                )}

                                {/* Search Input */}
                                <div style={{ position: 'relative', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        value={moveSearch}
                                        aria-label="Search moves by name or effect"
                                        onChange={(e) => {
                                            setMoveSearch(e.target.value);
                                            setShowMoveDropdown(true);
                                        }}
                                        onFocus={() => setShowMoveDropdown(true)}
                                        placeholder="Search moves by name or effect..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            paddingRight: moveSearch ? '32px' : '10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-medium)',
                                            boxSizing: 'border-box',
                                            background: 'var(--input-bg)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    {moveSearch && (
                                        <button
                                            onClick={() => setMoveSearch('')}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'var(--text-muted)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            aria-label="Clear move search"
                                        >✕</button>
                                    )}
                                </div>

                                {/* Source Filter Pills */}
                                {(() => {
                                    const hasLevelUp = (pokemon.availableLevelUpMoves?.length || 0) > 0;
                                    const hasTutor   = (pokemon.availableTutorMoves?.length  || 0) > 0;
                                    const hasEgg     = (pokemon.availableEggMoves?.length    || 0) > 0;
                                    const sources = [
                                        { key: 'all',     label: 'All',      count: null },
                                        { key: 'levelup', label: 'Level Up', count: pokemon.availableLevelUpMoves?.length || 0, show: hasLevelUp },
                                        { key: 'tutor',   label: 'Tutor',    count: pokemon.availableTutorMoves?.length  || 0, show: hasTutor  },
                                        { key: 'egg',     label: 'Egg',      count: pokemon.availableEggMoves?.length    || 0, show: hasEgg    },
                                    ].filter(s => s.key === 'all' || s.show);
                                    if (sources.length <= 1) return (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', padding: '5px 8px', background: 'var(--bg-light)', borderRadius: '5px', border: '1px dashed var(--border-medium)' }}>
                                            No species-specific moves found. Search below to add any move manually.
                                        </div>
                                    );
                                    return (
                                        <div role="group" aria-label="Filter moves by source" style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', flexShrink: 0, paddingBottom: '2px' }}>
                                            {sources.map(({ key, label, count }) => {
                                                const active = moveSourceFilter === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => { setMoveSourceFilter(key); setShowMoveDropdown(true); }}
                                                        style={{
                                                            padding: '5px 12px',
                                                            borderRadius: '12px',
                                                            border: '1px solid',
                                                            borderColor: active ? 'var(--color-purple)' : 'var(--border-light)',
                                                            background: active ? 'var(--color-purple)' : 'var(--bg-primary)',
                                                            color: active ? 'white' : 'var(--text-secondary)',
                                                            fontSize: '12px',
                                                            fontWeight: active ? 'bold' : 'normal',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {label}{count != null ? ` (${count})` : ''}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                {/* Filter Controls — framed together with source pills */}
                                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {/* Type Filter */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>Type:</span>
                                            <select
                                                value={moveTypeFilter}
                                                onChange={(e) => setMoveTypeFilter(e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-medium)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    background: moveTypeFilter !== 'all' ? getTypeColor(moveTypeFilter) : 'var(--input-bg)',
                                                    color: moveTypeFilter !== 'all' ? getContrastTextColor(getTypeColor(moveTypeFilter)) : 'var(--text-primary)'
                                                }}
                                            >
                                                <option value="all">All</option>
                                                {pokemonTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Category Filter */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>Cat:</span>
                                            <select
                                                value={moveCategoryFilter}
                                                onChange={(e) => setMoveCategoryFilter(e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-medium)',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    background: 'var(--input-bg)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            >
                                                <option value="all">All</option>
                                                <option value="Physical">Physical</option>
                                                <option value="Special">Special</option>
                                                <option value="Status">Status</option>
                                            </select>
                                        </div>

                                        <span className="text-light" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                                            {filteredMoves.length}{moveSourceFilter === 'all' && !moveSearch && moveTypeFilter === 'all' && moveCategoryFilter === 'all' ? ' of all' : ''} moves
                                        </span>
                                    </div>
                                    {moveSourceFilter === 'all' && !moveSearch && moveTypeFilter === 'all' && moveCategoryFilter === 'all' && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                                            Showing first 100 — search or filter to narrow
                                        </div>
                                    )}
                                </div>

                                {/* Move List */}
                                {showMoveDropdown && (filteredMoves.length > 0 || moveSearch || moveTypeFilter !== 'all' || moveCategoryFilter !== 'all' || moveSourceFilter !== 'all') && (
                                    <div className="move-list-container" style={{
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        borderRadius: '6px'
                                    }}>
                                        {filteredMoves.length > 0 ? (
                                            filteredMoves.map(([name, data, moveLevel]) => {
                                            const isKnown = (pokemon.moves || []).some(m => m.name?.toLowerCase() === name.toLowerCase());
                                            return (
                                                <div
                                                    key={name}
                                                    className="move-list-item"
                                                    style={{
                                                        padding: '8px 10px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start'
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <span
                                                            style={{ fontWeight: 'bold', fontSize: '13px', cursor: showDetail ? 'pointer' : 'default', color: showDetail ? 'var(--color-purple)' : 'inherit' }}
                                                            onClick={() => { if (showDetail) showDetail('move', name, { ...data, type: data.type }); }}
                                                            title={showDetail ? `View ${name} details` : undefined}
                                                        >{name}</span>
                                                        {isKnown && <span style={{ fontSize: '12px', color: 'var(--stat-hp)', fontWeight: 600, marginLeft: '5px' }}>✓</span>}
                                                        {moveLevel != null && (
                                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Lv.{moveLevel === 0 ? 'E' : moveLevel}</span>
                                                        )}
                                                        <div className="text-muted" style={{ fontSize: '12px' }}>
                                                            {data.damage || 'Status'} · {(() => { const f = data.frequency || 'At-Will'; return f.charAt(0).toUpperCase() + f.slice(1); })()}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            background: getTypeColor(data.type),
                                                            color: getContrastTextColor(getTypeColor(data.type)),
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}>{data.type}</span>
                                                        <span style={{
                                                            padding: '2px 5px',
                                                            background: data.category === 'Physical' ? 'var(--move-cat-physical)' : data.category === 'Special' ? 'var(--move-cat-special)' : 'var(--move-cat-status)',
                                                            color: 'white',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}>{data.category || 'Status'}</span>
                                                        <button
                                                            onClick={() => addMoveWithSource(name, data, 'natural')}
                                                            disabled={naturalMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES}
                                                            style={{
                                                                width: '28px', height: '28px', flexShrink: 0,
                                                                background: (naturalMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'var(--border-medium)' : ((naturalMoveCount >= MAX_NATURAL_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'var(--poke-orange)' : 'var(--stat-hp)'),
                                                                color: 'white', border: 'none', borderRadius: '50%',
                                                                fontSize: '14px', fontWeight: 'bold',
                                                                cursor: (naturalMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'not-allowed' : 'pointer',
                                                                opacity: (naturalMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 0.6 : 1,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title={(naturalMoveCount >= MAX_NATURAL_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? "Replace oldest Natural move" : "Add as Natural move"}
                                                            aria-label={`Add ${name} as Natural move`}
                                                        >
                                                            N
                                                        </button>
                                                        <button
                                                            onClick={() => addMoveWithSource(name, data, 'taught')}
                                                            disabled={taughtMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES}
                                                            style={{
                                                                width: '28px', height: '28px', flexShrink: 0,
                                                                background: (taughtMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'var(--border-medium)' : ((taughtMoveCount >= MAX_TAUGHT_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'var(--poke-orange)' : 'var(--color-taught)'),
                                                                color: 'white', border: 'none', borderRadius: '50%',
                                                                fontSize: '14px', fontWeight: 'bold',
                                                                cursor: (taughtMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 'not-allowed' : 'pointer',
                                                                opacity: (taughtMoveCount === 0 && (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? 0.6 : 1,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title={(taughtMoveCount >= MAX_TAUGHT_MOVES || (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) ? "Replace oldest Taught move" : "Add as Taught move"}
                                                            aria-label={`Add ${name} as Taught move`}
                                                        >
                                                            T
                                                        </button>
                                                    </div>
                                                </div>
                                            ); })
                                        ) : (
                                            <div className="text-light" style={{ padding: '20px', textAlign: 'center' }}>
                                                {moveSearch || moveTypeFilter !== 'all' || moveCategoryFilter !== 'all' || moveSourceFilter !== 'all'
                                                    ? 'No moves match your filters'
                                                    : 'Search or filter to find moves'}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                            )}
                            </div>
                        )}
                    </div>
                )}

                {editTab === 'skills' && (
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Pokémon Skills</span>
                                <button
                                    onClick={() => showHelp('pokemon-skills')}
                                    style={{ ...HELP_BTN_STYLE, marginLeft: 'auto' }}
                                    aria-label="Help: Pokémon Skills"
                                    title="About Pokémon skills"
                                >?</button>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Read-only — set by species. Click any skill for details.
                                {(() => {
                                    const total = (pokemon.pokemonSkills || []).length;
                                    const withValues = (pokemon.pokemonSkills || []).filter(s => s.value > 0).length;
                                    if (total === 0 || withValues === total) return null;
                                    return <span style={{ marginLeft: '6px', color: 'var(--text-muted)', fontStyle: 'italic' }}>({withValues} of {total} with values)</span>;
                                })()}
                            </div>
                        </div>

                        {(pokemon.pokemonSkills || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '8px', background: 'var(--bg-light)', border: '1px dashed var(--border-medium)' }}>
                                <div style={{ fontSize: '22px', marginBottom: '6px' }}>🎯</div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>No Skills Data</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Skills come from this Pokémon's species. No skill data is available for <strong>{pokemon.species || 'this species'}</strong> in the Pokédex. Set a species in the <button onClick={() => setEditTab('info')} style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}>Info tab</button> to populate skills.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {(pokemon.pokemonSkills || []).filter(s => s.value === undefined || s.value > 0).map((skill, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (showDetail) {
                                                // Try exact match first, then case-insensitive search
                                                let skillData = GAME_DATA?.pokemonSkills?.[skill.name];
                                                if (!skillData && GAME_DATA?.pokemonSkills) {
                                                    // Try to find a matching skill name (handles "Mindlock" vs "Mind Lock", etc.)
                                                    const normalizedName = skill.name.toLowerCase().replace(/\s+/g, '');
                                                    const matchingKey = Object.keys(GAME_DATA.pokemonSkills).find(key =>
                                                        key.toLowerCase().replace(/\s+/g, '') === normalizedName
                                                    );
                                                    if (matchingKey) skillData = GAME_DATA.pokemonSkills[matchingKey];
                                                }
                                                showDetail('pokemonSkill', skill.name, { ...skillData, value: skill.value });
                                            }
                                        }}
                                        className="skill-display-item"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${(skill.value !== undefined && skill.value > 0) ? 'var(--skill-value-color)' : 'var(--border-light)'}`,
                                            cursor: showDetail ? 'pointer' : 'default',
                                            transition: 'background 0.2s ease'
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0, paddingRight: '10px', opacity: (skill.value === undefined || skill.value === 0) ? 0.55 : 1 }}>
                                            {(() => {
                                                let sd = GAME_DATA?.pokemonSkills?.[skill.name];
                                                if (!sd && GAME_DATA?.pokemonSkills) {
                                                    const n = skill.name.toLowerCase().replace(/\s+/g, '');
                                                    const k = Object.keys(GAME_DATA.pokemonSkills).find(key => key.toLowerCase().replace(/\s+/g, '') === n);
                                                    if (k) sd = GAME_DATA.pokemonSkills[k];
                                                }
                                                return (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{skill.name}</span>
                                                            {sd?.type && (
                                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', textTransform: 'capitalize' }}>{sd.type}</span>
                                                            )}
                                                        </div>
                                                        {sd?.description && (
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {sd.description}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        {(() => {
                                            const hasValue = skill.value !== undefined && skill.value > 0;
                                            if (!hasValue) return null;
                                            return (
                                                <div style={{
                                                    padding: '3px 10px',
                                                    background: 'var(--skill-value-color)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    fontSize: '13px',
                                                    fontWeight: 'bold',
                                                    lineHeight: 1,
                                                    flexShrink: 0
                                                }}>
                                                    {skill.value}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {editTab === 'evolution' && (
                    <div>
                        {getEvolutionOptions && (() => {
                            const { canEvolve, canDevolve } = getEvolutionOptions(pokemon);
                            const STAT_ORDER = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
                            const natureData = GAME_DATA?.natures?.[pokemon.nature];

                            // Mini species card: sprite + types + nature + stat grid
                            const renderSpeciesCard = ({ species, regionalForm, label, types, baseStats, variant = 'neutral' }) => {
                                const spriteUrl = getPokemonSprite({ species, regionalForm });
                                const bgs = {
                                    current: 'var(--bg-light)',
                                    evolve:  'var(--bg-primary)',
                                    locked:  'var(--bg-primary)',
                                    devolve: 'var(--bg-primary)',
                                };
                                const labelColors = {
                                    current: 'var(--text-muted)',
                                    evolve:  'var(--stat-hp)',
                                    locked:  'var(--poke-orange)',
                                    devolve: 'var(--color-danger-text)',
                                };
                                const bg = bgs[variant] || 'var(--bg-light)';
                                const labelColor = labelColors[variant] || 'var(--text-muted)';
                                // Border: type color(s) — gradient for dual-type, solid for single, fallback to variant color
                                const type1Color = types?.[0] ? getTypeColor(types[0]) : null;
                                const type2Color = types?.[1] ? getTypeColor(types[1]) : null;
                                const borderBg = type1Color && type2Color
                                    ? `linear-gradient(135deg, ${type1Color}, ${type2Color})`
                                    : type1Color || labelColor;

                                return (
                                    <div style={{ flex: '1 1 100px', minWidth: '90px', background: borderBg, borderRadius: '10px', padding: '2px', position: 'relative' }}>
                                    <div style={{ textAlign: 'center', padding: '10px 6px', borderRadius: '8px', background: bg, position: 'relative', height: '100%' }}>
                                        {/* Locked badge */}
                                        {variant === 'locked' && (
                                            <span style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '12px', lineHeight: 1 }} title="Evolution locked">🔒</span>
                                        )}
                                        {label && (
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: labelColor, marginBottom: '6px' }}>
                                                {label.codePointAt(0) > 0x2000 ? (
                                                    <>{String.fromCodePoint(label.codePointAt(0))}{' '}<span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label.slice(label.indexOf(' ') + 1)}</span></>
                                                ) : (
                                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                                                )}
                                            </div>
                                        )}
                                        {spriteUrl ? (
                                            <img
                                                src={spriteUrl}
                                                alt={species}
                                                style={{ width: '64px', height: '64px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                                                onError={e => { e.target.style.visibility = 'hidden'; }}
                                            />
                                        ) : (
                                            <div style={{ width: '64px', height: '64px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>❓</div>
                                        )}
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', lineHeight: 1.3 }}>
                                            {regionalForm ? `${regionalForm} ` : ''}{species}
                                        </div>
                                        {types?.length > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '4px 0' }}>
                                                {types.map(t => (
                                                    <span key={t} style={{ padding: '1px 5px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: getTypeColor(t), color: getContrastTextColor(getTypeColor(t)) }}>{t}</span>
                                                ))}
                                            </div>
                                        )}
                                        {/* Nature — shown on all cards so players can compare stat impact */}
                                        {pokemon.nature && (
                                            <div style={{ margin: '4px 0 2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '11px', padding: '1px 4px', borderRadius: '6px', background: 'var(--tint-purple-bg)', color: 'var(--color-purple)', fontWeight: 'bold', border: '1px solid var(--tint-purple-border)' }}>
                                                    {pokemon.nature}
                                                </span>
                                                {natureData?.buff && <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-success-text)' }}>+{natureData.buff.toUpperCase()}</span>}
                                                {natureData?.nerf && <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-danger-text)' }}>−{natureData.nerf.toUpperCase()}</span>}
                                                {!natureData?.buff && !natureData?.nerf && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>neutral</span>}
                                            </div>
                                        )}
                                        {baseStats && (() => {
                                            const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', satk: 'SAtk', sdef: 'SDef', spd: 'Spd' };
                                            const natureMod = applyNature(baseStats, pokemon.nature);
                                            const bst = STAT_ORDER.reduce((sum, s) => sum + (baseStats[s] || 0), 0);
                                            return (
                                                <div style={{ marginTop: '6px', textAlign: 'left' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 4px' }}>
                                                        {STAT_ORDER.map(s => {
                                                            const raw = baseStats[s] || 0;
                                                            const modded = natureMod[s] || 0;
                                                            const isBuff = natureData?.buff === s;
                                                            const isNerf = natureData?.nerf === s;
                                                            return (
                                                                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2px' }}>
                                                                    <span style={{ fontSize: '10px', color: `var(--stat-${s})`, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{STAT_LABELS[s]}</span>
                                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: isBuff ? 'var(--color-success-text)' : isNerf ? 'var(--color-danger-text)' : 'var(--text-primary)' }}>
                                                                        {pokemon.nature ? modded : raw}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ marginTop: '3px', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                                        BST <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{bst}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    </div>
                                );
                            };

                            return (
                                <>
                                    {canEvolve && canEvolve.length > 0 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>Evolution Options</div>
                                            {canEvolve.map((evo, idx) => {
                                                const targetData = pokedex?.find(p => p.species?.toLowerCase() === evo.species?.toLowerCase());
                                                // Regional forms may have different types than the base species in the pokedex;
                                                // use types stored on the evo entry if present, otherwise fall back to pokedex
                                                const targetTypes = evo.types || targetData?.types;
                                                return (
                                                    <div key={idx} style={{ marginBottom: '10px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--surface-bg)' }}>
                                                        {/* Sprite comparison */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                            {renderSpeciesCard({
                                                                species: pokemon.species, regionalForm: pokemon.regionalForm,
                                                                label: 'Current', types: pokemon.types, baseStats: pokemon.baseStats, variant: 'current'
                                                            })}
                                                            <div style={{ flexShrink: 0, width: 28, textAlign: 'center', alignSelf: 'center' }}>
                                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: evo.canEvolveNow ? 'var(--stat-hp)' : 'var(--border-medium)', lineHeight: 1 }}>→</span>
                                            </div>
                                                            {renderSpeciesCard({
                                                                species: evo.species, regionalForm: evo.regionalForm,
                                                                label: evo.canEvolveNow ? 'Evolves into' : 'Next Form',
                                                                types: targetTypes, baseStats: targetData?.baseStats,
                                                                variant: evo.canEvolveNow ? 'evolve' : 'locked',
                                                                showNature: false
                                                            })}
                                                        </div>
                                                        {/* Requirement + action */}
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                                            {evo.canEvolveNow ? (
                                                                <div title={`${evo.reason || evo.requirement}${evo.note ? ` (${evo.note})` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-success-text)', padding: '4px 10px', borderRadius: '12px', background: 'var(--tint-success-bg)', border: '1px solid var(--stat-hp)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    ✓ {evo.reason || evo.requirement}
                                                                    {evo.note && ` (${evo.note})`}
                                                                </div>
                                                            ) : (
                                                                <div title={`${evo.reason || evo.requirement}${evo.note ? ` (${evo.note})` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--poke-orange)', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', background: 'var(--tint-orange-bg)', border: '1px solid var(--tint-orange-border)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    🔒 {evo.reason || evo.requirement}
                                                                    {evo.note && ` (${evo.note})`}
                                                                </div>
                                                            )}
                                                            {evo.canEvolveNow && evolvePokemon && (
                                                                <button
                                                                    onClick={() => showConfirm({
                                                                        title: `Evolve into ${evo.species}?`,
                                                                        message: `Evolve ${pokemon.name || pokemon.species} into ${evo.regionalForm ? `${evo.regionalForm} ` : ''}${evo.species}? Stat allocation will be reset — you'll reallocate all points against ${evo.species}'s base relation.`,
                                                                        confirmLabel: 'Evolve',
                                                                        onConfirm: () => evolvePokemon(pokemon.id, evo.species, evo.regionalForm, evo.needsItem)
                                                                    })}
                                                                    style={{ padding: '6px 16px', background: 'linear-gradient(135deg, var(--stat-hp), #388e3c)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}
                                                                >
                                                                    Evolve{evo.needsItem ? ` (${evo.needsItem})` : ''}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {canDevolve && devolvePokemon && (
                                        <div style={{ paddingTop: canEvolve?.length > 0 ? '16px' : 0, borderTop: canEvolve?.length > 0 ? '1px solid var(--border-light)' : 'none', marginTop: canEvolve?.length > 0 ? '16px' : 0 }}>
                                            {(!canEvolve || canEvolve.length === 0) && (
                                                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                                    No further evolutions available.
                                                </div>
                                            )}
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Devolution</div>
                                            <div style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--surface-bg)' }}>
                                                {/* Sprite comparison */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    {renderSpeciesCard({
                                                        species: pokemon.species, regionalForm: pokemon.regionalForm,
                                                        label: 'Current', types: pokemon.types, baseStats: pokemon.baseStats, variant: 'current'
                                                    })}
                                                    <div style={{ flexShrink: 0, width: 28, textAlign: 'center', alignSelf: 'center' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-danger-text)', lineHeight: 1 }}>←</span>
                                    </div>
                                                    {(() => {
                                                        const prevData = pokedex?.find(p => p.species?.toLowerCase() === canDevolve.species?.toLowerCase());
                                                        const devoRegionalForm = canDevolve.regionalForm || null;
                                                        const regionalFormData = devoRegionalForm
                                                            ? prevData?.regionalForms?.find(f => f.name === devoRegionalForm)
                                                            : null;
                                                        const devoTypes = canDevolve.types || regionalFormData?.types || prevData?.types;
                                                        const devoBaseStats = regionalFormData?.baseStats || prevData?.baseStats;
                                                        return renderSpeciesCard({
                                                            species: canDevolve.species,
                                                            regionalForm: devoRegionalForm,
                                                            label: '⬇ Reverts to',
                                                            types: devoTypes, baseStats: devoBaseStats,
                                                            variant: 'devolve',
                                                            showNature: false
                                                        });
                                                    })()}
                                                </div>
                                                {/* Action */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>Revert to {canDevolve.regionalForm ? `${canDevolve.regionalForm} ` : ''}{canDevolve.species}</div>
                                                    <button
                                                        onClick={() => showConfirm({
                                                            title: 'Devolve Pokémon?',
                                                            message: `Revert ${pokemon.name || pokemon.species} to ${canDevolve.species}? This will update the species and base stats, and reset stat allocation — you'll need to reallocate all points.`,
                                                            confirmLabel: 'Devolve',
                                                            danger: true,
                                                            onConfirm: () => devolvePokemon(pokemon.id, canDevolve.species)
                                                        })}
                                                        style={{ padding: '6px 16px', background: 'var(--danger-btn-start)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}
                                                    >
                                                        Devolve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(!canEvolve || canEvolve.length === 0) && !canDevolve && (
                                        !pokemon.species ? (
                                            <div style={{ padding: '20px 16px', borderRadius: '10px', border: '1px dashed var(--border-medium)', background: 'var(--bg-light)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '22px', marginBottom: '6px' }}>🔍</div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>No species set</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Set a species in the <button onClick={() => setEditTab('info')} style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}>Info tab</button> to see evolution options.</div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '16px', borderRadius: '10px', border: '2px solid var(--stat-hp)', background: 'var(--tint-success-bg)', display: 'flex', justifyContent: 'center' }}>
                                                <div style={{ width: 'min(240px, 100%)' }}>
                                                    {renderSpeciesCard({
                                                        species: pokemon.species, regionalForm: pokemon.regionalForm,
                                                        label: '✅ Final Form', types: pokemon.types, baseStats: pokemon.baseStats, variant: 'current'
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

        </div>
    );
};

const LOYALTY_COLORS = ['var(--color-danger-text)', 'var(--poke-orange)', 'var(--loyalty-neutral)', 'var(--color-success-text)', 'var(--poke-blue)'];
const LOYALTY_LABELS = ['Defiant', 'Wary', 'Neutral', 'Friendly', 'Loyal'];

const quickBtnStyle = {
    width: '28px',
    height: '28px',
    border: '1px solid var(--border-medium)',
    borderRadius: '4px',
    background: 'var(--input-bg)',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)'
};

const quickBtnLabelStyle = {
    padding: '6px 10px',
    border: '1px solid var(--collapsed-quick-btn-border)',
    borderRadius: '4px',
    background: 'var(--collapsed-quick-btn-bg)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--collapsed-btn-text)',
    whiteSpace: 'nowrap'
};

const statBtnStyle = {
    width: '32px',
    height: '32px',
    border: '1px solid var(--border-medium)',
    borderRadius: '4px',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '16px'
};

// Returns a human-readable reason string if applying `delta` to `stat` would violate Base Relation,
// or null if it wouldn't. E.g. "ATK (base 7) must stay above DEF (base 5)".
function getBaseRelationBlockReason(stat, baseStats, addedStats, delta) {
    const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };
    const STATS = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
    const base = baseStats || {};
    const newAdded = { ...addedStats };
    newAdded[stat] = (newAdded[stat] || 0) + delta;
    const totals = {};
    for (const s of STATS) totals[s] = (base[s] || 0) + (newAdded[s] || 0);
    for (const sA of STATS) {
        for (const sB of STATS) {
            if (sA === sB) continue;
            if ((base[sA] || 0) > (base[sB] || 0) && totals[sA] <= totals[sB]) {
                return `${STAT_LABELS[sA]} (base ${base[sA] || 0}) must stay above ${STAT_LABELS[sB]} (base ${base[sB] || 0}) — Base Relation rule (PH2 p.257)`;
            }
        }
    }
    return null;
}

// Returns true if applying `delta` (+1 or -1) to `stat` would violate Base Relation.
// Base Relation rule: for every pair (A, B) where base(A) > base(B), total(A) must > total(B).
function wouldViolateBaseRelation(stat, baseStats, addedStats, delta) {
    const STATS = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
    const base = baseStats || {};
    const newAdded = { ...addedStats };
    newAdded[stat] = (newAdded[stat] || 0) + delta;
    const totals = {};
    for (const s of STATS) {
        totals[s] = (base[s] || 0) + (newAdded[s] || 0);
    }
    for (const sA of STATS) {
        for (const sB of STATS) {
            if (sA === sB) continue;
            if ((base[sA] || 0) > (base[sB] || 0) && totals[sA] <= totals[sB]) return true;
        }
    }
    return false;
}

export default PokemonCard;
