// renderSkinToSVGFromBonk.js
import {
  BONK_SCALE_FACTOR,
  BONK_X_POS_FACTOR,
  BONK_Y_POS_FACTOR,
} from "../bonk/constants.js";
import { renderSkinToSVG } from "./renderSkinToSVG.js";

export function renderSkinToSVGFromBonk(skin) {
  const baseColor = `#${skin.bc.toString(16).padStart(6, "0")}`;

  // 🔑 IMPORTANT:
  // Bonk layers are bottom → top
  // SVG renders in order, last on top
  // Your editor stores shapes top → bottom
  // So we MUST reverse here
  const shapes = [...skin.layers]
    .reverse()
    .map((l) => ({
      id: l.id,
      scale: l.scale * BONK_SCALE_FACTOR,
      angle: (l.angle * Math.PI) / 180,
      x: l.x * BONK_X_POS_FACTOR,
      y: l.y * BONK_Y_POS_FACTOR,
      flipX: !!l.flipX,
      flipY: !!l.flipY,
      color: `#${l.color.toString(16).padStart(6, "0")}`,
    }));

  return renderSkinToSVG(shapes, baseColor);
}
