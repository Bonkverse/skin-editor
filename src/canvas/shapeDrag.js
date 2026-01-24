// src/canvas/shapeDrag.js
import { screenToWorld } from "../utils/screenToWorld";

export function startShapeDrag(e, shape, index, shapes, camera) {
  if (shape.locked) return;
  e.stopPropagation();

  const start = screenToWorld(e.clientX, e.clientY, camera);

  const dragState = {
    start,
    startX: shape.x,
    startY: shape.y,
  };

  const onMove = (ev) => {
    const cur = screenToWorld(ev.clientX, ev.clientY, camera);
    // shapes.updateShape(index, {
    //   x: dragState.startX + (cur.x - dragState.start.x),
    //   y: dragState.startY + (cur.y - dragState.start.y),
    // });
    shapes.updateShape(
      index,
      {
        x: dragState.startX + (cur.x - dragState.start.x),
        y: dragState.startY + (cur.y - dragState.start.y),
      },
      { commit: false } // 👈 KEY
    );
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}
