// src/canvas/EditorCanvas.jsx
import { CANVAS_SIZE, BALL_RADIUS_PX } from "../bonk/constants";
import Shape from "./Shape";

export default function EditorCanvas({
  shapes,   // useShapesEditor system
  camera,   // useCamera system
  overlay,  // useOverlay system
  baseColor
}) {
  const { overlay: o, startDrag, setImage } = overlay;

  return (
    <svg
      className="editor-canvas"
      onMouseDown={shapes.clearSelection}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (evt) => setImage(evt.target.result);
          reader.readAsDataURL(file);
        }
      }}
    >
      {/* Camera transform */}
      <g
        transform={`
          translate(
            ${camera.camera.x + window.innerWidth / 2 - CANVAS_SIZE / 2},
            ${camera.camera.y + window.innerHeight / 2 - CANVAS_SIZE / 2}
          )
          scale(${camera.camera.zoom})
        `}
      >
        {/* Clip mask for player circle */}
        <defs>
          <clipPath id="playerClip">
            <circle
              cx={CANVAS_SIZE / 2}
              cy={CANVAS_SIZE / 2}
              r={BALL_RADIUS_PX}
            />
          </clipPath>
        </defs>

        {/* Player outline */}
        <circle
          cx={CANVAS_SIZE / 2}
          cy={CANVAS_SIZE / 2}
          r={BALL_RADIUS_PX + 2}
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth={4}
        />

        {/* Player base color */}
        <circle
          cx={CANVAS_SIZE / 2}
          cy={CANVAS_SIZE / 2}
          r={BALL_RADIUS_PX}
          fill={baseColor}
          stroke="#333"
          strokeWidth={3}
        />

        {/* Overlay image */}
        {o.src && o.visible && (
          <image
            href={o.src}
            x={o.x - CANVAS_SIZE / 2}
            y={o.y - CANVAS_SIZE / 2}
            width={CANVAS_SIZE * o.scale}
            height={CANVAS_SIZE * o.scale}
            opacity={o.opacity}
            style={{ cursor: "move" }}
            onMouseDown={startDrag}
          />
        )}

        {/* Non-selected shapes (clipped) */}
        <g clipPath="url(#playerClip)">
          {shapes.shapes.map((s, i) =>
            shapes.isSelected(i) ? null : (
              <Shape
                key={i}
                s={s}
                i={i}
                shapes={shapes}
                camera={camera}
              />
            )
          )}
        </g>

        {/* Selected shapes (unclipped, on top) */}
        {!shapes.isReordering &&
          shapes.shapes.map((s, i) =>
            shapes.isSelected(i) ? (
              <Shape
                key={`${i}-selected`}
                s={s}
                i={i}
                shapes={shapes}
                camera={camera}
              />
            ) : null
          )}
      </g>
    </svg>
  );
}
