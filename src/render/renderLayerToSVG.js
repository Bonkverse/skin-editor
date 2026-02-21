// src/render/renderLayerToSVG.js
import { svgCache } from "../utils/svgCache.js";

export function renderLayerToSVG(s) {
  const meta = svgCache.get(s.id);
  if (!meta) return "";

  const { html } = meta;
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
  ${html}
</g>
`;
}
