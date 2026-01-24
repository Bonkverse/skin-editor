// src/canvas/EditorCanvas.jsx
import { useRef } from "react";
import { CANVAS_SIZE, BALL_RADIUS_PX } from "../bonk/constants";
import Shape from "./Shape";
import SelectionOverlay from "./SelectionOverlay";
import { useCanvasCameraControls } from "../hooks/useCanvasCameraControls";

export default function EditorCanvas({
  shapes,
  camera,
  overlay,
  baseColor,
}) {
  const { overlay: o, startDrag, setImage } = overlay;
  const svgRef = useRef(null);

  useCanvasCameraControls(svgRef, camera);

  return (
    <svg
      ref={svgRef}
      className="editor-canvas"
      style={{ width: "100vw", height: "100vh" }}
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
      onMouseDown={() => shapes.clearSelection()}
    >
      {/* ============================= */}
      {/* WORLD SPACE (CAMERA) */}
      {/* ============================= */}
      <g
        transform={`
          translate(${camera.camera.x}, ${camera.camera.y})
          scale(${camera.camera.zoom})
        `}
      >
        {/* Center world at screen center */}
        <g transform={`translate(${window.innerWidth / 2}, ${window.innerHeight / 2})`}>

          {/* ✅ WORLD-SPACE HIT LAYER (for panning & deselect) */}
          {/* <rect
            x={-window.innerWidth}
            y={-window.innerHeight}
            width={window.innerWidth * 2}
            height={window.innerHeight * 2}
            fill="transparent"
            pointerEvents="all"
            onMouseDown={() => shapes.clearSelection()}
          /> */}

          <defs>
            <clipPath id="playerClip">
              <circle cx={0} cy={0} r={BALL_RADIUS_PX} />
            </clipPath>
          </defs>

          {/* Player circle */}
          <circle
            cx={0}
            cy={0}
            r={BALL_RADIUS_PX + 2}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={4}
          />
          <circle
            cx={0}
            cy={0}
            r={BALL_RADIUS_PX}
            fill={baseColor}
            stroke="#333"
            strokeWidth={3}
          />

          {/* Overlay image */}
          {o.src && o.visible && (
            <image
              href={o.src}
              x={o.x}
              y={o.y}
              width={CANVAS_SIZE * o.scale}
              height={CANVAS_SIZE * o.scale}
              opacity={o.opacity}
              style={{ cursor: "move" }}
              onMouseDown={startDrag}
            />
          )}

          {/* Non-selected shapes */}
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

          {/* Selected shapes (rendered on top) */}
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

          {/* Selection overlay */}
          {shapes.selectedIndices.length === 1 && !shapes.isReordering && (
            <SelectionOverlay
              shape={shapes.shapes[shapes.selectedIndices[0]]}
              index={shapes.selectedIndices[0]}
              shapes={shapes}
              camera={camera}
            />
          )}
        </g>
      </g>
    </svg>
  );
}
