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

// Build the common species update fields shared by applySpeciesToPokemon,
// applyEvolutionToPokemon, applyDevolutionToPokemon, and demo trainer setup.
export const buildSpeciesUpdateFields = (speciesData, regionalForm) => {
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
            availableLevelUpMoves: formData?.levelUpMoves || speciesData.levelUpMoves || [],
            availableEggMoves: formData?.eggMoves || speciesData.eggMoves || [],
            availableTutorMoves: formData?.tutorMoves || speciesData.tutorMoves || [],
            pokemonSkills: buildPokemonSkills(speciesData.skills),
        }
    };
};
