// src/panels/LayersTab.jsx
// Multi-select additions:
//   - Click a row → select only that shape (existing)
//   - Shift+click a row → toggle that shape in/out of selection
//   - Selected rows show a teal highlight
//   - Multi-selected rows show a slightly different tint so you can
//     tell at a glance which shapes are in the group

import { useState } from "react";

export default function LayersTab({ shapes }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  function reorder(list, from, to) {
    const copy = [...list];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  if (shapes.shapes.length === 0) {
    return (
      <p className="mp-hint">
        No shapes yet. Add shapes using <kbd>Shift+Space</kbd>.
      </p>
    );
  }

  const isMulti = shapes.selectedIndices.length > 1;

  return (
    <>
      {/* Multi-select hint */}
      {shapes.shapes.length > 0 && (
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 6px", padding: "0 2px" }}>
          <kbd style={{ fontSize: 9 }}>Shift</kbd>+click to multi-select
        </p>
      )}

      <div className="layers-list">
        {shapes.shapes.slice().reverse().map((s, i) => {
          const total = shapes.shapes.length;
          const realIndex = total - 1 - i;
          const selected = shapes.isSelected(realIndex);
          const isDragging = dragIndex === i;
          const isPlaceholder = hoverIndex === i && dragIndex !== null && dragIndex !== i;

          // Visual state
          let bg = "rgba(255,255,255,0.04)";
          let outline = "none";
          if (isPlaceholder) { bg = "rgba(0,255,200,0.15)"; outline = "2px dashed rgba(0,255,200,0.5)"; }
          else if (selected && isMulti) { bg = "rgba(0,255,200,0.12)"; outline = "1px solid rgba(0,255,200,0.4)"; }
          else if (selected) { bg = "rgba(0,255,200,0.08)"; outline = "1px solid rgba(0,255,200,0.25)"; }

          return (
            <div
              key={realIndex}
              draggable={!s.locked}
              onDragStart={() => { if (!s.locked) setDragIndex(i); }}
              onDragOver={(e) => { e.preventDefault(); if (i !== dragIndex) setHoverIndex(i); }}
              onDragEnd={() => {
                if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
                  const rev = [...shapes.shapes].reverse();
                  shapes.commitShapes(reorder(rev, dragIndex, hoverIndex).reverse());
                }
                setDragIndex(null); setHoverIndex(null);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 5, borderRadius: 6, padding: "5px 6px",
                userSelect: "none",
                cursor: s.locked ? "not-allowed" : "grab",
                opacity: isDragging || s.hidden ? 0.4 : 1,
                background: bg,
                outline,
                transition: "background 100ms, outline 100ms",
              }}
            >
              {/* Shape thumbnail */}
              <div
                dangerouslySetInnerHTML={{ __html: shapes.getShapeMarkup(s.id, s.color, 22) }}
                style={{ width: 22, height: 22, flexShrink: 0, pointerEvents: "none" }}
              />

              {/* Name button — click or Shift+click */}
              <button
                onClick={(e) => {
                  if (s.locked) return;
                  if (e.shiftKey) {
                    // Shift+click: toggle this shape in/out of selection
                    shapes.toggleSelection(realIndex);
                  } else {
                    // Plain click: select only this shape
                    shapes.setSelectedIndices([realIndex]);
                  }
                }}
                style={{
                  flex: 1, textAlign: "left",
                  background: "none", border: "none",
                  color: selected ? "#00ffcc" : "#ccc",
                  cursor: s.locked ? "not-allowed" : "pointer",
                  fontSize: 12, padding: 0,
                }}
                title={s.locked ? "Locked" : "Click to select, Shift+click to multi-select"}
              >
                Shape {s.id}
                {selected && isMulti && (
                  <span style={{ fontSize: 9, color: "rgba(0,255,204,0.5)", marginLeft: 4 }}>✦</span>
                )}
              </button>

              {/* Lock */}
              <button
                className="tiny-btn"
                title={s.locked ? "Unlock shape" : "Lock shape"}
                onClick={() => shapes.updateShape(realIndex, { locked: !s.locked })}
              >
                {s.locked ? "🔒" : "🔓"}
              </button>

              {/* Hide */}
              <button
                className="tiny-btn"
                title={s.hidden ? "Show shape" : "Hide shape"}
                onClick={() => {
                  shapes.updateShape(realIndex, { hidden: !s.hidden });
                  shapes.clearSelection();
                }}
              >
                {s.hidden ? "🙈" : "👁️"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Deselect all button when multi-selected */}
      {isMulti && (
        <button
          onClick={shapes.clearSelection}
          style={{
            marginTop: 8, width: "100%",
            background: "none",
            border: "1px solid rgba(0,255,204,0.2)",
            borderRadius: 6,
            color: "rgba(0,255,204,0.6)",
            fontSize: 11, padding: "5px 0",
            cursor: "pointer",
            transition: "all 0.13s",
          }}
          onMouseEnter={e => e.target.style.borderColor = "rgba(0,255,204,0.5)"}
          onMouseLeave={e => e.target.style.borderColor = "rgba(0,255,204,0.2)"}
        >
          ✕ Deselect all ({shapes.selectedIndices.length})
        </button>
      )}
    </>
  );
}
