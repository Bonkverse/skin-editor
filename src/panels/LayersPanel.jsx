export default function LayersPanel({
  showLayers,
  shapes,
  isSelected,
  setSelectedIndices,
  updateShape,
  commitShapes,
  getShapeMarkup,
}) {
  return ( 
    <div className={`panel layers-panel ${showLayers ? "open" : ""}`}>
        <h3>
          Layers ({shapes.length}/16)
          {shapes.length >= 16 && (
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
          {shapes
            .slice()
            .reverse()
            .map((s, i) => {
              const realIndex = shapes.length - 1 - i;
              const selected = isSelected(realIndex);
              return (
                <div
                  key={i}
                  className={`layer-row ${selected ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                    background: selected
                      ? "rgba(0,255,200,0.15)"
                      : "rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    padding: "4px",
                    userSelect: "none",
                    cursor: "grab",
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", i.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = parseInt(e.dataTransfer.getData("text/plain"));
                    const to = i;

                    const reversed = [...shapes].reverse();
                    const [moved] = reversed.splice(from, 1);
                    reversed.splice(to, 0, moved);

                    const newShapes = reversed.reverse();
                    commitShapes(newShapes);
                    }}
                >
                  {/* Thumbnail */}
                  <div
                    className="layer-thumb"
                    dangerouslySetInnerHTML={{ __html: getShapeMarkup(s.id, s.color) }}
                    style={{
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: "4px",
                      transform: `
                        scale(${s.flipX ? -0.8 : 0.8}, ${s.flipY ? -0.8 : 0.8})
                        rotate(${s.angle}deg)
                      `,
                      filter: s.hidden ? "grayscale(100%) brightness(0.4)" : "none",
                      pointerEvents: "none",
                    }}
                  />



                  {/* Name */}
                  <button
                    onClick={() => setSelectedIndices([realIndex])}
                    className={`layer-btn ${selected ? "active" : ""}`}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Shape {s.id}
                  </button>

                  {/* Lock toggle */}
                  <button
                    className="tiny-btn"
                    title={s.locked ? "Unlock shape" : "Lock shape"}
                    onClick={() => updateShape(realIndex, { locked: !s.locked })}
                  >
                    {s.locked ? "🔒" : "🔓"}
                  </button>

                  {/* Hide toggle */}
                  <button
                    className="tiny-btn"
                    title={s.hidden ? "Show shape" : "Hide shape"}
                    onClick={() => updateShape(realIndex, { hidden: !s.hidden })}
                  >
                    {s.hidden ? "🙈" : "👁️"}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
   );
}