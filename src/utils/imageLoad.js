// ============================================================
// IMAGE LOADING UTILITIES
// ============================================================

/**
 * Fetch a cross-origin image as a data URL using the Fetch API.
 * fetch() with cache:'no-store' bypasses any cached non-CORS response.
 * Resolves to null if the request fails (e.g. server blocks CORS).
 */
export const fetchImageAsDataURL = async (src) => {
    try {
        const resp = await fetch(src, { mode: 'cors', cache: 'no-store' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload  = (e) => resolve(e.target.result);
            reader.onerror = ()  => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null; // CORS blocked or network error
    }
};

/**
 * Fetch a Pokémon Showdown gen5 sprite as a data URL. Showdown's CDN sends no
 * CORS headers, so a direct cross-origin fetch always fails — this falls back
 * to re-fetching the same species' sprite through PokeAPI (which does serve
 * CORS headers), looked up by name via the slug embedded in the Showdown URL.
 */
export const fetchPokemonSpriteAsDataURL = async (showdownUrl) => {
    const direct = await fetchImageAsDataURL(showdownUrl);
    if (direct) return direct;

    const slug = showdownUrl?.match(/play\.pokemonshowdown\.com\/sprites\/gen5\/([^.]+)\.png/)?.[1];
    if (!slug) return null;
    try {
        const apiResp = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`, { cache: 'no-store' });
        if (!apiResp.ok) return null;
        const apiData = await apiResp.json();
        const spriteSrc = apiData.sprites?.front_default;
        return spriteSrc ? await fetchImageAsDataURL(spriteSrc) : null;
    } catch {
        return null; // custom/homebrew species won't be in PokeAPI
    }
};
