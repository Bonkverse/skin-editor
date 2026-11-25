// Limits on the render service's work (server.js).
//
// bonkverse.io asks for 512 px images; nothing needs more than 1024. "size"
// used to go straight to sharp, so {"size": 40000} asked for a 1.6-gigapixel
// PNG. bonk.io wears at most 16 layers, but this editor's encoder wrote the
// layer count as one byte, so skins made here can have up to 255; draw those,
// not the ~25k layers a 1 MB request body can hold.
export const MIN_SIZE = 16;
export const MAX_SIZE = 1024;
export const MAX_RENDER_LAYERS = 255;

/** True if a decoded skin has no more layers than we'll draw. */
export function withinLayerLimit(skin) {
  return Array.isArray(skin?.layers) && skin.layers.length <= MAX_RENDER_LAYERS;
}

/** The requested image size (default 512), or null if it isn't allowed. */
export function renderSize(size = 512) {
  return Number.isInteger(size) && size >= MIN_SIZE && size <= MAX_SIZE ? size : null;
}
