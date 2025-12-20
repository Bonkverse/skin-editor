import React from "react";
import ColorPicker from "./ColorPicker";

export default function GroupProperties({ shapes, selectedIndices, updateShapes }) {
  const selectedShapes = selectedIndices.map((i) => shapes[i]);
  if (selectedShapes.length === 0) return null;

  // Compute averages for display
  const avgScale = (
    selectedShapes.reduce((sum, s) => sum + s.scale, 0) / selectedShapes.length
  ).toFixed(3);
  const avgAngle = (
    selectedShapes.reduce((sum, s) => sum + s.angle, 0) / selectedShapes.length
  ).toFixed(1);
  const avgX = (
    selectedShapes.reduce((sum, s) => sum + s.x, 0) / selectedShapes.length
  ).toFixed(1);
  const avgY = (
    selectedShapes.reduce((sum, s) => sum + s.y, 0) / selectedShapes.length
  ).toFixed(1);

  const firstColor = selectedShapes[0].color;

  function applyToGroup(patch) {
    updateShapes(selectedIndices, patch);
  }

  return (
    <div className="shape-props-form">
      <h3>Group Properties ({selectedIndices.length} shapes)</h3>

      <div className="shape-color-section">
        <ColorPicker
          color={firstColor}
          onChange={(newColor) => applyToGroup({ color: newColor })}
        />
      </div>

      <div className="shape-props-grid">
        <label>
          Scale:
          <input
            type="number"
            step="0.05"
            defaultValue={avgScale}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) applyToGroup({ scale: val });
            }}
          />
        </label>

        <label>
          Angle:
          <input
            type="number"
            defaultValue={avgAngle}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) applyToGroup({ angle: val });
            }}
          />
        </label>

        <label>
          X Pos:
          <input
            type="number"
            defaultValue={avgX}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) applyToGroup({ x: val });
            }}
          />
        </label>

        <label>
          Y Pos:
          <input
            type="number"
            defaultValue={avgY}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) applyToGroup({ y: val });
            }}
          />
        </label>
      </div>

      <div className="flip-row">
        <button className="flip-btn" onClick={() => applyToGroup({ flipX: true })}>
          Flip X
        </button>
        <button className="flip-btn" onClick={() => applyToGroup({ flipY: true })}>
          Flip Y
        </button>
      </div>
    </div>
  );
}
