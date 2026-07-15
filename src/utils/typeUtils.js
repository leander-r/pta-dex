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

const KNOWN_TYPES = new Set(Object.keys(TYPE_COLORS));

/**
 * URL for a type's illustrated terrain background (public/backgrounds/<type>.png — cropped
 * from a hand-provided 18×17 reference sheet of type-vs-type battle scenes, one image per
 * defending type). BASE_URL-aware so it resolves correctly under the GitHub Pages base path.
 */
export const getTypeBackgroundUrl = (type) => {
    const t = type?.toLowerCase();
    return `${import.meta.env.BASE_URL}backgrounds/${KNOWN_TYPES.has(t) ? t : 'normal'}.png`;
};

/**
 * CSS `background` value showing a type-appropriate illustrated biome behind a Pokémon
 * sprite (e.g. Rock → stony terrain, Fire → scorched ground over glowing magma). Dual-types
 * render as a left/right split (each type keeps its own full image) rather than blending —
 * blending washes contrasting scenes into a muddy mix, and a split matches the app's
 * existing dual-type chip convention of showing both types side-by-side instead of merged.
 * @param {string[]} types
 * @returns {string} CSS `background` value
 */
export const getTypeTerrainBackground = (types) => {
    const url1 = `url(${getTypeBackgroundUrl(types?.[0])})`;
    const t2 = types?.[1];
    if (!t2) return `${url1} center / cover no-repeat`;
    const url2 = `url(${getTypeBackgroundUrl(t2)})`;
    return `${url1} left / 50% 100% no-repeat, ${url2} right / 50% 100% no-repeat`;
};
