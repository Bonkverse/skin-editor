// src/utils/recentColors.js
// Module-level ring buffer — session-only, no persistence needed.
// Max 10 colors. Most recent first.

const MAX = 10;
const recent = [];
const listeners = new Set();

export function pushRecentColor(hex) {
  if (!hex || hex.length < 4) return;
  const norm = hex.toLowerCase();
  const idx = recent.indexOf(norm);
  if (idx !== -1) recent.splice(idx, 1);
  recent.unshift(norm);
  if (recent.length > MAX) recent.pop();
  listeners.forEach(fn => fn([...recent]));
}

export function getRecentColors() {
  return [...recent];
}

export function subscribeRecentColors(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}