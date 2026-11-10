import { decodeSkinBytes } from "./decodeSkinCore";

export function decodeSkinCode(code) {
  // Remove URL-encoding: stored codes can be encoded up to three times
  // (twice from BonkLeagues, three times in at least one gallery skin).
  let decoded = code;
  for (let pass = 0; pass < 3 && decoded.includes("%"); pass++) {
    decoded = decodeURIComponent(decoded);
  }
  const binary = atob(decoded);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return decodeSkinBytes(bytes);
}