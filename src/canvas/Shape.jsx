// canvas/Shape.jsx
import { useRef } from "react";

export default function Shape({ s, i, shapes, camera }) {
  const dragRef = useRef(null);

  function onMouseDown(e) {
    e.stopPropagation();

    // select this shape
    shapes.setSelectedIndices([i]);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { x: s.x, y: s.y },
    };

    const onMove = (ev) => {
      if (!dragRef.current) return;

      const dx = (ev.clientX - dragRef.current.startX) / camera.camera.zoom;
      const dy = (ev.clientY - dragRef.current.startY) / camera.camera.zoom;

      shapes.updateShape(i, {
        x: dragRef.current.startPos.x + dx,
        y: dragRef.current.startPos.y + dy,
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <g
      transform={`
        translate(${s.x}, ${s.y})
        rotate(${(s.angle * 180) / Math.PI})
        scale(${s.scale})
      `}
      onMouseDown={onMouseDown}
      style={{ cursor: "move" }}
    >
      {/* Placeholder shape geometry */}
      <circle r={20} fill={s.color} />
    </g>
  );
}
