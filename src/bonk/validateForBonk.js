// src/bonk/validateForBonk.js
// Single source of truth for "will this survive bonk.io?" checks.
// Scale/position checks convert to bonk units; off-canvas is real OBB↔circle
// geometry in editor pixels (needs each shape's svgCache meta).
import {
  BALL_RADIUS_PX,
  BONK_SCALE_FACTOR,
  BONK_X_POS_FACTOR,
  BONK_Y_POS_FACTOR,
} from "./constants";
import { toast } from "../utils/toast";

const BONK_UNIT = 245 / 36;                     // bonk internal px per unit (≈6.80556)

export const BONK_SCALE_MAX  = 10;              // makeSafe: |scale|>10 → 0.25 (DESTRUCTIVE on load)
export const BONK_SCALE_MIN  = 0.08 / BONK_UNIT; // ≈0.011755: renderer skips below this (soft)
export const BONK_POS_HARD   = 99999;           // makeSafe: |x|,|y|>99999 → 0 (DESTRUCTIVE on load)
export const BONK_MAX_LAYERS = 16;              // fromObject: >16 → ENTIRE skin discarded (DESTRUCTIVE)

// ── Off-canvas: oriented bounding box (rotated, scaled) vs ball circle ───────
// All in editor pixels — shape center (s.x,s.y), half-extents from svgCache,
// and BALL_RADIUS_PX share one coordinate space. Returns true only when the
// whole box is clear of the ball (closest point on box to ball center > radius).
export function isShapeOffCanvas(s, meta) {
  if (!meta) return false;                      // size unknown yet → don't warn
  const scale = Math.abs(s.scale);
  const hw = (meta.w / 2) * scale;
  const hh = (meta.h / 2) * scale;
  const ang = s.angle || 0;                     // editor angle is radians
  const cos = Math.cos(ang), sin = Math.sin(ang);

  // Ball center (0,0) expressed in the shape's local frame: R(-θ)·(−center)
  const dx = -s.x, dy = -s.y;
  const localX =  dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;

  // Closest point on the axis-aligned box (in local frame) to the ball center
  const cx = Math.max(-hw, Math.min(hw, localX));
  const cy = Math.max(-hh, Math.min(hh, localY));
  const ex = localX - cx, ey = localY - cy;

  return ex * ex + ey * ey > BALL_RADIUS_PX * BALL_RADIUS_PX;
}

// ── Per-shape issues (editor-space shape + its svgCache meta) ────────────────
export function editorShapeIssues(s, meta) {
  const out = [];
  const bonkScale = Math.abs(s.scale) / BONK_SCALE_FACTOR;
  const bonkX = s.x / BONK_X_POS_FACTOR;
  const bonkY = s.y / BONK_Y_POS_FACTOR;

  if (bonkScale > BONK_SCALE_MAX) {
    out.push({ level: "error", code: "large", msg: `scale ${bonkScale.toFixed(2)} > 10 — bonk resets it to 0.25` });
  } else if (bonkScale > 0 && bonkScale < BONK_SCALE_MIN) {
    out.push({ level: "warn", code: "small", msg: `scale ${bonkScale.toFixed(4)} too small — bonk won't draw it` });
  }

  if (Math.abs(bonkX) > BONK_POS_HARD || Math.abs(bonkY) > BONK_POS_HARD) {
    out.push({ level: "error", code: "pos", msg: `position out of range — bonk resets it to (0,0)` });
  }

  if (isShapeOffCanvas(s, meta)) {
    out.push({ level: "warn", code: "offcanvas", msg: `entirely off the ball — won't show until part of it overlaps` });
  }

  return out;
}

// ── Whole-skin validation (editor shapes + svgCache) ────────────────────────
export function validateSkin(shapeList, svgCache) {
  const perShape = shapeList.map((s, i) => ({
    index: i,
    issues: editorShapeIssues(s, svgCache?.get(s.id)),
  }));
  const errors   = perShape.filter((p) => p.issues.some((x) => x.level === "error"));
  const warnings = perShape.filter((p) => p.issues.some((x) => x.level === "warn"));
  const tooMany  = shapeList.length > BONK_MAX_LAYERS;

  const count = (code) => perShape.filter((p) => p.issues.some((x) => x.code === code)).length;
  const counts = { tooMany, large: count("large"), off: count("offcanvas"), small: count("small") };

  return { perShape, errors, warnings, tooMany, counts, ok: errors.length === 0 && !tooMany };
}

// ── Gate (Wear/Publish): one summary toast, returns `ok` ────────────────────
// `ok` is false only on DESTRUCTIVE issues (errors or >16 layers); soft
// warnings inform but don't flip it.
export function warnBeforeBonk(shapeList, svgCache) {
  const { errors, warnings, ok } = validateSkin(shapeList, svgCache);

  if (shapeList.length > BONK_MAX_LAYERS) {
    toast(`Your skin has exceeded the max limit of ${BONK_MAX_LAYERS} shapes. Skin cannot be worn in-game`, { type: "error", duration: 5000 });
  } else if (errors.length) {
    const n = errors.length;
    toast(`${n} shape${n > 1 ? "s" : ""} will break in bonk — check Layers`, { type: "error", duration: 4000 });
  } else if (warnings.length) {
    const n = warnings.length;
    toast(`${n} shape${n > 1 ? "s" : ""} may not show in bonk`, { type: "warn", duration: 3500 });
  }
  return ok;
}

// ── Live toasts: fire only on NEW / increased problems vs previous counts ────
// Pass a mutable ref's `.current` as `prev`; this mutates and returns it so a
// standing problem never re-toasts and fixing one stays silent.
export function emitLiveToasts(shapeList, counts, prev) {
  const n = shapeList.length;
  const atLimit = n === BONK_MAX_LAYERS;   // exactly 16
  const overLimit = n > BONK_MAX_LAYERS;   // 17+

  // Fire only on the transition INTO each state, not every tick while there.
  // Dropping below 16 clears both flags, so reaching 16 again re-toasts.
  if (atLimit && !prev.atLimit)
    toast(`Your skin has reached the max limit of ${BONK_MAX_LAYERS} shapes. Skin can still be worn in-game`, { type: "info", duration: 5000 });

  if (overLimit && !prev.overLimit)
    toast(`Your skin has exceeded the max limit of ${BONK_MAX_LAYERS} shapes. Skin cannot be worn in-game`, { type: "error", duration: 5000 });

  if (counts.large > prev.large)
    toast(`${counts.large} shape${counts.large > 1 ? "s" : ""} too large. Make ${counts.large > 1 ? "them" : "it"} smaller to be visible in-game`, { type: "error", duration: 5000 });

  if (counts.off > prev.off)
    toast(`${counts.off} shape${counts.off > 1 ? "s" : ""} off canvas. Move ${counts.off > 1 ? "them" : "it"} in canvas to show in-game`, { type: "warn", duration: 5000 });

  if (counts.small > prev.small)
    toast(`${counts.small} shape${counts.small > 1 ? "s" : ""} too small. Bonk won't draw ${counts.small > 1 ? "them" : "it"}`, { type: "warn", duration: 5000 });

  // Persist all state for next tick. counts carries {large, off, small, tooMany};
  // we add the two layer flags so they survive into the next comparison.
  return Object.assign(prev, counts, { atLimit, overLimit });
}