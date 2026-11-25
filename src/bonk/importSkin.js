// Reading a skin JSON file (Export JSON → Import JSON) back into editor shapes.
//
// The file is untrusted: people share skin JSONs. Every field is checked to be
// the number Export JSON writes, because colors end up in HTML (the Layers
// panel builds shape markup with dangerouslySetInnerHTML), and a string
// "color" used to go straight in: String.prototype.toString ignores the radix,
// so "\"><img src=x onerror=...>" became the color and ran on the editor's
// origin.
import {
  TOTAL_BONK_SHAPES,
  BONK_SCALE_FACTOR,
  BONK_X_POS_FACTOR,
  BONK_Y_POS_FACTOR,
} from "./constants.js";

// bonk.io wears at most 16 layers; the editor lets you go over (and warns), and
// its skins can have up to 255 (render/limits.js). Not thousands.
export { MAX_RENDER_LAYERS as MAX_IMPORT_LAYERS } from "../render/limits.js";
import { MAX_RENDER_LAYERS as MAX_IMPORT_LAYERS } from "../render/limits.js";

const isColor = (v) => Number.isInteger(v) && v >= 0 && v <= 0xffffff;
const hex = (n) => `#${n.toString(16).padStart(6, "0")}`;

function finite(value, what) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${what} isn't a number`);
  return n;
}

/**
 * A parsed skin JSON → { baseColor: "#rrggbb", shapes: [...] } in editor space
 * (shapes top→bottom). Throws an Error saying what's wrong for anything else.
 */
export function parseSkinJSON(data) {
  if (!data || typeof data !== "object") throw new Error("not a skin");
  if (!isColor(data.bc)) throw new Error("base color isn't a color");
  if (!Array.isArray(data.layers)) throw new Error("no layers");
  if (data.layers.length > MAX_IMPORT_LAYERS) {
    throw new Error(`more than ${MAX_IMPORT_LAYERS} layers`);
  }

  const shapes = data.layers
    .map((l, i) => {
      const where = `layer ${i + 1}`;
      if (!l || typeof l !== "object") throw new Error(`${where} isn't a layer`);
      if (!Number.isInteger(l.id) || l.id < 1 || l.id > TOTAL_BONK_SHAPES) {
        throw new Error(`${where}: unknown shape`);
      }
      if (!isColor(l.color)) throw new Error(`${where}: color isn't a color`);
      return {
        id: l.id,
        scale: finite(l.scale, `${where} scale`) * BONK_SCALE_FACTOR,
        angle: (finite(l.angle, `${where} angle`) * Math.PI) / 180,
        x: finite(l.x, `${where} x`) * BONK_X_POS_FACTOR,
        y: finite(l.y, `${where} y`) * BONK_Y_POS_FACTOR,
        flipX: !!l.flipX,
        flipY: !!l.flipY,
        color: hex(l.color),
      };
    })
    .reverse(); // bonk layers are bottom→top; editor shapes are top→bottom

  return { baseColor: hex(data.bc), shapes };
}
