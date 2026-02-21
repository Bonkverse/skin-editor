import {useState, useEffect} from "react";
import ColorPicker from "./ColorPicker";

export default function ShapeProperties({
  shape,
  index,
  shapes,
  updateShape,
  moveShapeUp,
  moveShapeDown,
  setSelectedIndices,
}) {
  const [localScale, setLocalScale] = useState(shape.scale);
  const [localAngle, setLocalAngle] = useState(shape.angle);
  const [localX, setLocalX] = useState(shape.x);
  const [localY, setLocalY] = useState(shape.y);

  const locked = shape.locked;

  useEffect(() => {
    setLocalScale(shape.scale);
  }, [shape.scale]);

  useEffect(() => {
    setLocalAngle(shape.angle);
  }, [shape.angle]);

  useEffect(() => {
    setLocalX(shape.x);
    setLocalY(shape.y);
  }, [shape.x, shape.y]);


  return (
    <div className="shape-props-form">
      {/* Color */}
      {/* <ColorPicker
        color={shape.color}
        disabled={locked}
        onChange={(newColor) =>
          !locked && updateShape(index, { color: newColor })
        }
      /> */}
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
              if (!isNaN(val)) updateShape(index, { scale: val });
            }}
          />
        </label>

        <label>
          Angle:
          <input
            className="neon-input"
            value={localAngle}
            disabled={locked}
            onChange={(e) => {
              setLocalAngle(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateShape(index, { angle: val });
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
          updateShape(index, { _delete: true }); // see note below
          setSelectedIndices([]);
        }}
      >
        Delete Shape
      </button>
    </div>
  );
}
