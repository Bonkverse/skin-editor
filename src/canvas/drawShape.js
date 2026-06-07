// src/canvas/drawShape.js

import { getRasterizedSync } from "../utils/rasterCache";

// Tracks the last color that successfully rendered per shape id.
// Used as fallback while a new color's image is being async-loaded,
// preventing the 1-2 frame flicker when color changes.
const lastGoodColor = new Map();

export function drawShape(ctx, shape, svgCache) {
  if (shape.hidden) return;

  const meta = svgCache.get(shape.id);
  if (!meta) return;

  // Try the current color first
  let img = getRasterizedSync(shape.id, shape.color);
  let drewCurrentColor = true;

  // If not cached yet, fall back to the last known good color
  if (!img) {
    drewCurrentColor = false;
    const fallbackColor = lastGoodColor.get(shape.id);
    if (fallbackColor) img = getRasterizedSync(shape.id, fallbackColor);
  }

  if (!img) return; // nothing cached at all yet (first load)

  // Only record this color as "good" if we actually drew it,
  // not if we fell back to an older one
  if (drewCurrentColor) {
    lastGoodColor.set(shape.id, shape.color);
  }

  const worldW = img._worldW ?? meta.w;
  const worldH = img._worldH ?? meta.h;

  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate(shape.angle);
  ctx.scale(shape.scale, shape.scale);
  ctx.scale(shape.flipX ? -1 : 1, shape.flipY ? -1 : 1);
  ctx.drawImage(img, -worldW / 2, -worldH / 2, worldW, worldH);
  ctx.restore();
}