// ============================================================
// SPECIES FIELD HELPERS
// ============================================================
// Pure data-transformation helpers for deriving a Pokémon's linked
// species fields (move pools, skills, abilities) from Pokédex data.
// Kept dependency-free (no React/contexts) so both PokemonContext and
// DataContext can import them without a circular import.

// Pokédex skill key → display name mappings (shared by apply/evolve/devolve)
const POKEMON_SKILL_MAPPINGS = [
    ['overland', 'Overland'], ['surface', 'Surface'], ['sky', 'Sky'],
    ['burrow', 'Burrow'], ['underwater', 'Underwater'], ['jump', 'Jump'],
    ['power', 'Power'], ['intelligence', 'Intelligence']
];

const POKEMON_CAPABILITY_MAPPINGS = [
    ['phasing', 'Phasing'], ['invisibility', 'Invisibility'], ['zapper', 'Zapper'],
    ['firestarter', 'Firestarter'], ['gilled', 'Gilled'], ['tracker', 'Tracker'],
    ['threaded', 'Threaded'], ['mindLock', 'Mind Lock'], ['telepath', 'Telepath'],
    ['telekinetic', 'Telekinetic'], ['aura', 'Aura'], ['amorphous', 'Amorphous'],
    ['chilled', 'Chilled'], ['climber', 'Climber'], ['stealth', 'Stealth'],
    ['fountain', 'Fountain'], ['freezer', 'Freezer'], ['glow', 'Glow'],
    ['groundshaker', 'Groundshaker'], ['guster', 'Guster'], ['heater', 'Heater'],
    ['magnetic', 'Magnetic'], ['sprouter', 'Sprouter'], ['sinker', 'Sinker'],
    ['packMon', 'Pack Mon'], ['empath', 'Telepath'], ['illusionist', 'Invisibility'],
    ['dreamEater', 'Dream Smoke'], ['warp', 'Phasing'],
    ['extinguisher', 'Extinguisher'], ['impenetrable', 'Impenetrable'],
    ['mindslaver', 'Mindslaver'], ['powerOfTheLand', 'Power of the Land']
];

// Build Pokemon skills array from a Pokédex species.skills object
export const buildPokemonSkills = (skills) => {
    const result = [];
    if (!skills) return result;
    POKEMON_SKILL_MAPPINGS.forEach(([key, name]) => {
        if (skills[key] !== undefined && skills[key] !== null) {
            result.push({ name, value: skills[key] });
        }
    });
    POKEMON_CAPABILITY_MAPPINGS.forEach(([key, name]) => {
        if (skills[key]) result.push({ name });
    });
    if (Array.isArray(skills.naturewalk)) {
        skills.naturewalk.forEach(terrain => result.push({ name: `Naturewalk (${terrain})` }));
    }
    return result;
};

// Species whose own levelUpMoves is empty in the Pokédex data, mapped to their
// known pre-evolution. Level evolutions record a reverse link via the
// pre-evolution's `evolutions[].to` field (see getEffectiveLevelUpMoves below),
// but non-level evolutions (stone, friendship) don't populate that link in this
// dataset, so those known gaps need an explicit fallback.
const PREVOLUTION_FALLBACK = {
    'Raichu': 'Pikachu',
    'Ninetales': 'Vulpix',
    'Simisage': 'Pansage',
    'Simisear': 'Pansear',
    'Simipour': 'Panpour',
    'Ludicolo': 'Lombre',
    'Musharna': 'Munna',
    'Clefable': 'Clefairy',
    'Wigglytuff': 'Jigglypuff',
    'Delcatty': 'Skitty',
    'Cinccino': 'Minccino',
    'Chandelure': 'Lampent',
    'Mismagius': 'Misdreavus',
};

// An evolved species with an empty levelUpMoves list inherits its
// pre-evolution's learnset. Walks the chain (bounded by a visited-set) so a
// multi-stage family still resolves if an intermediate stage is also empty.
export const getEffectiveLevelUpMoves = (speciesData, allSpecies) => {
    if (speciesData?.levelUpMoves?.length > 0) return speciesData.levelUpMoves;
    if (!Array.isArray(allSpecies) || !speciesData?.species) return speciesData?.levelUpMoves || [];

    const findByName = (name) => allSpecies.find(p => p.species?.toLowerCase() === name.toLowerCase());

    let current = speciesData;
    const visited = new Set();
    while (current && !(current.levelUpMoves?.length > 0)) {
        if (visited.has(current.species)) break;
        visited.add(current.species);

        const preEvo = allSpecies.find(p => p.evolutions?.some(e => e.to === current.species))
            || (PREVOLUTION_FALLBACK[current.species] ? findByName(PREVOLUTION_FALLBACK[current.species]) : null);

        if (!preEvo) break;
        current = preEvo;
    }
    return current?.levelUpMoves?.length > 0 ? current.levelUpMoves : (speciesData.levelUpMoves || []);
};

// Build the common species update fields shared by applySpeciesToPokemon,
// applyEvolutionToPokemon, applyDevolutionToPokemon, and demo trainer setup.
// `allSpecies` (the full pokedex + custom species list) is optional — pass it
// when available so evolved species with an empty levelUpMoves can inherit
// their pre-evolution's learnset instead of showing zero learnable moves.
export const buildSpeciesUpdateFields = (speciesData, regionalForm, allSpecies) => {
    const isRegional = regionalForm && !regionalForm.isBase;
    const formData = isRegional ? regionalForm : null;
    return {
        isRegional,
        formData,
        updates: {
            species: speciesData.species,
            types: formData ? [...formData.types] : [...speciesData.types],
            baseStats: formData?.baseStats ? { ...formData.baseStats } : { ...speciesData.baseStats },
            availableAbilities: formData?.abilities ? { ...formData.abilities } : (speciesData.abilities ? { ...speciesData.abilities } : null),
            pokedexId: speciesData.id,
            regionalForm: isRegional ? regionalForm.name : null,
            availableLevelUpMoves: formData?.levelUpMoves || getEffectiveLevelUpMoves(speciesData, allSpecies),
            availableEggMoves: formData?.eggMoves || speciesData.eggMoves || [],
            availableTutorMoves: formData?.tutorMoves || speciesData.tutorMoves || [],
            pokemonSkills: buildPokemonSkills(speciesData.skills),
        }
    };
};
