// canvas/SelectionOverlay.jsx
import { svgCache } from "../utils/svgCache";
import { screenToWorld } from "../utils/screenToWorld";
import { startShapeDrag } from "./shapeDrag";


const HANDLE_SIZE = 6;

export default function SelectionOverlay({ shape, index, shapes, camera }) {
  const meta = svgCache.get(shape.id);
  if (!meta || shape.locked) return null;

  const { w, h } = meta;

  // ---------- DRAG ----------
  function onMouseDownBox(e) {
    if (shape.locked) return;
    startShapeDrag(e, shape, index, shapes, camera);
}


  // ---------- SCALE + ROTATE ----------
  function onMouseDownHandle(e) {
    if (shape.locked) return;
    e.stopPropagation();

    const center = { x: shape.x, y: shape.y };
    const start = screenToWorld(e.clientX, e.clientY, camera);

    const startVec = {
      x: start.x - center.x,
      y: start.y - center.y,
    };

    const startDist = Math.hypot(startVec.x, startVec.y);
    const startAngle = shape.angle;
    const startScale = shape.scale;

    const onMove = (ev) => {
      const cur = screenToWorld(ev.clientX, ev.clientY, camera);
      const curVec = {
        x: cur.x - center.x,
        y: cur.y - center.y,
      };

      const dist = Math.hypot(curVec.x, curVec.y);
      const angleDelta =
        Math.atan2(curVec.y, curVec.x) -
        Math.atan2(startVec.y, startVec.x);

      // shapes.updateShape(index, {
      //   scale: Math.max(0.05, startScale * (dist / startDist)),
      //   angle: startAngle + angleDelta,
      // });
      shapes.updateShape(
        index,
        {
          scale: Math.max(0.05, startScale * (dist / startDist)),
          angle: startAngle + angleDelta,
        },
        { commit: false }
      );

    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <g
      transform={`translate(${shape.x}, ${shape.y}) rotate(${(shape.angle * 180) / Math.PI}) scale(${shape.scale})`}
      style={{ pointerEvents: "all" }}
    >
      {/* Bounding box */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill="none"
        stroke="#00ffcc"
        strokeWidth={1.5}
        style={{ cursor: shape.locked ? "not-allowed" : "move" }}
        onMouseDown={onMouseDownBox}
      />

      {/* Rotate + scale handle (top-right) */}
      <circle
        cx={w / 2}
        cy={-h / 2}
        r={HANDLE_SIZE}
        fill="#00ffcc"
        stroke="#003333"
        strokeWidth={1.5}
        style={{ cursor: shape.locked ? "not-allowed" : "nwse-resize" }}
        onMouseDown={onMouseDownHandle}
      />
    </g>
  );
}
