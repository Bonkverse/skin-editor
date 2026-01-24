import { useState } from "react";

export default function LayersPanel({ shapes, ui }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  function reorder(list, from, to) {
    const copy = [...list];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className="dock-btn right"
        onClick={() => ui.setShowLayers((v) => !v)}
      >
        Layers
      </button>

      {/* Panel */}
      <div className={`panel layers-panel ${ui.showLayers ? "open" : ""}`}>
        <h3>
          Layers ({shapes.shapes.length}/16)
          {shapes.shapes.length >= 16 && (
            <div
              style={{
                color: "#00ffcc",
                fontSize: "0.8rem",
                marginTop: "4px",
                textAlign: "center",
                textShadow: "0 0 6px rgba(0,255,200,0.5)",
              }}
            >
              ✨ Bonk limit reached — optimize or keep creating! ✨
            </div>
          )}
        </h3>

        <div className="layers-list">
          {shapes.shapes
            .slice()
            .reverse()
            .map((s, i) => {
              const total = shapes.shapes.length;
              const realIndex = total - 1 - i;

              const selected = shapes.isSelected(realIndex);
              const isDragging = dragIndex === i;
              const isPlaceholder =
                hoverIndex === i && dragIndex !== null && dragIndex !== i;

              return (
                <div
                  key={realIndex}
                  draggable={!s.locked}
                  onDragStart={() => {
                    if (s.locked) return;
                    setDragIndex(i);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (i !== dragIndex) setHoverIndex(i);
                  }}
                  onDragEnd={() => {
                    if (
                      dragIndex !== null &&
                      hoverIndex !== null &&
                      dragIndex !== hoverIndex
                    ) {
                      const reversed = [...shapes.shapes].reverse();
                      const reordered = reorder(
                        reversed,
                        dragIndex,
                        hoverIndex
                      );
                      shapes.commitShapes(reordered.reverse());
                    }
                    setDragIndex(null);
                    setHoverIndex(null);
                  }}
                  className={`layer-row ${selected ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                    borderRadius: "6px",
                    padding: "6px",
                    userSelect: "none",
                    cursor: s.locked ? "not-allowed" : "grab",

                    opacity: isDragging
                      ? 0.4
                      : s.hidden
                      ? 0.4
                      : 1,

                    filter: s.locked ? "grayscale(60%)" : "none",

                    background: isPlaceholder
                      ? "rgba(0,255,200,0.15)"
                      : selected
                      ? "rgba(0,255,200,0.15)"
                      : "rgba(255,255,255,0.05)",

                    outline: isPlaceholder
                      ? "2px dashed rgba(0,255,200,0.6)"
                      : "none",

                    transition:
                      "background 120ms ease, opacity 120ms ease",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="layer-thumb"
                    dangerouslySetInnerHTML={{
                      __html: shapes.getShapeMarkup(
                        s.id,
                        s.color,
                        26,
                        s.angle,
                        s.flipX,
                        s.flipY
                      ),
                    }}
                    style={{
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: "4px",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Name / Select */}
                  <button
                    onClick={() =>
                      !s.locked &&
                      shapes.setSelectedIndices([realIndex])
                    }
                    className={`layer-btn ${selected ? "active" : ""}`}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: s.locked ? "not-allowed" : "pointer",
                    }}
                  >
                    Shape {s.id}
                  </button>

                  {/* Lock */}
                  <button
                    className="tiny-btn"
                    title={s.locked ? "Unlock shape" : "Lock shape"}
                    onClick={() =>
                      shapes.updateShape(realIndex, {
                        locked: !s.locked,
                      })
                    }
                  >
                    {s.locked ? "🔒" : "🔓"}
                  </button>

                  {/* Hide */}
                  <button
                    className="tiny-btn"
                    title={s.hidden ? "Show shape" : "Hide shape"}
                    onClick={() => {
                      shapes.updateShape(realIndex, {
                        hidden: !s.hidden,
                      });
                      shapes.clearSelection();
                    }}
                  >
                    {s.hidden ? "🙈" : "👁️"}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
