// src/components/ColorPicker.jsx
// Redesigned to fit the panel properly and be less squashed.
// - Wider color gradient area
// - Hex + RGB inputs in a clean 2-row layout instead of cramped 1-row
// - No external CSS file — all styles inline via className (defined in index.css)

import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";

export default function ColorPicker({ color, onPreview, onCommit, disabled }) {
  const [hex, setHex] = useState(color ?? "#000000");
  const [rgb, setRgb] = useState(hexToRgb(color ?? "#000000"));

  const lastPropRef = useRef(color);
  const latestHexRef = useRef(color);
  const rafRef = useRef(null);

  useEffect(() => {
    if (color !== lastPropRef.current) {
      lastPropRef.current = color;
      latestHexRef.current = color;
      setHex(color);
      setRgb(hexToRgb(color));
    }
  }, [color]);

  function hexToRgb(h) {
    const n = parseInt((h ?? "#000000").replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  }

  function schedulePreview() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!disabled && onPreview) onPreview(latestHexRef.current);
    });
  }

  function commitFinal() {
    if (disabled || !onCommit) return;
    onCommit(latestHexRef.current);
  }

  return (
    <div
      className="cp-wrapper"
      onPointerUp={commitFinal}
      onMouseUp={commitFinal}
      onTouchEnd={commitFinal}
    >
      {/* Gradient picker */}
      <HexColorPicker
        color={hex}
        disabled={disabled}
        onChange={(val) => {
          setHex(val);
          setRgb(hexToRgb(val));
          latestHexRef.current = val;
          schedulePreview();
        }}
      />

      {/* Hex row */}
      <div className="cp-row">
        <div className="cp-field cp-field-wide">
          <span className="cp-label">Hex</span>
          <div className="cp-hex-wrap">
            <span className="cp-hash">#</span>
            <input
              className="cp-input"
              value={hex.replace("#", "").toUpperCase()}
              maxLength={6}
              disabled={disabled}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "");
                const formatted = "#" + raw;
                setHex(formatted);
                if (raw.length === 6) {
                  const r = hexToRgb(formatted);
                  setRgb(r);
                  latestHexRef.current = formatted;
                  schedulePreview();
                  commitFinal();
                }
              }}
            />
          </div>
        </div>

        {/* Color preview swatch */}
        <div
          className="cp-swatch"
          style={{ background: hex }}
          title={hex}
        />
      </div>

      {/* RGB row */}
      <div className="cp-row">
        {["r", "g", "b"].map((c) => (
          <div className="cp-field" key={c}>
            <span className="cp-label">{c.toUpperCase()}</span>
            <input
              className="cp-input cp-input-num"
              type="number"
              min={0}
              max={255}
              value={rgb[c]}
              disabled={disabled}
              onChange={(e) => {
                const newRgb = { ...rgb, [c]: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) };
                setRgb(newRgb);
                const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                setHex(newHex);
                latestHexRef.current = newHex;
                schedulePreview();
                commitFinal();
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
