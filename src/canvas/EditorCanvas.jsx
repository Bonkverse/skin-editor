// src/canvas/EditorCanvas.jsx
import { useRef, useState, useMemo } from "react";
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

  // 🔥 Track whether mouse is inside the canvas
  const [hoveringCanvas, setHoveringCanvas] = useState(false);

  useCanvasCameraControls(svgRef, camera);

  /**
   * Derive render order:
   * - When hovering canvas → selected shapes render last (on top)
   * - When not hovering → normal layer order
   */
  const orderedShapes = useMemo(() => {
    if (!hoveringCanvas || shapes.selectedIndices.length === 0) {
      return shapes.shapes.map((s, i) => ({ s, i }));
    }

    const selected = new Set(shapes.selectedIndices);

    return [
      // Non-selected first
      ...shapes.shapes
        .map((s, i) => ({ s, i }))
        .filter(({ i }) => !selected.has(i)),

      // Selected last (on top)
      ...shapes.shapes
        .map((s, i) => ({ s, i }))
        .filter(({ i }) => selected.has(i)),
    ];
  }, [hoveringCanvas, shapes.shapes, shapes.selectedIndices]);

  return (
    <svg
      ref={svgRef}
      className="editor-canvas"
      style={{ width: "100vw", height: "100vh" }}
      onMouseEnter={() => setHoveringCanvas(true)}
      onMouseLeave={() => setHoveringCanvas(false)}
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
        <g
          transform={`translate(${window.innerWidth / 2}, ${window.innerHeight / 2})`}
        >
          <defs>
            <clipPath id="playerClip">
              <circle cx={0} cy={0} r={BALL_RADIUS_PX} />
            </clipPath>
          </defs>

          {/* Player outline */}
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

          {/* ============================= */}
          {/* SHAPES */}
          {/* ============================= */}

          {/* Non-selected shapes (CLIPPED) */}
          <g clipPath="url(#playerClip)">
            {orderedShapes
              .filter(({ i }) => !shapes.isSelected(i))
              .map(({ s, i }) => (
                <Shape
                  key={`shape-${i}`}
                  s={s}
                  i={i}
                  shapes={shapes}
                  camera={camera}
                />
              ))}
          </g>

          {/* Selected shapes (NOT clipped, always on top) */}
          {orderedShapes
            .filter(({ i }) => shapes.isSelected(i))
            .map(({ s, i }) => (
              <Shape
                key={`shape-selected-${i}`}
                s={s}
                i={i}
                shapes={shapes}
                camera={camera}
              />
            ))}



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
