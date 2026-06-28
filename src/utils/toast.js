// src/utils/toast.js
// Lightweight toast system. Works from anywhere — React components,
// canvas hooks, keyboard handlers — no React context needed.
//
// Usage:
//   import { toast } from "../utils/toast";
//   toast("Shape pasted!");
//   toast("Overlay mode on", { type: "info", duration: 1800 });
//   toast("Deleted 3 shapes", { type: "warn" });

const listeners = new Set();

/**
 * Fire a toast notification.
 * @param {string} message
 * @param {{ type?: "default"|"info"|"warn"|"success", duration?: number }} opts
 */
export function toast(message, opts = {}) {
  const { type = "default", duration = 2000 } = opts;
  listeners.forEach(fn => fn({ message, type, duration, id: Date.now() + Math.random() }));
}

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}