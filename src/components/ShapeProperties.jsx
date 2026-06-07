// src/components/ShapeProperties.jsx
import { useState, useEffect } from "react";
import ColorPicker from "./ColorPicker";

export default function ShapeProperties({
  shape,
  index,
  shapes,
  updateShape,
  deleteShape,
  moveShapeUp,
  moveShapeDown,
  setSelectedIndices,
}) {
  const [localScale, setLocalScale] = useState(shape.scale);
  // Angle: stored internally as radians, displayed/edited as degrees
  const [localAngle, setLocalAngle] = useState(
    +((shape.angle * 180) / Math.PI).toFixed(2)
  );
  const [localX, setLocalX] = useState(shape.x);
  const [localY, setLocalY] = useState(shape.y);

  const locked = shape.locked;

  // Sync local state when shape changes externally (drag, keyboard, etc.)
  useEffect(() => { setLocalScale(shape.scale); }, [shape.scale]);
  useEffect(() => {
    // Only sync angle from external if user isn't mid-type
    // Convert radians → degrees for display
    setLocalAngle(+((shape.angle * 180) / Math.PI).toFixed(2));
  }, [shape.angle]);
  useEffect(() => { setLocalX(shape.x); }, [shape.x]);
  useEffect(() => { setLocalY(shape.y); }, [shape.y]);

  return (
    <div className="shape-props-form">

      <ColorPicker
        color={shape.color}
        disabled={locked}
        onPreview={(val) =>
          !locked && updateShape(index, { color: val }, { commit: false })
        }
        onCommit={(val) =>
          !locked && updateShape(index, { color: val }, { commit: true })
        }
      />

      <div className="shape-props-grid">
        <label>
          Scale:
          <input
            className="neon-input"
            value={localScale}
            disabled={locked}
            onChange={(e) => {
              setLocalScale(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) updateShape(index, { scale: val });
            }}
          />
        </label>

        <label>
          Angle (°):
          <input
            className="neon-input"
            value={localAngle}
            disabled={locked}
            onChange={(e) => {
              setLocalAngle(e.target.value);
              const deg = parseFloat(e.target.value);
              if (!isNaN(deg)) {
                // Convert degrees → radians for internal storage
                updateShape(index, { angle: (deg * Math.PI) / 180 });
              }
            }}
          />
        </label>

        <label>
          X Pos:
          <input
            className="neon-input"
            value={localX}
            disabled={locked}
            onChange={(e) => {
              setLocalX(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateShape(index, { x: val });
            }}
          />
        </label>

        <label>
          Y Pos:
          <input
            className="neon-input"
            value={localY}
            disabled={locked}
            onChange={(e) => {
              setLocalY(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateShape(index, { y: val });
            }}
          />
        </label>
      </div>

      <div className="flip-row">
        <button
          className={`flip-btn ${shape.flipX ? "active" : ""}`}
          disabled={locked}
          onClick={() => updateShape(index, { flipX: !shape.flipX })}
        >
          Flip X
        </button>
        <button
          className={`flip-btn ${shape.flipY ? "active" : ""}`}
          disabled={locked}
          onClick={() => updateShape(index, { flipY: !shape.flipY })}
        >
          Flip Y
        </button>
      </div>

      <div className="move-row">
        <button
          className="move-btn"
          disabled={locked || index === shapes.length - 1}
          onClick={() => moveShapeUp(index)}
        >
          Move Up
        </button>
        <button
          className="move-btn"
          disabled={locked || index === 0}
          onClick={() => moveShapeDown(index)}
        >
          Move Down
        </button>
      </div>

      <button
        className="delete-btn"
        disabled={locked}
        onClick={() => {
          deleteShape(index);
          setSelectedIndices([]);
        }}
      >
        Delete Shape
      </button>
    </div>
  );
}
