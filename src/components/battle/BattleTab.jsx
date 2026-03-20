// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { calculateSTAB, getActualStats, calculatePokemonHP, parseDice, applyCombatStage, parseHealFormula, parseCritThreshold } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useModal, useTrainerContext, usePokemonContext, useData, useUI } from '../../contexts/index.js';
import { MAX_ROLL_HISTORY } from '../../data/constants.js';
import { getPokemonSprite, getPokemonDisplayImage, getMegaSprite } from '../../utils/pokemonSprite.js';
import TypeMatchupDisplay from './TypeMatchupDisplay.jsx';
import StatusConditionUI from './StatusConditionUI.jsx';
import MegaEvolutionPanel from './MegaEvolutionPanel.jsx';
import HPTracker from './HPTracker.jsx';
import CombatStagesPanel from './CombatStagesPanel.jsx';
import MoveSelector from './MoveSelector.jsx';
import CustomDicePanel from './CustomDicePanel.jsx';
import HealModePanel from './HealModePanel.jsx';
import RollHistory from './RollHistory.jsx';
import DiscordWebhookConfig from './DiscordWebhookConfig.jsx';
import ContestPanel from './ContestPanel.jsx';

// Hardcoded battle form changes for Pokémon not covered by the external Pokédex's megaForms field.
// Zygarde only has one pokedex entry (50% Forme, id L48: HP11 ATK10 DEF12 SATK8 SDEF10 SPD10).
// Zygarde-10% is not a separate pokedex entry — both alternate forms are battle-only transformations.
// Stat boosts are additive deltas calculated from the 50% Forme's PTA base stats.
//   10% Forme  (main game: HP54 ATK100 DEF71 SpA61 SpD85 Spe115 → PTA scale): faster but frailer
//   Complete   (main game: HP216 ATK100 DEF121 SpA91 SpD95 Spe85 → PTA scale): bulkier, slower
const BATTLE_FORM_CHANGES = {
    'Zygarde': [
        {
            name: '10%',
            types: ['Dragon', 'Ground'],
            ability: 'Power Construct',
            statBoosts: { hp: -6, def: -5, satk: -2, sdef: -1, spd: 2 },
        },
        {
            name: 'Complete',
            types: ['Dragon', 'Ground'],
            ability: 'Power Construct',
            statBoosts: { hp: 11, satk: 1, spd: -1 },
        },
    ],
};

// Parse the AC number from a move frequency string, e.g. "EOT – 2" → 2
const parseACFromFrequency = (freq) => {
    if (!freq) return 2;
    const match = freq.match(/[-–]\s*(\d+)/);
    return match ? parseInt(match[1]) : 2;
};

// Convert a CSS hex color string to a Discord integer color
const hexToDiscordColor = (hex) => parseInt((hex || '#667eea').replace('#', ''), 16);


// Collect live battle context to attach to roll entries
const battleContext = (pokemon, hp, megaEvolved, currentMegaForm) => ({
    attackerCurrentHP: hp.current,
    attackerMaxHP: hp.max,
    pokemonSpriteUrl: megaEvolved && currentMegaForm
        ? getMegaSprite(pokemon, currentMegaForm)
        : getPokemonSprite(pokemon),
    activeStatuses: Object.entries(pokemon.statusConditions || {}).filter(([, v]) => v).map(([k]) => k),
    megaEvolved,
    megaFormName: megaEvolved && currentMegaForm ? currentMegaForm.name : null,
});

// PTA Damage Base table (dice objects for rolling)
const ARMS_DB = {
    1: { count: 1, sides: 10, bonus:  4 },
    2: { count: 1, sides: 12, bonus:  6 },
    3: { count: 2, sides:  8, bonus:  6 },
    4: { count: 2, sides: 10, bonus:  8 },
    5: { count: 2, sides: 12, bonus: 10 },
    6: { count: 3, sides: 10, bonus: 12 },
};

// Calculate stat modifier (PTA formula)
const calcStatMod = (stat) => stat >= 10 ? Math.floor((stat - 10) / 2) : -(10 - stat);

// Build a normalized roll-history entry for a Pokemon attack.
// Extra fields (typeColor, attackerCurrentHP, etc.) are spread through unchanged.
const buildPokemonRollEntry = ({
    pokemon, move, moveType, category,
    accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden,
    isHit, isCrit, isStatus,
    dice, rolls, diceTotal, statBonus, stabBonus, total,
    ...extra
}) => ({
    type: 'pokemon',
    pokemon, move, moveType, category,
    accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden,
    isHit, isCrit,
    isStatus: isStatus || false,
    dice: dice || null,
    rolls: rolls || [],
    diceTotal: diceTotal || 0,
    statBonus: statBonus || 0,
    stabBonus: stabBonus || 0,
    total: total || 0,
    timestamp: Date.now(),
    ...extra
});


const BattleTab = () => {
    const { GAME_DATA, pokedex } = useGameData();
    const { showDetail } = useModal();
    const { trainer, setTrainer, party, calculateMaxHP } = useTrainerContext();
    const { updatePokemon } = usePokemonContext();
    const { sendToDiscord, inventory, setInventory } = useData();
    const { showHelp } = useUI();

    const [mode, setMode] = useState('pokemon');
    const [subMode, setSubMode] = useState('battle');
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pta-roll-history') || '[]'); } catch (e) { console.warn('Roll history corrupted, resetting:', e); return []; }
    });
    const [combatStages, setCombatStages] = useState({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });
    const [applyStab, setApplyStab] = useState(true);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const [selectedWeapon, setSelectedWeapon] = useState(null);
    const [acOverride, setAcOverride] = useState('');
    const [megaEvolved, setMegaEvolved] = useState(false);
    const [currentMegaForm, setCurrentMegaForm] = useState(null);

    const selectedPokemon = useMemo(() => party.find(p => p.id === selectedPokemonId) || null, [party, selectedPokemonId]);

    // Clear stale selection if the selected Pokemon is no longer in the party
    useEffect(() => {
        if (selectedPokemonId && !party.some(p => p.id === selectedPokemonId)) {
            setSelectedPokemonId(null);
        }
    }, [party, selectedPokemonId]);

    const megaForms = useMemo(() => {
        if (!selectedPokemon || !pokedex) return [];
        const fromPokedex = pokedex.find(p => p.species === selectedPokemon.species)?.megaForms || [];
        const fromOverride = BATTLE_FORM_CHANGES[selectedPokemon.species] || [];
        return [...fromPokedex, ...fromOverride];
    }, [selectedPokemon, pokedex]);

    // Build the list of weapons the trainer can use for Arms attacks.
    // Unarmed is always available (Arms User). Each Weapon of Choice instance adds its weapon.
    const trainerWeapons = useMemo(() => {
        const weapons = [{ name: 'Unarmed', ac: 6, source: 'Arms User' }];
        (trainer.features || []).forEach(f => {
            if (typeof f === 'object' && f.name === 'Weapon of Choice' && f.weaponType) {
                weapons.push({ name: f.weaponType, ac: 4, source: 'Weapon of Choice' });
            }
        });
        return weapons;
    }, [trainer.features]);

    const healingInventory = useMemo(() => inventory.filter(item => {
        const t = (item.type || '').toLowerCase();
        if (t !== 'healing' && t !== 'berry') return false;
        if ((item.quantity ?? 1) <= 0) return false;
        return parseHealFormula(item.effect || '').type !== 'none';
    }), [inventory]);

    useEffect(() => {
        try {
            localStorage.setItem('pta-roll-history', JSON.stringify(rollHistory));
        } catch (e) {
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                toast.warning('Storage full — roll history could not be saved.');
            }
        }
    }, [rollHistory]);

    useEffect(() => {
        setMegaEvolved(false);
        setCurrentMegaForm(null);
        setAcOverride('');
        // Combat stages reset on switch per PTA rules (PH2 p.256)
        resetCombatStages();
    // eslint-disable-next-line react-hooks/exhaustive-deps — intentional: reset on pokemon switch only; resetCombatStages is stable (useCallback with no deps)
    }, [selectedPokemonId]);

    // Apply mega stat boosts to actual stats
    const getStatsWithMega = useCallback((pokemon) => {
        const baseStats = getActualStats(pokemon);
        if (!megaEvolved || !currentMegaForm?.statBoosts) return baseStats;
        return {
            hp:   baseStats.hp   + (currentMegaForm.statBoosts.hp   || 0),
            atk:  baseStats.atk  + (currentMegaForm.statBoosts.atk  || 0),
            def:  baseStats.def  + (currentMegaForm.statBoosts.def  || 0),
            satk: baseStats.satk + (currentMegaForm.statBoosts.satk || 0),
            sdef: baseStats.sdef + (currentMegaForm.statBoosts.sdef || 0),
            spd:  baseStats.spd  + (currentMegaForm.statBoosts.spd  || 0),
        };
    }, [megaEvolved, currentMegaForm]);

    const handleMegaEvolve = (megaForm) => { setCurrentMegaForm(megaForm); setMegaEvolved(true); };
    const handleMegaRevert = () => { setMegaEvolved(false); setCurrentMegaForm(null); };

    const getPokemonHP = (poke) => {
        if (!poke) return { current: 0, max: 0 };
        const max = calculatePokemonHP(poke);
        // Allow negative HP so HPTracker can show fainted/death-threshold states (GM Guide p.17)
        return { current: max - (poke.currentDamage || 0), max };
    };

    const updateCombatStage = (stat, delta) => {
        setCombatStages(prev => ({ ...prev, [stat]: Math.max(-6, Math.min(6, (prev[stat] || 0) + delta)) }));
    };
    const resetCombatStages = () => setCombatStages({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });

    const rollDice = (count, sides) => {
        const rolls = [];
        for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
        return rolls;
    };

    const addToHistory = (roll) => {
        setRollHistory(prev => [roll, ...prev].slice(0, MAX_ROLL_HISTORY));
        if (sendToDiscord) sendToDiscord(roll, trainer.name);
    };

    const rollPokemonMove = () => {
        if (!selectedPokemon || !selectedMove) return;

        const actualStats = getStatsWithMega(selectedPokemon);
        const isPhysical = selectedMove.category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk';
        const statMod = applyCombatStage(actualStats[statKey] || 0, combatStages[statKey] || 0);

        const defaultAC = parseACFromFrequency(selectedMove.frequency || selectedMove.freq);
        const moveAC = acOverride !== '' ? parseInt(acOverride) || defaultAC : defaultAC;
        const accModifier = combatStages.acc || 0;
        const evaStage = combatStages.eva || 0;
        const critThreshold = parseCritThreshold(selectedMove.description);
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const modifiedAccRoll = accRoll + accModifier;
        const isCrit = accRoll >= critThreshold;
        const isHit = isCrit || modifiedAccRoll >= moveAC + evaStage;
        const acWasOverridden = acOverride !== '';

        const hp = getPokemonHP(selectedPokemon);
        const ctx = battleContext(selectedPokemon, hp, megaEvolved, currentMegaForm);
        const typeColor = hexToDiscordColor(getTypeColor(selectedMove.type));

        const commonFields = {
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: selectedMove.name, moveType: selectedMove.type, category: selectedMove.category,
            accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden, isHit, isCrit, critThreshold,
            typeColor, ...ctx,
        };

        const diceData = parseDice(selectedMove.damage);

        // Status condition penalties (informational — affect defensive stats)
        const statuses = selectedPokemon.statusConditions || {};
        const statusPenalties = [];
        if (statuses.burned)   statusPenalties.push({ status: 'burned',   penalty: 'DEF −2 CS' });
        if (statuses.poisoned || statuses.badlyPoisoned)
            statusPenalties.push({ status: statuses.badlyPoisoned ? 'badly poisoned' : 'poisoned', penalty: 'SDEF −2 CS' });
        if (statuses.paralyzed) statusPenalties.push({ status: 'paralyzed', penalty: 'SPD ÷2' });

        // Collect non-zero combat stages relevant to this roll
        const statLabel = isPhysical ? 'ATK' : 'SATK';
        const baseStatVal = actualStats[statKey] || 0;
        const statBonus = statMod - baseStatVal; // actual stat change from combat stage
        const relevantStages = [
            combatStages.acc ? { label: 'ACC', stage: combatStages.acc, bonus: combatStages.acc, isFlat: true } : null,
            evaStage ? { label: 'EVA', stage: evaStage, bonus: -evaStage, isFlat: true } : null,
            diceData.count > 0 && combatStages[statKey] ? { label: statLabel, stage: combatStages[statKey], bonus: statBonus, base: baseStatVal, boosted: statMod } : null,
        ].filter(Boolean);

        if (diceData.count === 0) {
            addToHistory(buildPokemonRollEntry({ ...commonFields, isStatus: true, relevantStages, statusPenalties }));
            return;
        }

        let rolls = [], diceTotal = 0, stabBonus = 0, total = 0, diceCount = 0;
        if (isHit) {
            diceCount = isCrit ? diceData.count * 2 : diceData.count;
            rolls = rollDice(diceCount, diceData.sides);
            diceTotal = rolls.reduce((sum, r) => sum + r, 0);
            if (applyStab && selectedPokemon.types?.includes(selectedMove.type)) {
                stabBonus = calculateSTAB(selectedPokemon.level || 1);
            }
            total = diceTotal + (isCrit ? diceData.bonus * 2 : diceData.bonus) + statMod + stabBonus;
        }

        addToHistory(buildPokemonRollEntry({
            ...commonFields,
            dice: isHit ? `${diceCount}d${diceData.sides}` : null,
            diceBonus: diceData.bonus,
            rolls, diceTotal, statBonus: statMod, stabBonus, total, relevantStages, statusPenalties
        }));
    };

    const rollTrainerSkill = () => {
        if (!selectedSkill) return;
        const skillData = GAME_DATA.skills[selectedSkill];
        if (!skillData) return;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 6;
        // PH2 p.10: +1 per 2 pts above 10, -1 per pt below 10
        let modifier;
        if (baseStat === 10) modifier = 0;
        else if (baseStat < 10) modifier = -(10 - baseStat);
        else modifier = Math.floor((baseStat - 10) / 2);

        const skills = trainer.skills || {};
        const skillRank = Array.isArray(skills)
            ? (skills.includes(selectedSkill) ? 1 : 0)
            : (skills[selectedSkill] || 0);
        const hasSkill = skillRank > 0;
        // Rank 1: +2 + modifier, Rank 2: +4 + (2×modifier). No skill: plain 1d20.
        const skillBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;

        const rolls = rollDice(1, 20);
        const rollTotal = rolls[0];
        const total = rollTotal + skillBonus;

        const trainerMaxHP = calculateMaxHP();
        const trainerCurrentHP = trainerMaxHP - (trainer.currentDamage || 0);
        addToHistory({ type: 'trainer_skill', skill: selectedSkill, skillStat: skillData.stat, dice: '1d20', rolls, baseStat, modifier, hasSkill, bonus: skillBonus, total, trainerCurrentHP, trainerMaxHP, trainerAvatarUrl: trainer.avatar || null, timestamp: Date.now() });
    };

    const rollTrainerAttack = () => {
        const weapon = trainerWeapons.find(w => w.name === selectedWeapon);
        if (!weapon) return;

        const level = trainer.level || 1;
        const isWoC = weapon.source === 'Weapon of Choice';
        const db = isWoC
            ? (level >= 15 ? 6 : level >= 7 ? 4 : 2)
            : (level >= 15 ? 3 : level >= 7 ? 2 : 1);
        const { count, sides, bonus } = ARMS_DB[db];

        const atkMod = calcStatMod(trainer.stats?.atk || 10);
        const spdMod = calcStatMod(trainer.stats?.spd || 10);
        const statMod = Math.max(atkMod, spdMod);
        const statModLabel = atkMod >= spdMod ? 'ATK' : 'SPD';

        const accRoll = Math.floor(Math.random() * 20) + 1;
        const isCrit = accRoll === 20;
        const isHit = isCrit || accRoll >= weapon.ac;

        const trainerMaxHP = calculateMaxHP();
        const trainerCurrentHP = trainerMaxHP - (trainer.currentDamage || 0);

        let rolls = [], diceTotal = 0, diceBonus = 0, total = 0;
        if (isHit) {
            const diceCount = isCrit ? count * 2 : count;
            rolls = rollDice(diceCount, sides);
            diceTotal = rolls.reduce((s, r) => s + r, 0);
            diceBonus = isCrit ? bonus * 2 : bonus;
            total = diceTotal + diceBonus + statMod;
        }

        addToHistory({
            type: 'trainer_attack',
            trainer: trainer.name || 'Trainer',
            weapon: weapon.name,
            weaponSource: weapon.source,
            weaponAC: weapon.ac,
            db,
            dice: `${count}d${sides}+${bonus}`,
            accRoll, isCrit, isHit,
            rolls, diceTotal, diceBonus,
            statMod, statModLabel,
            total,
            trainerCurrentHP, trainerMaxHP,
            trainerAvatarUrl: trainer.avatar || null,
            timestamp: Date.now()
        });
    };

    const rollCustomDice = () => {
        const diceData = parseDice(customDice);
        if (diceData.count === 0 || diceData.sides === 0) {
            toast.warning('Invalid dice format. Use format like "2d6+5" or "1d20"');
            return;
        }
        const rolls = rollDice(diceData.count, diceData.sides);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        addToHistory({ type: 'custom', dice: customDice, rolls, rollTotal, bonus: diceData.bonus, total: rollTotal + diceData.bonus, timestamp: Date.now() });
    };

    const rollHealItem = (itemName) => {
        const target = party.find(p => p.id === selectedPokemonId);
        if (!target) { toast.warning('Select a Pokémon first.'); return; }
        const invItem = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!invItem) return;
        const formula = parseHealFormula(invItem.effect || '');
        const maxHP = calculatePokemonHP(target);
        let amount = 0, rolls = [], bonus = 0, desc = '';
        if (formula.type === 'dice') {
            const d = parseDice(formula.formula);
            rolls = rollDice(d.count, d.sides);
            bonus = d.bonus;
            amount = rolls.reduce((a, b) => a + b, 0) + bonus;
            desc = formula.formula;
        } else if (formula.type === 'fraction') {
            amount = Math.floor(maxHP * formula.num / formula.denom);
            desc = `${formula.num}/${formula.denom} Max HP`;
        } else {
            toast.info(`Used ${itemName} (status effect only).`);
        }
        const hpBefore = maxHP - (target.currentDamage || 0);
        const hpAfter = Math.min(maxHP, hpBefore + amount);
        if (amount > 0) {
            updatePokemon(target.id, { currentDamage: Math.max(0, (target.currentDamage || 0) - amount) });
        }
        setInventory(prev => {
            const idx = prev.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
            if (idx === -1) return prev;
            const qty = prev[idx].quantity || 1;
            if (qty <= 1) return prev.filter((_, i) => i !== idx);
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: qty - 1 };
            return next;
        });
        addToHistory({ type: 'heal', pokemon: target.name || target.species, item: itemName, formula: desc, rolls, bonus, amount, hpBefore, hpAfter, hpMax: maxHP, pokemonSpriteUrl: getPokemonSprite(target), timestamp: Date.now() });
    };

    return (
        <div>
            <h2 className="section-title">Dice Roller</h2>
            <p className="section-description">
                Roll attacks, contest appeals, skills, and custom dice. Results can be sent to Discord via webhook.
            </p>

            {/* Mode Selector */}
            <div className="tabs" style={{ marginBottom: '15px' }}>
                <button className={`tab ${mode === 'pokemon'  ? 'active' : ''}`} onClick={() => setMode('pokemon')}>⚔️ Pokémon</button>
                <button className={`tab ${mode === 'trainer'  ? 'active' : ''}`} onClick={() => setMode('trainer')}>🎯 Trainer</button>
                <button className={`tab ${mode === 'custom'   ? 'active' : ''}`} onClick={() => setMode('custom')}>🎲 Custom</button>
                <button className={`tab ${mode === 'heal'     ? 'active' : ''}`} onClick={() => setMode('heal')}>🩹 Heal</button>
            </div>

            <div className="grid-responsive-2">
                {/* Left: Roll Controls */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>{mode === 'heal' ? '🩹' : (mode === 'pokemon' && subMode === 'contest') ? '🎭' : '🎲'}</span>{' '}
                        {mode === 'pokemon' && subMode === 'contest' ? 'Contest Appeal'
                            : mode === 'pokemon' ? 'Pokemon Attack'
                            : mode === 'trainer' ? 'Trainer Skill'
                            : mode === 'heal' ? 'Use Healing Item'
                            : 'Custom Roll'}
                    </h3>

                    {mode === 'pokemon' && (
                        <div>
                            {/* Pokémon Selector — shared by both sub-modes */}
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Pokémon</label>
                                <select
                                    value={selectedPokemonId || ''}
                                    onChange={(e) => {
                                        setSelectedPokemonId(parseInt(e.target.value) || null);
                                        setSelectedMove(null);
                                        resetCombatStages();
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Choose a Pokémon...</option>
                                    {party.map(poke => {
                                        const hp = getPokemonHP(poke);
                                        return (
                                            <option key={poke.id} value={poke.id}>
                                                {poke.name || poke.species} (Lv.{poke.level}) — HP: {hp.current}/{hp.max}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Pokémon Sprite — shared by both sub-modes */}
                            {selectedPokemon && (() => {
                                const img = megaEvolved && currentMegaForm
                                    ? getMegaSprite(selectedPokemon, currentMegaForm)
                                    : getPokemonDisplayImage(selectedPokemon);
                                if (!img) return null;
                                return (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        <img
                                            src={img}
                                            alt={selectedPokemon.name || selectedPokemon.species}
                                            style={{ width: '96px', height: '96px', objectFit: 'contain', imageRendering: !selectedPokemon.avatar ? 'pixelated' : 'auto' }}
                                        />
                                    </div>
                                );
                            })()}

                            {/* Battle / Contest sub-toggle */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
                                <button
                                    onClick={() => setSubMode('battle')}
                                    style={{
                                        flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                                        background: subMode === 'battle' ? 'var(--gradient-purple)' : 'transparent',
                                        color: subMode === 'battle' ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 0.15s',
                                    }}
                                >⚔️ Battle</button>
                                <button
                                    onClick={() => setSubMode('contest')}
                                    style={{
                                        flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                                        background: subMode === 'contest' ? 'linear-gradient(135deg, #e91e63, #9c27b0)' : 'transparent',
                                        color: subMode === 'contest' ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 0.15s',
                                    }}
                                >🎭 Contest</button>
                            </div>

                            {/* Contest sub-mode */}
                            {subMode === 'contest' && (
                                <ContestPanel selectedPokemon={selectedPokemon} gameData={GAME_DATA} onRoll={addToHistory} />
                            )}

                            {/* Battle sub-mode */}
                            {subMode === 'battle' && (
                                <div>
                                    {/* Held Item */}
                                    {selectedPokemon?.heldItem && (() => {
                                        const itemData = GAME_DATA?.items?.[selectedPokemon.heldItem];
                                        return (
                                            <div
                                                onClick={() => { if (showDetail && itemData) showDetail('item', selectedPokemon.heldItem, itemData); }}
                                                style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', cursor: showDetail && itemData ? 'pointer' : 'default' }}
                                                title={itemData ? 'Click to view item details' : selectedPokemon.heldItem}
                                            >
                                                <span style={{ fontSize: '16px' }}>🎒</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Held Item</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedPokemon.heldItem}</div>
                                                    {itemData?.effect && (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{itemData.effect}</div>
                                                    )}
                                                </div>
                                                {showDetail && itemData && (
                                                    <span style={{ fontSize: '13px', color: 'var(--color-purple)', flexShrink: 0 }}>Details →</span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Pokémon HP Tracker */}
                                    {selectedPokemon && (() => {
                                        const hp = getPokemonHP(selectedPokemon);
                                        return (
                                            <HPTracker
                                                label="HP"
                                                currentHP={hp.current}
                                                maxHP={hp.max}
                                                level={selectedPokemon.level}
                                                onDamage={(val) => updatePokemon(selectedPokemon.id, { currentDamage: Math.min(hp.max * 2, (selectedPokemon.currentDamage || 0) + val) })}
                                                onHeal={(val) => updatePokemon(selectedPokemon.id, { currentDamage: Math.max(0, (selectedPokemon.currentDamage || 0) - val) })}
                                                onFull={() => updatePokemon(selectedPokemon.id, { currentDamage: 0 })}
                                            />
                                        );
                                    })()}

                                    <TypeMatchupDisplay selectedPokemon={selectedPokemon} megaEvolved={megaEvolved} currentMegaForm={currentMegaForm} />

                                    <StatusConditionUI selectedPokemon={selectedPokemon} updatePokemon={updatePokemon} />

                                    <MegaEvolutionPanel
                                        selectedPokemon={selectedPokemon}
                                        megaForms={megaForms}
                                        megaEvolved={megaEvolved}
                                        currentMegaForm={currentMegaForm}
                                        onMegaEvolve={handleMegaEvolve}
                                        onMegaRevert={handleMegaRevert}
                                        label={BATTLE_FORM_CHANGES[selectedPokemon?.species] ? 'Form Change' : 'Mega Evolution'}
                                        isFormChange={!!BATTLE_FORM_CHANGES[selectedPokemon?.species]}
                                    />

                                    {/* Section divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0 8px' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>Combat Modifiers</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                                    </div>

                                    <CombatStagesPanel
                                        selectedPokemon={selectedPokemon}
                                        combatStages={combatStages}
                                        getStatsWithMega={getStatsWithMega}
                                        updateCombatStage={updateCombatStage}
                                        resetCombatStages={resetCombatStages}
                                        onHelp={() => showHelp('combat-stages')}
                                        statusConditions={selectedPokemon?.statusConditions}
                                    />

                                    {/* STAB Toggle */}
                                    {selectedPokemon && (
                                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                title="Same Type Attack Bonus - extra damage when using moves that match the Pokémon's type. Scales with level."
                                            >
                                                <input type="checkbox" checked={applyStab} onChange={(e) => setApplyStab(e.target.checked)} />
                                                <span style={{ fontSize: '13px' }}>Apply STAB</span>
                                            </label>
                                            <span
                                                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                                                title="Same Type Attack Bonus (STAB): +1 at Lv.5, +2 at Lv.10, +3 at Lv.15, +4 at Lv.20… (+1 per 5 levels)"
                                            >
                                                (+{calculateSTAB(selectedPokemon.level || 1)} for matching type)
                                            </span>
                                        </div>
                                    )}

                                    {/* AC Override */}
                                    {selectedPokemon && (
                                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }} title="Override the move's Accuracy Class (higher = harder to hit)">
                                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>AC Override:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={acOverride}
                                                onChange={(e) => setAcOverride(e.target.value)}
                                                placeholder={selectedMove ? String(parseACFromFrequency(selectedMove.frequency || selectedMove.freq)) : 'default'}
                                                style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: acOverride !== '' ? '2px solid var(--color-purple)' : '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center', background: acOverride !== '' ? 'var(--input-bg-hover)' : 'var(--input-bg)', color: 'var(--text-primary)' }}
                                            />
                                            {acOverride !== '' ? (
                                                <button onClick={() => setAcOverride('')} style={{ padding: '4px 8px', background: 'var(--tint-fail-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--tint-fail-border)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} title="Clear AC override" aria-label="Clear AC override">✕ Clear</button>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {selectedMove ? `Default: AC ${parseACFromFrequency(selectedMove.frequency || selectedMove.freq)}` : 'Set to override move default'}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Section divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0 8px' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>Select Move &amp; Roll</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                                    </div>

                                    <MoveSelector
                                        selectedPokemon={selectedPokemon}
                                        selectedMove={selectedMove}
                                        onSelectMove={setSelectedMove}
                                        showDetail={showDetail}
                                        gameData={GAME_DATA}
                                    />

                                    {/* Roll Button */}
                                    <button
                                        onClick={rollPokemonMove}
                                        disabled={!selectedPokemon || !selectedMove}
                                        title={!selectedPokemon ? 'Select a Pokémon first' : !selectedMove ? 'Select a move first' : undefined}
                                        style={{ width: '100%', padding: '15px', background: selectedPokemon && selectedMove ? 'var(--gradient-purple)' : 'var(--collapsed-btn-bg)', color: selectedPokemon && selectedMove ? 'white' : 'var(--collapsed-btn-text)', border: 'none', borderRadius: '8px', cursor: selectedPokemon && selectedMove ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        {selectedPokemon && selectedMove ? `Roll ${selectedMove.name}!` : 'Select a Pokémon & move'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'trainer' && (
                        <div>
                            {/* Trainer Stats Display */}
                            <div className="trainer-stats-display" style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {trainer.name || 'Trainer'} - Level {trainer.level || 1}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                    {(() => {
                                        const activeStatKey = selectedSkill && GAME_DATA.skills?.[selectedSkill]?.stat
                                            ? GAME_DATA.skills[selectedSkill].stat.toLowerCase()
                                            : null;
                                        return [
                                            { key: 'hp',   label: 'HP',   color: '#e53935' },
                                            { key: 'atk',  label: 'ATK',  color: '#ff5722' },
                                            { key: 'def',  label: 'DEF',  color: '#2196f3' },
                                            { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                            { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                            { key: 'spd',  label: 'SPD',  color: '#00bcd4' },
                                        ].map(stat => {
                                            const value = trainer.stats?.[stat.key] || 10;
                                            const mod = value >= 10 ? Math.floor((value - 10) / 2) : -(10 - value);
                                            const isActive = stat.key === activeStatKey;
                                            return (
                                                <div key={stat.key} className="trainer-stat-mini-box" style={{ textAlign: 'center', padding: '4px', borderRadius: '4px', outline: isActive ? `2px solid ${stat.color}` : 'none', background: isActive ? `${stat.color}18` : undefined }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
                                                    <div style={{ fontSize: '12px', color: mod >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>{mod >= 0 ? '+' : ''}{mod}</div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                                {trainer.skills && (Array.isArray(trainer.skills) ? trainer.skills.length > 0 : Object.keys(trainer.skills).length > 0) && (
                                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                        <strong>Trained Skills:</strong>{' '}
                                        {Array.isArray(trainer.skills)
                                            ? trainer.skills.join(', ')
                                            : Object.entries(trainer.skills).filter(([, rank]) => rank > 0).map(([name, rank]) => rank === 2 ? `${name} ★★` : name).join(', ')}
                                    </div>
                                )}
                            </div>

                            {/* Trainer HP Tracker */}
                            {(() => {
                                const maxHP = calculateMaxHP();
                                // Allow negative HP so HPTracker can show fainted/death-threshold states (GM Guide p.17)
                                const currentHP = maxHP - (trainer.currentDamage || 0);
                                return (
                                    <HPTracker
                                        label="Trainer HP"
                                        currentHP={currentHP}
                                        maxHP={maxHP}
                                        level={trainer.level || 1}
                                        isTrainer
                                        onDamage={(val) => setTrainer(prev => ({ ...prev, currentDamage: Math.min(maxHP * 2, (prev.currentDamage || 0) + val) }))}
                                        onHeal={(val) => setTrainer(prev => ({ ...prev, currentDamage: Math.max(0, (prev.currentDamage || 0) - val) }))}
                                        onFull={() => setTrainer(prev => ({ ...prev, currentDamage: 0 }))}
                                    />
                                );
                            })()}

                            {/* Skill Selector */}
                            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Skill</label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Choose a skill...</option>
                                {Object.entries(GAME_DATA.skills || {}).map(([name, data]) => {
                                    const skills = trainer.skills || {};
                                    const rank = Array.isArray(skills) ? (skills.includes(name) ? 1 : 0) : (skills[name] || 0);
                                    return (
                                        <option key={name} value={name}>
                                            {name} ({data.stat}) {rank > 0 ? (rank === 2 ? '✓✓ Rank 2' : '✓ Trained') : ''}
                                        </option>
                                    );
                                })}
                            </select>

                            {/* Selected Skill Info */}
                            {selectedSkill && GAME_DATA.skills?.[selectedSkill] && (() => {
                                const skillData = GAME_DATA.skills[selectedSkill];
                                const statKey = skillData.stat?.toLowerCase();
                                const baseStat = trainer.stats?.[statKey] || 10;
                                const modifier = baseStat >= 10 ? Math.floor((baseStat - 10) / 2) : -(10 - baseStat);
                                const skills = trainer.skills || {};
                                const skillRank = Array.isArray(skills) ? (skills.includes(selectedSkill) ? 1 : 0) : (skills[selectedSkill] || 0);
                                const hasTrained = skillRank > 0;
                                const trainedBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;
                                return (
                                    <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                                        <div><strong>{selectedSkill}</strong> ({skillData.stat})</div>
                                        <div style={{ marginTop: '4px' }} title="Roll 1d20. Trained skills add a bonus: Rank 1 = +2 + modifier, Rank 2 = +4 + (2× modifier). No skill = plain 1d20.">
                                            Roll: 1d20
                                            {hasTrained && <span style={{ color: 'var(--color-success-text)' }} title={`Rank ${skillRank} trained skill bonus`}> +{trainedBonus} (rank {skillRank})</span>}
                                        </div>
                                        <div className="text-muted" style={{ marginTop: '2px' }}>{skillData.description}</div>
                                    </div>
                                );
                            })()}

                            <button
                                onClick={rollTrainerSkill}
                                disabled={!selectedSkill}
                                style={{ width: '100%', padding: '15px', background: selectedSkill ? 'var(--gradient-purple)' : 'var(--collapsed-btn-bg)', color: selectedSkill ? 'white' : 'var(--collapsed-btn-text)', border: 'none', borderRadius: '8px', cursor: selectedSkill ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                Roll Skill Check!
                            </button>

                            {/* Arms Attack */}
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Arms Attack</label>
                                <select
                                    value={selectedWeapon || ''}
                                    onChange={e => setSelectedWeapon(e.target.value || null)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Choose weapon...</option>
                                    {trainerWeapons.map(w => (
                                        <option key={w.name} value={w.name}>{w.name} — AC {w.ac} ({w.source})</option>
                                    ))}
                                </select>

                                {selectedWeapon && (() => {
                                    const weapon = trainerWeapons.find(w => w.name === selectedWeapon);
                                    if (!weapon) return null;
                                    const level = trainer.level || 1;
                                    const isWoC = weapon.source === 'Weapon of Choice';
                                    const db = isWoC ? (level >= 15 ? 6 : level >= 7 ? 4 : 2) : (level >= 15 ? 3 : level >= 7 ? 2 : 1);
                                    const { count, sides, bonus } = ARMS_DB[db];
                                    const atkMod = calcStatMod(trainer.stats?.atk || 10);
                                    const spdMod = calcStatMod(trainer.stats?.spd || 10);
                                    const statMod = Math.max(atkMod, spdMod);
                                    const statModLabel = atkMod >= spdMod ? 'ATK' : 'SPD';
                                    return (
                                        <div className="skill-info-box" style={{ marginBottom: '8px', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                                            <div><strong>{weapon.name}</strong> — {weapon.source}</div>
                                            <div style={{ marginTop: '4px' }}>
                                                AC: <strong>{weapon.ac}</strong>
                                                {'  ·  '}
                                                DB{db}: <strong>{count}d{sides}+{bonus}</strong>
                                                {statMod !== 0 && (
                                                    <span style={{ color: statMod > 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                        {' '}{statMod > 0 ? '+' : ''}{statMod} {statModLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-muted" style={{ marginTop: '2px' }}>Normal type · Physical · Natural 20 = crit (double dice & bonus)</div>
                                        </div>
                                    );
                                })()}

                                <button
                                    onClick={rollTrainerAttack}
                                    disabled={!selectedWeapon}
                                    style={{ width: '100%', padding: '15px', background: selectedWeapon ? 'linear-gradient(135deg, #e53935, #c62828)' : 'var(--collapsed-btn-bg)', color: selectedWeapon ? 'white' : 'var(--collapsed-btn-text)', border: 'none', borderRadius: '8px', cursor: selectedWeapon ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                                >
                                    {selectedWeapon ? `Roll Attack (${selectedWeapon})!` : 'Select a weapon'}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <CustomDicePanel customDice={customDice} setCustomDice={setCustomDice} onRoll={rollCustomDice} />
                    )}

                    {mode === 'heal' && (
                        <HealModePanel
                            selectedPokemonId={selectedPokemonId}
                            setSelectedPokemonId={setSelectedPokemonId}
                            party={party}
                            healingInventory={healingInventory}
                            onUseItem={rollHealItem}
                        />
                    )}

                    <DiscordWebhookConfig />
                </div>

                {/* Right: Roll History — hidden in contest mode (result box is sufficient) */}
                {!(mode === 'pokemon' && subMode === 'contest') && (
                    <RollHistory rollHistory={rollHistory} setRollHistory={setRollHistory} mode={mode} subMode={subMode} />
                )}
            </div>
        </div>
    );
};

export default BattleTab;
