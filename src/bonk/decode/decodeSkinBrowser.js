import { decodeSkinBytes } from "./decodeSkinCore";

export function decodeSkinCode(code) {
  // Decode once, then again if still URL-encoded (handles double-encoded DB codes)
  let decoded = decodeURIComponent(code);
  if (decoded.includes("%")) decoded = decodeURIComponent(decoded);
  const binary = atob(decoded);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return decodeSkinBytes(bytes);
}