import { decodeSkinBytes } from "./decodeSkinCore";

export function decodeSkinCode(code) {
  const decoded = decodeURIComponent(code);
  const binary = atob(decoded);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return decodeSkinBytes(bytes);
}
