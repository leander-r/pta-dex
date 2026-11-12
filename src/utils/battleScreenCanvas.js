// ============================================================
// Battle Screen Canvas
// ============================================================
// Composes a canvas image that mimics a Pokémon game's battle HUD (sprite on
// a platform + nameplate + HP bar) so the Discord embed for a move roll looks
// like an actual game screen instead of relying on emoji decoration.

import { getTypeColor, getContrastTextColor } from './typeUtils.js';
import { fetchPokemonSpriteAsDataURL } from './imageLoad.js';
import { STATUS_META } from './statusMeta.js';

const WIDTH = 800;
const HEIGHT = 450;

// Mirrors discordEmbeds.js's hpBar color thresholds — this module replaces that
// function's visual role for the composed-image embed, so the bands must match.
export const pickHpBarColor = (current, max) => {
    const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    if (pct > 0.66) return '#4CAF50';
    if (pct > 0.33) return '#FFC107';
    if (pct > 0) return '#F44336';
    return null;
};

const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const loadSpriteImage = async (url) => {
    if (!url) return null;
    try {
        const dataUrl = await fetchPokemonSpriteAsDataURL(url);
        if (!dataUrl) return null;
        const img = new Image();
        img.src = dataUrl;
        if (img.decode) await img.decode();
        else await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        return img;
    } catch {
        return null;
    }
};

const drawBackground = (ctx, isCrit) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#4a6f8a');
    sky.addColorStop(1, '#7fa8c9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, 300);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(WIDTH, 300);
    ctx.stroke();

    ctx.fillStyle = '#2f6b3a';
    ctx.strokeStyle = '#1f4a28';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(400, 350, 260, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(400, 352, 150, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    const frameWidth = isCrit ? 8 : 4;
    ctx.lineWidth = frameWidth;
    ctx.strokeStyle = isCrit ? '#FF6F00' : '#1a1a2e';
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, WIDTH - frameWidth, HEIGHT - frameWidth);
};

const drawPlaceholderSprite = (ctx, size) => {
    const half = size / 2;
    ctx.fillStyle = '#3a3a50';
    roundRect(ctx, 400 - half, 350 - size, size, size, 20);
    ctx.fill();
    ctx.fillStyle = '#9a9ab0';
    ctx.font = `bold ${Math.round(size * 0.5)}px "Segoe UI", Verdana, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 400, 350 - half);
};

const drawSprite = (ctx, img, { isCrit, isHit }) => {
    const baseSize = isCrit ? 165 : 150;
    if (!img) {
        drawPlaceholderSprite(ctx, baseSize);
    } else {
        const scale = Math.min(baseSize / img.naturalWidth, baseSize / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = 400 - w / 2;
        const y = 350 - h;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (!isHit) ctx.filter = 'grayscale(85%) brightness(0.75)';
        ctx.drawImage(img, x, y, w, h);
        ctx.filter = 'none';
        ctx.restore();
    }

    // Miss/crit overlays apply regardless of whether a real sprite or the
    // placeholder was drawn above — a failed sprite fetch shouldn't also
    // silently swallow the hit/miss/crit visual cue.
    if (!isHit) {
        ctx.save();
        ctx.translate(400, 330);
        ctx.rotate((-18 * Math.PI) / 180);
        ctx.font = 'bold 46px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.strokeText('MISSED!', 0, 0);
        ctx.fillStyle = 'rgba(200,30,30,0.55)';
        ctx.fillText('MISSED!', 0, 0);
        ctx.restore();
    }

    if (isCrit) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        const streaks = [[560, 60], [620, 160], [560, 280], [240, 60], [180, 160], [240, 280]];
        streaks.forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.moveTo(400, 300);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        ctx.translate(650, 40);
        ctx.rotate((-4 * Math.PI) / 180);
        ctx.fillStyle = '#FF6F00';
        roundRect(ctx, -130, -18, 260, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 22px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CRITICAL HIT!', 0, 0);
        ctx.restore();
    }
};

const drawNameplate = (ctx, roll) => {
    const { pokemon, moveType, attackerCurrentHP, attackerMaxHP, megaEvolved, megaFormName } = roll;
    const x = 24, y = 24, w = 320, h = 110, r = 14;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(ctx, x + 6, y + 6, w, h, r);
    ctx.fill();

    ctx.fillStyle = '#fdf8ec';
    ctx.strokeStyle = '#2b2b40';
    ctx.lineWidth = 4;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = getTypeColor(moveType);
    roundRect(ctx, x + 10, y + h - 14, w - 20, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 28px "Segoe UI", Verdana, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(pokemon, x + 16, y + 38);

    if (megaEvolved && megaFormName) {
        ctx.save();
        ctx.translate(x + w - 36, y + 18);
        ctx.rotate((20 * Math.PI) / 180);
        ctx.fillStyle = '#FFD700';
        roundRect(ctx, -34, -10, 68, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 11px "Segoe UI", Verdana, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MEGA', 0, 0);
        ctx.restore();
    }

    if (!(attackerMaxHP > 0)) return;

    const hpChipX = x + 16, hpChipY = y + 50;
    ctx.fillStyle = '#f0b400';
    roundRect(ctx, hpChipX, hpChipY, 34, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 12px "Segoe UI", Verdana, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HP', hpChipX + 17, hpChipY + 9);

    const barX = x + 56, barY = y + 52, barW = w - 56 - 16, barH = 14;
    ctx.fillStyle = '#3a3a50';
    roundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    const pct = Math.max(0, Math.min(1, attackerCurrentHP / attackerMaxHP));
    const fillColor = pickHpBarColor(attackerCurrentHP, attackerMaxHP);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        roundRect(ctx, barX, barY, barW * pct, barH, 7);
        ctx.fill();
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 14px "Segoe UI", Verdana, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${attackerCurrentHP}/${attackerMaxHP}`, x + w - 16, y + h - 6);

    if (pct > 0 && pct <= 0.25) {
        ctx.fillStyle = '#F44336';
        roundRect(ctx, barX, barY + barH + 6, 78, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Segoe UI", Verdana, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOW HP!', barX + 39, barY + barH + 14);
    }
};

const drawStatusBadges = (ctx, activeStatuses) => {
    if (!activeStatuses?.length) return;
    const chipW = 54, chipH = 20, gap = 6;
    const cy = 142;
    let cx = 24;
    activeStatuses.slice(0, 4).forEach((key) => {
        const meta = STATUS_META[key];
        const color = meta?.color || '#666';
        ctx.fillStyle = color;
        roundRect(ctx, cx, cy, chipW, chipH, 6);
        ctx.fill();
        ctx.fillStyle = getContrastTextColor(color);
        ctx.font = 'bold 11px "Segoe UI", Verdana, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta?.abbrev || key.slice(0, 3).toUpperCase(), cx + chipW / 2, cy + chipH / 2 + 1);
        cx += chipW + gap;
    });
};

/**
 * Composes a battle-screen-style PNG for a Pokémon move roll.
 * Never throws — resolves null on any failure so the caller always has a safe fallback signal.
 */
export const renderBattleScreenImage = async (roll) => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const { isHit, isCrit, pokemonSpriteUrl, activeStatuses } = roll;

        drawBackground(ctx, isCrit);
        const sprite = await loadSpriteImage(pokemonSpriteUrl);
        drawSprite(ctx, sprite, { isCrit, isHit });
        drawNameplate(ctx, roll);
        drawStatusBadges(ctx, activeStatuses);

        return await new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob || null), 'image/png');
        });
    } catch {
        return null;
    }
};
