import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import "./ColorPicker.css";

export default function ColorPicker({ color, onChange, disabled }) {
  const [hex, setHex] = useState(color);
  const [rgb, setRgb] = useState(hexToRgb(color));

  // Track last prop color to avoid loops
  const lastColorRef = useRef(color);

  useEffect(() => {
    if (color !== lastColorRef.current) {
      lastColorRef.current = color;
      setHex(color);
      setRgb(hexToRgb(color));
    }
  }, [color]);

  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function commitColor(newHex) {
    if (newHex !== lastColorRef.current) {
      lastColorRef.current = newHex;
      onChange(newHex);
    }
  }

  function handleRgbChange(component, value) {
    const newRgb = { ...rgb, [component]: parseInt(value) || 0 };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    commitColor(newHex);
  }

  function handleHexChange(value) {
    const formatted = value.startsWith("#") ? value : "#" + value;
    setHex(formatted);
    if (formatted.length === 7) commitColor(formatted);
  }

  return (
    <div className="color-picker-wrapper">
      <HexColorPicker
        color={hex}
        onChange={(val) => {
          setHex(val);
          setRgb(hexToRgb(val));
          commitColor(val);
        }}
        disabled={disabled}
      />

      <div className="color-inputs">
        <div className="color-row">
          <div>
            <label>Hex</label>
            <input
              value={hex.replace("#", "").toUpperCase()}
              maxLength={6}
              disabled={disabled}
              onChange={(e) => handleHexChange(e.target.value)}
            />
          </div>
          {["r", "g", "b"].map((c) => (
            <div key={c}>
              <label>{c.toUpperCase()}</label>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[c]}
                disabled={disabled}
                onChange={(e) => handleRgbChange(c, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
