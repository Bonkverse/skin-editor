/* eslint-env node */

import { decodeSkinBytes } from "./decodeSkinCore.js";

/**
 * Node-only decoder
 * DO NOT import this in the browser
 */
export function decodeSkinCode(code) {
  // Decode once, then again if still URL-encoded (handles double-encoded DB codes)
  let decoded = decodeURIComponent(code);
  if (decoded.includes("%")) decoded = decodeURIComponent(decoded);
  const buffer = Buffer.from(decoded, "base64");
  return decodeSkinBytes(new Uint8Array(buffer));
}