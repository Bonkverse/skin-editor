// src/hooks/useCanvasBackground.js
// The editor canvas's background color. A per-browser viewing preference:
// it never touches the skin itself (base color, SVG, PNG or skin code).
import { useCallback, useState } from "react";

export const DEFAULT_CANVAS_BG = "#0d141c";

const STORAGE_KEY = "bv-editor-canvas-bg";
const HEX_RE = /^#[0-9a-f]{6}$/i;

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && HEX_RE.test(saved) ? saved.toLowerCase() : DEFAULT_CANVAS_BG;
  } catch {
    return DEFAULT_CANVAS_BG; // storage blocked (private window, etc.)
  }
}

function save(hex) {
  try {
    if (hex === DEFAULT_CANVAS_BG) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    // Not saved, but the color still applies for this session.
  }
}

export function useCanvasBackground() {
  const [canvasBg, setCanvasBgState] = useState(readSaved);

  const setCanvasBg = useCallback((hex) => {
    if (!HEX_RE.test(hex ?? "")) return;
    const norm = hex.toLowerCase();
    setCanvasBgState(norm);
    save(norm);
  }, []);

  const resetCanvasBg = useCallback(() => setCanvasBg(DEFAULT_CANVAS_BG), [setCanvasBg]);

  return { canvasBg, setCanvasBg, resetCanvasBg };
}
