// src/utils/flipLayers.js
export function flipLayers(parsedJson) {
  if (!parsedJson || !Array.isArray(parsedJson.layers)) {
    console.warn("Invalid JSON — no layers found to flip.");
    return parsedJson;
  }

  // Make a deep copy (to avoid mutating original)
  const flipped = structuredClone(parsedJson);
  flipped.layers.reverse();
  return flipped;
}
