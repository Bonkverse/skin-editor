import React from "react";
import ColorPicker from "./ColorPicker";

export default function ShapeProperties({ shape, index, shapes, updateShape, moveShapeUp, moveShapeDown, setShapes, setSelectedIndices }) {
  const [localScale, setLocalScale] = React.useState(shape.scale);
  const [localAngle, setLocalAngle] = React.useState(shape.angle);
  const [localX, setLocalX] = React.useState(shape.x);
  const [localY, setLocalY] = React.useState(shape.y);

  React.useEffect(() => {
    setLocalScale(shape.scale);
    setLocalAngle(shape.angle);
    setLocalX(shape.x);
    setLocalY(shape.y);
  }, [index, shape]);

  return (
    <div className="shape-props-form">
      <div className="shape-color-section">
        <ColorPicker
          color={shape.color}
          onChange={(newColor) => updateShape(index, { color: newColor })}
        />
      </div>



      <div className="shape-props-grid">
        <label>
          Scale:
          <input
            type="text"
            className="neon-input"
            value={localScale}
            onChange={(e) => setLocalScale(e.target.value)}
            onBlur={() => {
              const val = parseFloat(localScale);
              if (!isNaN(val)) updateShape(index, { scale: val });
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        </label>

        <label>
          Angle:
          <input
            type="text"
            className="neon-input"
            value={localAngle}
            onChange={(e) => setLocalAngle(e.target.value)}
            onBlur={() => {
              const val = parseFloat(localAngle);
              if (!isNaN(val)) updateShape(index, { angle: val });
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        </label>

        <label>
          X Pos:
          <input
            type="text"
            className="neon-input"
            value={localX}
            onChange={(e) => setLocalX(e.target.value)}
            onBlur={() => {
              const val = parseFloat(localX);
              if (!isNaN(val)) updateShape(index, { x: val });
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        </label>

        <label>
          Y Pos:
          <input
            type="text"
            className="neon-input"
            value={localY}
            onChange={(e) => setLocalY(e.target.value)}
            onBlur={() => {
              const val = parseFloat(localY);
              if (!isNaN(val)) updateShape(index, { y: val });
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        </label>
      </div>


      <div className="flip-row">
        <button
          className={`flip-btn ${shape.flipX ? "active" : ""}`}
          onClick={() => updateShape(index, { flipX: !shape.flipX })}
        >
          Flip X
        </button>
        <button
          className={`flip-btn ${shape.flipY ? "active" : ""}`}
          onClick={() => updateShape(index, { flipY: !shape.flipY })}
        >
          Flip Y
        </button>
      </div>

      <div className="move-row">
        <button
          className={`move-btn ${index === shapes.length - 1 ? "disabled" : ""}`}
          onClick={() => moveShapeUp(index)}
          disabled={index === shapes.length - 1}
        >
          Move Up
        </button>
        <button
          className={`move-btn ${index === 0 ? "disabled" : ""}`}
          onClick={() => moveShapeDown(index)}
          disabled={index === 0}
        >
          Move Down
        </button>
      </div>


      <button
        className="delete-btn"
        onClick={() => {
          setShapes((prev) => prev.filter((_, idx) => idx !== index));
          setSelectedIndices([]);
        }}
      >
        Delete Shape
      </button>
    </div>
  );
}