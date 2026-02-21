import { screenToWorld } from "../utils/screenToWorld";

let active = false;

export function startShapeDrag(e, shape, index, shapes, camera) {
  if (active) return;
  if (shape.locked) return;

  active = true;
  e.stopPropagation();

  const start = screenToWorld(e.clientX, e.clientY, camera);

  const dragState = {
    start,
    startX: shape.x,
    startY: shape.y,
  };

  const onMove = (ev) => {
    const cur = screenToWorld(ev.clientX, ev.clientY, camera);

    shapes.updateShape(
      index,
      {
        x: dragState.startX + (cur.x - dragState.start.x),
        y: dragState.startY + (cur.y - dragState.start.y),
      },
      { commit: false }
    );
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);

    // ✅ commit final position into undo history
    shapes.updateShape(index, {}, { commit: true });

    active = false;
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}
