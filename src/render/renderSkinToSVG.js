// src/render/renderSkinToSVG.js
import { BALL_RADIUS_PX } from "../bonk/constants.js";
import { renderLayerToSVG } from "./renderLayerToSVG.js";

export function renderSkinToSVG(shapes, baseColor) {
  const r = BALL_RADIUS_PX;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${-r} ${-r} ${r * 2} ${r * 2}"
  width="${r * 2}"
  height="${r * 2}"
>
  <defs>
    <clipPath id="playerClip">
      <circle cx="0" cy="0" r="${r}" />
    </clipPath>
  </defs>

  <!-- Player outline -->
  <circle
    cx="0"
    cy="0"
    r="${r + 2}"
    fill="none"
    stroke="rgba(0,0,0,0.25)"
    stroke-width="4"
  />

  <!-- Player base -->
  <circle
    cx="0"
    cy="0"
    r="${r}"
    fill="${baseColor}"
    stroke="#333"
    stroke-width="3"
  />

  <!-- Shapes -->
  <g clip-path="url(#playerClip)">
    ${shapes.map(renderLayerToSVG).join("\n")}
  </g>
</svg>
`;
}
