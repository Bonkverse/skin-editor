// src/panels/MainPanel.jsx
// Multi-select additions:
// - When selectedIndices.length > 1, Properties tab shows "Multi-select" mode
// - Color picker applies to ALL selected shapes
// - Scale/Angle apply to ALL
// - Flip X/Y apply to ALL
// - Delete deletes ALL

import { useState, useEffect } from "react";
import ColorPicker from "../components/ColorPicker";
import LayersTab from "./LayersTab";

export default function MainPanel({ shapes, bonk, overlay, showPanel, setShowPanel, onTabRef }) {
  const selectedIndices = shapes.selectedIndices;
  const selectedIdx = selectedIndices.length === 1 ? selectedIndices[0] : null;
  const selectedShape = selectedIdx !== null ? shapes.shapes[selectedIdx] : null;
  const isMulti = selectedIndices.length > 1;
  const hasSelection = selectedIndices.length > 0;
  const hasOverlay = !!overlay.overlay.src;
  const ov = overlay.overlay;

  // For multi-select, use the first selected shape's values as the "current" display
  const displayShape = isMulti
    ? shapes.shapes[selectedIndices[0]]
    : selectedShape;
  const locked = displayShape?.locked ?? false;

  const [tab, setTab] = useState("bg");

  useEffect(() => {
    if (hasSelection) setTab("props");
    else setTab("bg");
  }, [selectedIndices.length > 0]);

  useEffect(() => {
    if (onTabRef) onTabRef.current = setTab;
  }, [onTabRef]);

  const [localScale, setLocalScale] = useState(displayShape?.scale ?? 1);
  const [localAngle, setLocalAngle] = useState(
    displayShape ? +((displayShape.angle * 180) / Math.PI).toFixed(2) : 0
  );
  const [localX, setLocalX] = useState(displayShape?.x ?? 0);
  const [localY, setLocalY] = useState(displayShape?.y ?? 0);

  useEffect(() => {
    if (!displayShape) return;
    setLocalScale(displayShape.scale);
    setLocalAngle(+((displayShape.angle * 180) / Math.PI).toFixed(2));
    setLocalX(displayShape.x);
    setLocalY(displayShape.y);
  }, [displayShape?.scale, displayShape?.angle, displayShape?.x, displayShape?.y, selectedIndices.join(",")]);

  const tabs = hasSelection
    ? [
        { id: "props", label: isMulti ? `Multi (${selectedIndices.length})` : "Properties", hint: "1" },
        { id: "layers", label: `Layers (${shapes.shapes.length})`, hint: "2" },
      ]
    : [
        { id: "bg", label: "Background", hint: "1" },
        { id: "layers", label: `Layers (${shapes.shapes.length})`, hint: "2" },
        ...(hasOverlay ? [{ id: "overlay", label: "Overlay", hint: "3" }] : []),
      ];

  // For color picker: multi-select shows first shape's color as starting point
  const displayColor = displayShape?.color ?? "#000000";

  function applyColor(val, opts) {
    if (isMulti) shapes.updateSelectedShapes({ color: val }, opts);
    else if (selectedIdx !== null) shapes.updateShape(selectedIdx, { color: val }, opts);
  }

  return (
    <>
      <button className="panel-toggle-btn" onClick={() => setShowPanel(v => !v)} title="Toggle panel">
        {showPanel ? "◀" : "▶"}
      </button>

      <div className={`main-panel ${showPanel ? "open" : ""}`}>
        <div className="mp-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`mp-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)} title={`Press ${t.hint}`}>
              {t.label}<span className="mp-tab-hint">{t.hint}</span>
            </button>
          ))}
        </div>

        <div className="mp-body">

          {/* ── PROPERTIES / MULTI-SELECT TAB ────────────────── */}
          {tab === "props" && hasSelection && displayShape && (
            <div className="mp-section">

              {/* Multi-select badge */}
              {isMulti && (
                <div className="multi-select-badge">
                  ✦ {selectedIndices.length} shapes selected
                  <button className="multi-deselect" onClick={shapes.clearSelection}>✕ Deselect all</button>
                </div>
              )}

              {/* Layer order — single only */}
              {!isMulti && (
                <>
                  <div className="mp-field-label">Layer Order</div>
                  <div className="mp-row" style={{ marginBottom: 12 }}>
                    <button className="move-btn"
                      disabled={locked || selectedIdx === shapes.shapes.length - 1}
                      onClick={() => shapes.moveShapeUp(selectedIdx)}>↑ Forward</button>
                    <button className="move-btn"
                      disabled={locked || selectedIdx === 0}
                      onClick={() => shapes.moveShapeDown(selectedIdx)}>↓ Back</button>
                  </div>
                </>
              )}

              {/* Color — applies to all selected */}
              <div className="mp-field-label">
                {isMulti ? "Apply Color to All" : "Shape Color"}
              </div>
              <ColorPicker
                key={`sel-${selectedIndices.join("-")}`}
                color={displayColor}
                disabled={locked}
                onPreview={(val) => applyColor(val, { commit: false })}
                onCommit={(val) => applyColor(val, { commit: true })}
              />

              {/* Transform */}
              <div className="mp-field-label" style={{ marginTop: 12 }}>
                Transform {isMulti && <span style={{ color: "rgba(0,255,204,0.5)", fontSize: 9 }}>— applies to all</span>}
              </div>
              <div className="mp-grid">
                <label className="mp-field">
                  <span>Scale</span>
                  <input className="neon-input" value={localScale} disabled={locked}
                    onChange={(e) => {
                      setLocalScale(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v > 0) {
                        if (isMulti) shapes.updateSelectedShapes({ scale: v });
                        else shapes.updateShape(selectedIdx, { scale: v });
                      }
                    }} />
                </label>
                <label className="mp-field">
                  <span>Angle °</span>
                  <input className="neon-input" value={localAngle} disabled={locked}
                    onChange={(e) => {
                      setLocalAngle(e.target.value);
                      const d = parseFloat(e.target.value);
                      if (!isNaN(d)) {
                        const r = (d * Math.PI) / 180;
                        if (isMulti) shapes.updateSelectedShapes({ angle: r });
                        else shapes.updateShape(selectedIdx, { angle: r });
                      }
                    }} />
                </label>
                {/* X/Y only for single select */}
                {!isMulti && (
                  <>
                    <label className="mp-field">
                      <span>X</span>
                      <input className="neon-input" value={localX} disabled={locked}
                        onChange={(e) => { setLocalX(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) shapes.updateShape(selectedIdx, { x: v }); }} />
                    </label>
                    <label className="mp-field">
                      <span>Y</span>
                      <input className="neon-input" value={localY} disabled={locked}
                        onChange={(e) => { setLocalY(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) shapes.updateShape(selectedIdx, { y: v }); }} />
                    </label>
                  </>
                )}
              </div>

              {/* Flip */}
              <div className="mp-row" style={{ marginTop: 8 }}>
                <button className={`flip-btn ${!isMulti && displayShape.flipX ? "active" : ""}`}
                  disabled={locked}
                  onClick={() => {
                    if (isMulti) shapes.updateSelectedShapes({ flipX: !displayShape.flipX });
                    else shapes.updateShape(selectedIdx, { flipX: !displayShape.flipX });
                  }}>Flip X</button>
                <button className={`flip-btn ${!isMulti && displayShape.flipY ? "active" : ""}`}
                  disabled={locked}
                  onClick={() => {
                    if (isMulti) shapes.updateSelectedShapes({ flipY: !displayShape.flipY });
                    else shapes.updateShape(selectedIdx, { flipY: !displayShape.flipY });
                  }}>Flip Y</button>
              </div>

              {/* Delete */}
              <button className="delete-btn" disabled={locked} style={{ marginTop: 10, width: "100%" }}
                onClick={() => {
                  if (isMulti) shapes.deleteSelected();
                  else { shapes.deleteShape(selectedIdx); shapes.clearSelection(); }

                }}>
                {isMulti ? `Delete ${selectedIndices.length} Shapes` : "Delete Shape"}

              </button>
            </div>
          )}

          {/* ── BACKGROUND TAB ───────────────────────────────── */}
          {tab === "bg" && (
            <div className="mp-section">
              <div className="mp-field-label">Background Color</div>
              <ColorPicker key="base" color={bonk.baseColor}
                onPreview={(val) => bonk.setBaseColor(val)}
                onCommit={(val) => bonk.setBaseColor(val)} />
              <p className="mp-hint">
                Click a shape to select it.<br/>
                <kbd>Shift</kbd>+click to multi-select.<br/>
                Drag empty canvas to box-select.<br/>
                Press <kbd>Shift+Space</kbd> to add shapes.
              </p>
            </div>
          )}

          {/* ── LAYERS TAB ───────────────────────────────────── */}
          {tab === "layers" && <LayersTab shapes={shapes} />}

          {/* ── OVERLAY TAB ──────────────────────────────────── */}
          {tab === "overlay" && hasOverlay && (
            <div className="mp-section">
              <div className={`overlay-mode-badge ${overlay.overlayMode ? "active" : ""}`}
                onClick={overlay.toggleOverlayMode} title="Press O to toggle">
                {overlay.overlayMode ? "🟢 Editing overlay — click to exit" : "⚪ Click to edit overlay (O)"}
              </div>
              <label className="overlay-row">
                <span>Visible</span>
                <input type="checkbox" checked={ov.visible}
                  onChange={(e) => overlay.setOverlay((o) => ({ ...o, visible: e.target.checked }))} />
              </label>
              <label className="overlay-row">
                <span>Opacity</span>
                <input type="range" min={0} max={1} step={0.01} value={ov.opacity}
                  onChange={(e) => overlay.setOverlay((o) => ({ ...o, opacity: parseFloat(e.target.value) }))} />
                <span className="overlay-value">{Math.round(ov.opacity * 100)}%</span>
              </label>
              {ov.sampledColors.length > 0 && (
                <div className="overlay-colors">
                  <div className="overlay-colors-label">Image colors<span className="overlay-colors-hint"> — {hasSelection ? "→ shape(s)" : "→ background"}</span></div>
                  <div className="overlay-swatches">
                    {ov.sampledColors.map((hex, i) => (
                      <div key={i} className="overlay-swatch" style={{ background: hex }} title={hex}
                        onClick={() => {
                          if (isMulti) shapes.updateSelectedShapes({ color: hex }, { commit: true });
                          else if (selectedShape && !locked) shapes.updateShape(selectedIdx, { color: hex }, { commit: true });
                          else bonk.setBaseColor(hex);
                        }} />
                    ))}
                  </div>
                </div>
              )}
              <button className="delete-btn" style={{ marginTop: 10, width: "100%" }} onClick={overlay.clearOverlay}>Remove Overlay</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
