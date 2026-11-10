/* eslint-env node */

import { decodeSkinBytes } from "./decodeSkinCore.js";

/**
 * Node-only decoder
 * DO NOT import this in the browser
 */
export function decodeSkinCode(code) {
  // Remove URL-encoding: stored codes can be encoded up to three times
  // (twice from BonkLeagues, three times in at least one gallery skin).
  let decoded = code;
  for (let pass = 0; pass < 3 && decoded.includes("%"); pass++) {
    decoded = decodeURIComponent(decoded);
  }
  const buffer = Buffer.from(decoded, "base64");
  return decodeSkinBytes(new Uint8Array(buffer));
}