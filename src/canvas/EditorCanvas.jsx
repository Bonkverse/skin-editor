// src/canvas/EditorCanvas.jsx
import { useRef, useState } from "react";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction";
import { useCanvasCameraControls } from "../hooks/useCanvasCameraControls";

export default function EditorCanvas({ shapes, camera, overlay, baseColor }) {
  const canvasRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useCanvasRenderer(canvasRef, shapes, camera, baseColor, overlay);
  useCanvasInteraction(canvasRef, shapes, camera, overlay);
  useCanvasCameraControls(canvasRef, camera);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        style={{ width: "100%", height: "100%" }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const img = new Image();
              img.onload = () => overlay.setImage(evt.target.result, img);
              img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {isDragOver && (
        <div className="drop-zone-hint">
          <div className="drop-zone-box">
            <div className="drop-zone-icon">🖼️</div>
            <div className="drop-zone-title">Drop to set overlay</div>
            <div className="drop-zone-sub">Trace over it to build your skin</div>
          </div>
        </div>
      )}

      {!overlay.overlay.src && !isDragOver && (
        <div className="canvas-hint">
          💡 Drag & drop an image onto the canvas to use as a tracing overlay
        </div>
      )}
    </div>
  );
}
