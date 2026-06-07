// src/canvas/drawSelectionOverlay.js

const HANDLE_RADIUS = 7;
const BOX_STROKE = 1.5;
const BOX_COLOR = "#00ffcc";
const HANDLE_FILL = "#00ffcc";
const HANDLE_STROKE = "#003333";
const MULTI_BOX_COLOR = "rgba(0,255,204,0.45)"; // dimmer for individual boxes in multi-select

// ── Single selection ─────────────────────────────────────────────────────────
export function drawSelectionOverlay(ctx, shape, svgCache, zoom) {
  const meta = svgCache.get(shape.id);
  if (!meta) return;
  const { w, h } = meta;
  const hw = (w / 2) * shape.scale;
  const hh = (h / 2) * shape.scale;
  const cos = Math.cos(shape.angle);
  const sin = Math.sin(shape.angle);

  function rotatePoint(lx, ly) {
    return { x: shape.x + lx * cos - ly * sin, y: shape.y + lx * sin + ly * cos };
  }

  const TL = rotatePoint(-hw, -hh);
  const TR = rotatePoint(hw, -hh);
  const BR = rotatePoint(hw, hh);
  const BL = rotatePoint(-hw, hh);
  const handle = TR;
  const sw = BOX_STROKE / zoom;
  const hr = HANDLE_RADIUS / zoom;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
  ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
  ctx.closePath();
  ctx.strokeStyle = BOX_COLOR; ctx.lineWidth = sw; ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, hr, 0, Math.PI * 2);
  ctx.fillStyle = HANDLE_FILL; ctx.fill();
  ctx.strokeStyle = HANDLE_STROKE; ctx.lineWidth = sw; ctx.stroke();
  ctx.restore();
}

// ── Multi-selection ──────────────────────────────────────────────────────────
// Draws:
//  1. A dim individual box around EACH selected shape (no handle)
//  2. An axis-aligned combined bounding box around ALL of them
//  3. A single scale+rotate handle at the top-right of the combined box
//
// The combined box is axis-aligned (not rotated) for simplicity and
// so the handle math is straightforward.
export function drawMultiSelectionOverlay(ctx, shapes, selectedIndices, svgCache, zoom) {
  if (selectedIndices.length === 0) return;

  const sw = BOX_STROKE / zoom;
  const hr = HANDLE_RADIUS / zoom;

  // ── 1. Individual dim boxes ────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = MULTI_BOX_COLOR;
  ctx.lineWidth = sw;
  for (const idx of selectedIndices) {
    const shape = shapes[idx];
    if (!shape) continue;
    const meta = svgCache.get(shape.id);
    if (!meta) continue;
    const { w, h } = meta;
    const hw = (w / 2) * shape.scale;
    const hh = (h / 2) * shape.scale;
    const cos = Math.cos(shape.angle);
    const sin = Math.sin(shape.angle);
    function rp(lx, ly) {
      return { x: shape.x + lx * cos - ly * sin, y: shape.y + lx * sin + ly * cos };
    }
    const TL = rp(-hw, -hh), TR = rp(hw, -hh), BR = rp(hw, hh), BL = rp(-hw, hh);
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();

  // ── 2. Combined AABB (axis-aligned) ───────────────────────────
  // Compute world-space corners of each shape and find the overall min/max
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const idx of selectedIndices) {
    const shape = shapes[idx];
    if (!shape) continue;
    const meta = svgCache.get(shape.id);
    if (!meta) continue;
    const { w, h } = meta;
    const hw = (w / 2) * shape.scale;
    const hh = (h / 2) * shape.scale;
    const cos = Math.cos(shape.angle);
    const sin = Math.sin(shape.angle);
    for (const [lx, ly] of [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]) {
      const wx = shape.x + lx * cos - ly * sin;
      const wy = shape.y + lx * sin + ly * cos;
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
  }

  const pad = 6 / zoom; // small padding so the box doesn't touch the shape
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;

  // Draw combined box
  ctx.save();
  ctx.strokeStyle = BOX_COLOR;
  ctx.lineWidth = sw * 1.2;
  ctx.setLineDash([6 / zoom, 3 / zoom]);
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  ctx.setLineDash([]);
  ctx.restore();

  // ── 3. Handle at top-right of combined box ─────────────────────
  const hx = maxX;
  const hy = minY;
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fillStyle = HANDLE_FILL; ctx.fill();
  ctx.strokeStyle = HANDLE_STROKE; ctx.lineWidth = sw; ctx.stroke();
  ctx.restore();
}

// ── Rubber-band selection rect ───────────────────────────────────────────────
export function drawRubberBand(ctx, x1, y1, x2, y2, zoom) {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  ctx.save();
  ctx.fillStyle = "rgba(0,255,204,0.06)";
  ctx.fillRect(minX, minY, w, h);
  ctx.strokeStyle = "rgba(0,255,204,0.7)";
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5 / zoom, 3 / zoom]);
  ctx.strokeRect(minX, minY, w, h);
  ctx.setLineDash([]);
  ctx.restore();
}

// ── Hit tests ────────────────────────────────────────────────────────────────
export function isOnHandle(wx, wy, shape, svgCache, zoom) {
  const meta = svgCache.get(shape.id);
  if (!meta) return false;
  const { w, h } = meta;
  const hw = (w / 2) * shape.scale;
  const hh = (h / 2) * shape.scale;
  const cos = Math.cos(shape.angle);
  const sin = Math.sin(shape.angle);
  const handle = {
    x: shape.x + hw * cos - (-hh) * sin,
    y: shape.y + hw * sin + (-hh) * cos,
  };
  const hr = HANDLE_RADIUS / zoom;
  return Math.hypot(wx - handle.x, wy - handle.y) <= hr;
}

export function isOnBox(wx, wy, shape, svgCache) {
  const meta = svgCache.get(shape.id);
  if (!meta) return false;
  const { w, h } = meta;
  const hw = (w / 2) * shape.scale;
  const hh = (h / 2) * shape.scale;
  const dx = wx - shape.x;
  const dy = wy - shape.y;
  const cos = Math.cos(-shape.angle);
  const sin = Math.sin(-shape.angle);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return lx >= -hw && lx <= hw && ly >= -hh && ly <= hh;
}

// Hit test: is the point on the multi-select group handle (top-right of combined AABB)?
// Returns {minX,minY,maxX,maxY} of the combined box if hit, null otherwise.
export function getMultiSelectBounds(shapes, selectedIndices, svgCache, zoom) {
  if (selectedIndices.length < 2) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const idx of selectedIndices) {
    const shape = shapes[idx];
    if (!shape) continue;
    const meta = svgCache.get(shape.id);
    if (!meta) continue;
    const { w, h } = meta;
    const hw = (w / 2) * shape.scale;
    const hh = (h / 2) * shape.scale;
    const cos = Math.cos(shape.angle);
    const sin = Math.sin(shape.angle);
    for (const [lx, ly] of [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]) {
      const wx = shape.x + lx * cos - ly * sin;
      const wy = shape.y + lx * sin + ly * cos;
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
  }
  const pad = 6 / zoom;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

export function isOnMultiHandle(wx, wy, bounds, zoom) {
  if (!bounds) return false;
  const hr = HANDLE_RADIUS / zoom;
  return Math.hypot(wx - bounds.maxX, wy - bounds.minY) <= hr;
}

export function isInMultiBox(wx, wy, bounds) {
  if (!bounds) return false;
  return wx >= bounds.minX && wx <= bounds.maxX && wy >= bounds.minY && wy <= bounds.maxY;
}