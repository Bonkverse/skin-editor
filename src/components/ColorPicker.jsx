// src/components/ColorPicker.jsx

import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { pushRecentColor, getRecentColors, subscribeRecentColors } from "../utils/recentColors";

export default function ColorPicker({ color, onPreview, onCommit, disabled }) {
  const [hex, setHex] = useState(color ?? "#000000");
  const [rgb, setRgb] = useState(hexToRgb(color ?? "#000000"));
  const [recentColors, setRecentColors] = useState(getRecentColors);

  const lastPropRef = useRef(color);
  const latestHexRef = useRef(color);
  const rafRef = useRef(null);

  // Sync when prop changes externally
  useEffect(() => {
    if (color !== lastPropRef.current) {
      lastPropRef.current = color;
      latestHexRef.current = color;
      setHex(color);
      setRgb(hexToRgb(color));
    }
  }, [color]);

  // Subscribe to recent colors updates from other pickers
  useEffect(() => subscribeRecentColors(setRecentColors), []);

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
    pushRecentColor(latestHexRef.current);
    onCommit(latestHexRef.current);
  }

  function applyRecent(h) {
    if (disabled) return;
    setHex(h);
    setRgb(hexToRgb(h));
    latestHexRef.current = h;
    if (onPreview) onPreview(h);
    pushRecentColor(h);
    if (onCommit) onCommit(h);
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
                  setRgb(hexToRgb(formatted));
                  latestHexRef.current = formatted;
                  schedulePreview();
                  commitFinal();
                }
              }}
            />
          </div>
        </div>
        <div className="cp-swatch" style={{ background: hex }} title={hex} />
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

      {/* Recently used colors */}
      {recentColors.length > 0 && (
        <div className="cp-recent">
          <span className="cp-label">Recent</span>
          <div className="cp-recent-swatches">
            {recentColors.map((h, i) => (
              <div
                key={i}
                className="cp-recent-swatch"
                style={{ background: h }}
                title={h}
                onClick={() => applyRecent(h)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
