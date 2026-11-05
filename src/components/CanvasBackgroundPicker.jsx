// src/components/CanvasBackgroundPicker.jsx
// Top-bar control for the canvas background color (see useCanvasBackground).
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { DEFAULT_CANVAS_BG } from "../hooks/useCanvasBackground";

const PRESETS = [
  { name: "Dark (default)", hex: DEFAULT_CANVAS_BG },
  { name: "Slate", hex: "#2a3542" },
  { name: "Gray", hex: "#6b7480" },
  { name: "Light", hex: "#c9d1d9" },
  { name: "White", hex: "#ffffff" },
];

export default function CanvasBackgroundPicker({ canvasBg, setCanvasBg, resetCanvasBg }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(canvasBg);
  const rootRef = useRef(null);

  useEffect(() => setDraft(canvasBg), [canvasBg]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function commitDraft(value) {
    const hex = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9a-f]{6}$/i.test(hex)) setCanvasBg(hex);
    else setDraft(canvasBg);
  }

  return (
    <div className="bg-picker" ref={rootRef}>
      <button
        className={`tb-btn tb-btn-label ${open ? "tb-btn-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Change the color behind the skin in the editor (only affects your view)"
      >
        <span className="bg-picker-swatch" style={{ background: canvasBg }} />
        Canvas Color
      </button>

      {open && (
        <div className="bg-picker-pop" role="dialog" aria-label="Canvas color">
          <div className="bg-picker-presets">
            {PRESETS.map((p) => (
              <button
                key={p.hex}
                className={`bg-picker-preset ${p.hex === canvasBg ? "active" : ""}`}
                style={{ background: p.hex }}
                title={p.name}
                aria-label={p.name}
                onClick={() => setCanvasBg(p.hex)}
              />
            ))}
          </div>

          <HexColorPicker color={canvasBg} onChange={setCanvasBg} />

          <div className="bg-picker-row">
            <input
              className="bg-picker-hex"
              value={draft}
              spellCheck={false}
              maxLength={7}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commitDraft(e.target.value.trim())}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              aria-label="Canvas hex color"
            />
            <button
              className="tb-btn"
              onClick={resetCanvasBg}
              disabled={canvasBg === DEFAULT_CANVAS_BG}
              title="Back to the default dark canvas"
            >
              Default
            </button>
          </div>

          <p className="bg-picker-note">Only changes the editor area behind your skin, for you. Your skin and its Background color aren't affected.</p>
        </div>
      )}
    </div>
  );
}
