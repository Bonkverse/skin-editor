// src/render/renderLayerToSVG.js
import { svgCache } from "../utils/svgCache.js";

// Every shape a skin uses is written once into the SVG's <defs> under this id
// (see renderSkinToSVG). Layers point at it with <use> instead of pasting the
// shape's full path data each time, so a skin that repeats a shape stays small.
export function shapeDefId(id) {
  return `bv-shape-${Number(id)}`;
}

// The shape itself, written once per skin inside <defs>. Its paths are
// normalized to currentColor, so each <use> picks up its layer's color.
export function renderShapeDef(id) {
  const meta = svgCache.get(id);
  if (!meta) return "";
  return `<g id="${shapeDefId(id)}">${meta.html}</g>`;
}

// One layer: its position, rotation, scale, flip and color, plus a reference
// to the shared shape definition.
export function renderLayerToSVG(s) {
  if (!svgCache.get(s.id)) return "";

  const deg = (s.angle * 180) / Math.PI;
  const sx = s.scale * (s.flipX ? -1 : 1);
  const sy = s.scale * (s.flipY ? -1 : 1);

  return `
<g
  transform="
    translate(${s.x} ${s.y})
    rotate(${deg})
    scale(${sx} ${sy})
  "
  style="color: ${s.color};"
  fill="currentColor"
  stroke="currentColor"
>
  <use href="#${shapeDefId(s.id)}" />
</g>
`;
}
