// src/hooks/useCanvasCameraControls.js
//
// Handles zoom + pan via:
//   - Scroll wheel → zoom centered on cursor
//   - Middle mouse drag → pan
//   - Space + left drag → pan
//
// Empty-left-drag panning is handled by useCanvasInteraction,
// which calls canvas._startPan(e) when it hits empty space and
// the cursor is in grab mode (space held).
// This avoids any race condition between two mousedown listeners.

import { useEffect, useRef } from "react";

export function useCanvasCameraControls(canvasRef, camera) {
  const setCameraRef = useRef(camera.setCamera);
  const cameraRef = camera.cameraRef;
  const spaceHeldRef = useRef(false);

  // Expose spaceHeldRef on the canvas element so useCanvasInteraction
  // can read it synchronously without any shared React state.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas._spaceHeld = spaceHeldRef;
  });

  // ── Space key ─────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code !== "Space") return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable
      ) return;
      e.preventDefault();
      if (spaceHeldRef.current) return;
      spaceHeldRef.current = true;
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = "grab";
    }
    function onKeyUp(e) {
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      const canvas = canvasRef.current;
      if (canvas && !canvas._isPanning) canvas.style.cursor = "";
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Core pan function — also exposed as canvas._startPan ────
    function startPan(e) {
      const startCamX = cameraRef.current.x;
      const startCamY = cameraRef.current.y;
      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      canvas._isPanning = true;
      canvas.style.cursor = "grabbing";

      function onMove(ev) {
        const dx = ev.clientX - startMouseX;
        const dy = ev.clientY - startMouseY;
        setCameraRef.current((prev) => ({
          ...prev,
          x: startCamX + dx,
          y: startCamY + dy,
        }));
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        canvas._isPanning = false;
        canvas.style.cursor = spaceHeldRef.current ? "grab" : "";
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // Expose so useCanvasInteraction can trigger pan on empty-drag
    canvas._startPan = startPan;

    // ── Zoom ──────────────────────────────────────────────────────
    function onWheel(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const zoomFactor = 1 - e.deltaY * 0.001;
      setCameraRef.current((prev) => {
        const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.2), 5);
        const ratio = newZoom / prev.zoom;
        return {
          zoom: newZoom,
          x: mouseX - ratio * (mouseX - prev.x),
          y: mouseY - ratio * (mouseY - prev.y),
        };
      });
    }

    // ── mousedown: ONLY middle mouse and Space+left ───────────────
    // Empty-left-drag is routed through useCanvasInteraction → canvas._startPan()
    function onMouseDown(e) {
      const isMiddle = e.button === 1;
      const isSpaceLeft = e.button === 0 && spaceHeldRef.current;
      if (!isMiddle && !isSpaceLeft) return;
      e.preventDefault();
      startPan(e);
    }

    function onAuxClick(e) {
      if (e.button === 1) e.preventDefault();
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("auxclick", onAuxClick);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("auxclick", onAuxClick);
      delete canvas._startPan;
      delete canvas._spaceHeld;
    };
  }, []);
}