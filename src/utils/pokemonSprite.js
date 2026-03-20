// ============================================================
// Pokémon Sprite Utility
// ============================================================
// Derives a Pokémon Showdown sprite URL from a species name so that
// Pokémon images are available automatically without manual uploads.
// Uses the name rather than a numeric ID so the result is correct
// regardless of whether PTA's internal Pokédex IDs match the national
// Pokédex numbers.

export const speciesSlug = (species) =>
    (species || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics (e.g. Flabébé → Flabebe)
        .toLowerCase()
        .replace(/♀/g, '-f')
        .replace(/♂/g, '-m')
        .replace(/[.'\u2019%]/g, '')      // remove periods, apostrophes, and % (e.g. Zygarde-10%)
        .replace(/[:\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

// Pokémon whose Showdown sprite filenames differ from the standard slug
// (Showdown drops hyphens for these specific names).
const SLUG_OVERRIDES = {
    'mime-jr':   'mimejr',
    'mr-mime':   'mrmime',
    'jangmo-o':  'jangmoo',
    'hakamo-o':  'hakamoo',
    'kommo-o':   'kommoo',
    'porygon-z': 'porygonz',
    'type-null': 'typenull',
    'nidoran-f': 'nidoranf',
    'nidoran-m': 'nidoranm',
    'tapu-bulu': 'tapubulu',
    'tapu-fini': 'tapufini',
    'tapu-koko': 'tapukoko',
    'tapu-lele': 'tapulele',
    'ho-oh':     'hooh',
};

// Maps PTA regional/alternate form names to Pokémon Showdown sprite suffixes.
const REGIONAL_FORM_SUFFIXES = {
    // Regional variants
    'alolan':   'alola',
    'galarian': 'galar',
    'hisuian':  'hisui',
    'paldean':  'paldea',
    // Lycanroc alternate forms (stored as regionalForm in evolutionChains)
    'night':    'midnight',
    'dusk':     'dusk',
};

// Returns the auto-generated sprite URL for a Pokémon, or null if no species is set.
// Handles regional forms by appending the appropriate Showdown suffix.
export const getPokemonSprite = (pokemon) => {
    const slug = speciesSlug(pokemon?.species);
    if (!slug) return null;
    const formSuffix = REGIONAL_FORM_SUFFIXES[(pokemon?.regionalForm || '').toLowerCase()];
    const baseSlug = SLUG_OVERRIDES[slug] ?? slug;
    const fullSlug = formSuffix ? `${baseSlug}-${formSuffix}` : baseSlug;
    return `https://play.pokemonshowdown.com/sprites/gen5/${fullSlug}.png`;
};

// Returns the sprite URL for a mega/alternate form.
// megaForm is the form object from the Pokédex entry (e.g. { name: "Mega X" }).
// Showdown slugs the form as: {species}-{formname-lowercased-nospaces}
//   "Mega"    → charizard-mega
//   "Mega X"  → charizard-megax
//   "Primal"  → groudon-primal
//   "Attack"  → deoxys-attack
export const getMegaSprite = (pokemon, megaForm) => {
    // Allow form data to override the base species slug (e.g. Zygarde-10% → Complete uses Zygarde's sprite)
    const slug = speciesSlug(megaForm?.baseSpeciesOverride || pokemon?.species);
    if (!slug || !megaForm?.name) return getPokemonSprite(pokemon);
    const base = SLUG_OVERRIDES[slug] ?? slug;
    const formSlug = megaForm.name.toLowerCase().replace(/[\s%]/g, ''); // strip spaces and % (e.g. "10%" → "10")
    return `https://play.pokemonshowdown.com/sprites/gen5/${base}-${formSlug}.png`;
};

// Returns the effective display image: custom upload first, then auto sprite.
export const getPokemonDisplayImage = (pokemon) =>
    pokemon?.avatar || getPokemonSprite(pokemon) || null;
