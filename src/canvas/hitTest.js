// src/canvas/hitTest.js
//
// Manual hit detection for canvas shapes.
//
// WHY THIS IS NEEDED:
// In the old SVG approach, each shape was a DOM element and got native
// mouse events via onMouseDown. In canvas there's only ONE element (the
// canvas tag itself), so we must manually check which shape the mouse
// is over on every click.
//
// We test shapes in reverse order (top layer first, matching visual stacking).

import { svgCache } from "../utils/svgCache";

/**
 * Returns the index of the topmost shape at world position (wx, wy),
 * or null if no shape is there.
 *
 * Uses an AABB (axis-aligned bounding box) test after inverse-rotating
 * the point into each shape's local coordinate space.
 *
 * @param {number} wx       - world x (already converted from screen via screenToWorld)
 * @param {number} wy       - world y
 * @param {Array}  shapes   - array of shape objects
 * @returns {number|null}   - index into shapes array, or null
 */
export function hitTestShapes(wx, wy, shapes) {
  // Iterate in reverse: last shape in array = topmost visually
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.hidden) continue;

    const meta = svgCache.get(s.id);
    if (!meta) continue;

    const { w, h } = meta;

    // Half-extents in world units (shape.scale applied)
    const hw = (w / 2) * s.scale;
    const hh = (h / 2) * s.scale;

    // Translate click into shape-center space
    const dx = wx - s.x;
    const dy = wy - s.y;

    // Inverse rotate to get into shape's local (unrotated) space
    const cos = Math.cos(-s.angle);
    const sin = Math.sin(-s.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // AABB check in local space
    if (
      localX >= -hw && localX <= hw &&
      localY >= -hh && localY <= hh
    ) {
      return i;
    }
  }

  return null;
}