/* eslint-env node */

import { decodeSkinBytes } from "./decodeSkinCore.js";

/**
 * Node-only decoder
 * DO NOT import this in the browser
 */
export function decodeSkinCode(code) {
  const decoded = decodeURIComponent(code);
  const buffer = Buffer.from(decoded, "base64");
  return decodeSkinBytes(new Uint8Array(buffer));
}
