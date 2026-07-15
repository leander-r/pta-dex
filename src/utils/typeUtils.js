// ============================================================
// TYPE AND STAT COLOR UTILITIES
// ============================================================

/**
 * Global color constants for consistency
 */
export const TYPE_COLORS = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
    grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
    ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
    steel: '#B8B8D0', fairy: '#EE99AC'
};

export const STAT_COLORS = {
    HP: '#4caf50', ATK: '#f44336', DEF: '#2196f3',
    SATK: '#9c27b0', SDEF: '#ff9800', SPD: '#00bcd4',
    hp: '#4caf50', atk: '#f44336', def: '#2196f3',
    satk: '#9c27b0', sdef: '#ff9800', spd: '#00bcd4'
};

/**
 * Get type color for styling
 */
export const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || '#999';

/**
 * Returns 'white' or a dark text color for best WCAG contrast against hexColor.
 * Threshold: luminance > 0.179 → use dark text (contrast ≥ 4.5:1 with both).
 */
export const getContrastTextColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return 'white';
    const hex = hexColor.replace('#', '');
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const r = toLinear(parseInt(hex.substring(0, 2), 16) / 255);
    const g = toLinear(parseInt(hex.substring(2, 4), 16) / 255);
    const b = toLinear(parseInt(hex.substring(4, 6), 16) / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.179 ? '#1a1a2e' : 'white';
};

/**
 * Get stat color for display
 */
export const getStatColor = (stat) => STAT_COLORS[stat?.toLowerCase()] || '#666';

// Three-stop "biome" gradients (sky/top → mid → ground) evoking each type's terrain —
// e.g. Ground is dusty earth with a hint of sparse grass at the base, Fire has a scorched
// top fading into a glowing magma floor. Used behind Pokémon sprites for flavor.
const TYPE_TERRAIN = {
    normal:   ['#dce9c4', '#c3d99e', '#9fbf68'],
    fire:     ['#3a231a', '#8a2f10', '#ff7a1a'],
    water:    ['#cdeaf9', '#6fb8e6', '#1f5f9e'],
    electric: ['#fff8c9', '#ffe066', '#f0b90b'],
    grass:    ['#cfe8b0', '#7fbf5a', '#265c1a'],
    ice:      ['#f2fbfd', '#cdeef5', '#8fd3e3'],
    fighting: ['#f0ddb8', '#c98f4e', '#7a4a20'],
    poison:   ['#e6c6ec', '#a855b8', '#4a1858'],
    ground:   ['#f0ddab', '#c99a55', '#8a6a2f'],
    flying:   ['#e3f2ff', '#b3ddff', '#7fb8f0'],
    psychic:  ['#fde0ee', '#f291c4', '#c04f92'],
    bug:      ['#e2eaa8', '#a9bd4f', '#5a6b1f'],
    rock:     ['#e6dcc0', '#b7a375', '#7d6a44'],
    ghost:    ['#5a4a80', '#332352', '#140d24'],
    dragon:   ['#a68af0', '#6a45c9', '#2a1763'],
    dark:     ['#4a4038', '#2a2320', '#120e0c'],
    steel:    ['#eef0f5', '#c3c7d6', '#8b8fa3'],
    fairy:    ['#ffeaf5', '#ffc2e0', '#ec8fc0'],
};

const terrainGradient = (stops) => `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 55%, ${stops[2]} 100%)`;

/**
 * CSS background gradient evoking a type-appropriate biome (e.g. Rock → stony terrain,
 * Fire → scorched ground over glowing magma). Dual-types render as a left/right split
 * (each type keeps its own full-saturation gradient) rather than an RGB-averaged blend —
 * averaging washes out contrasting palettes into a muddy gray (e.g. Fire's dark orange
 * against Flying's pale sky). Matches the app's existing dual-type chip convention of
 * showing both types side-by-side instead of merged.
 * @param {string[]} types
 * @returns {string} CSS `background` value
 */
export const getTypeTerrainBackground = (types) => {
    const t1 = types?.[0]?.toLowerCase();
    const t2 = types?.[1]?.toLowerCase();
    const grad1 = terrainGradient(TYPE_TERRAIN[t1] || TYPE_TERRAIN.normal);
    if (!t2 || !TYPE_TERRAIN[t2]) return grad1;
    const grad2 = terrainGradient(TYPE_TERRAIN[t2]);
    return `${grad1} left / 50% 100% no-repeat, ${grad2} right / 50% 100% no-repeat`;
};
