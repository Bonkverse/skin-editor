import { loadAndNormalizeSvg } from "./loadSvg.js";
import { TOTAL_BONK_SHAPES } from "../bonk/constants.js";

/**
 * Run this ONCE in the browser console or via a temporary dev page
 */
export async function extractShapeCenters() {
  const centers = {};

  for (let id = 1; id <= TOTAL_BONK_SHAPES; id++) {
    const meta = await loadAndNormalizeSvg(id);

    // loadSvg already computed bbox & centered HTML
    // we just need the inverse translation it applied
    const { w, h } = meta;

    // getBBox() logic from loadSvg:
    // cx = bbox.x + bbox.width / 2
    // cy = bbox.y + bbox.height / 2
    // BUT since HTML is already centered, bbox.x/y are negative half-dimensions
    centers[id] = {
      cx: w / 2,
      cy: h / 2,
    };
  }

  console.log("Shape centers:");
  console.log(JSON.stringify(centers, null, 2));

  return centers;
}
