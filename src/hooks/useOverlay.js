// src/hooks/useOverlay.js
import { useRef, useState } from "react";
import { CANVAS_SIZE } from "../bonk/constants";

export function useOverlay(camera) {
  const [overlay, setOverlay] = useState({
    src: null,
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    scale: 1,
    opacity: 0.5,
    visible: true,
  });

  const dragRef = useRef(null);

  function startDrag(e) {
    e.stopPropagation();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { x: overlay.x, y: overlay.y },
    };

    const onMove = (ev) => {
      if (!dragRef.current) return;

      const dx = (ev.clientX - dragRef.current.startX) / camera.camera.zoom;
      const dy = (ev.clientY - dragRef.current.startY) / camera.camera.zoom;

      setOverlay((o) => ({
        ...o,
        x: dragRef.current.startPos.x + dx,
        y: dragRef.current.startPos.y + dy,
      }));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function setImage(src) {
    setOverlay((o) => ({ ...o, src, visible: true }));
  }

  return {
    overlay,
    startDrag,
    setImage,
    setOverlay, // keep for tools panel
  };
}
