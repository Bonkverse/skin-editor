// src/canvas/EditorCanvas.jsx

import { useRef } from "react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction";
import { useCanvasCameraControls } from "../hooks/useCanvasCameraControls";

export default function EditorCanvas({ shapes, camera, overlay, baseColor, onActivateOverlay }) {
  const canvasRef = useRef(null);

  useCanvasRenderer(canvasRef, shapes, camera, baseColor, overlay);
  useCanvasInteraction(canvasRef, shapes, camera, overlay);
  useCanvasCameraControls(canvasRef, camera);

  function onDragOver(e) { e.preventDefault(); }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // setImage handles color sampling + sets overlayMode=true
      overlay.setImage(src, img);
      // Switch panel to overlay tab
      if (onActivateOverlay) onActivateOverlay();
    };
    img.src = src;
  }

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      style={{ width: "100vw", height: "100vh", display: "block", cursor: "default" }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}
