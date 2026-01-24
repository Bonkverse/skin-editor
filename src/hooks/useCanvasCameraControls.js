// src/hooks/useCanvasCameraControls.js
import { useEffect } from "react";

export function useCanvasCameraControls(svgRef, camera) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // let isPanning = false;
    // let lastX = 0;
    // let lastY = 0;

    // function onMouseDown(e) {
    //   if (e.button !== 0) return;

    //   // Don't pan when interacting with shapes or overlay
    //   if (
    //     e.target.closest("[data-shape]") ||
    //     e.target.closest("[data-selection]") ||
    //     e.target.closest("image")
    //   ) {
    //     return;
    //   }

    //   isPanning = true;
    //   lastX = e.clientX;
    //   lastY = e.clientY;
    // }

    // function onMouseMove(e) {
    //   if (!isPanning) return;

    //   const dx = (e.clientX - lastX) / camera.camera.zoom;
    //   const dy = (e.clientY - lastY) / camera.camera.zoom;

    //   lastX = e.clientX;
    //   lastY = e.clientY;

    //   camera.setCamera(prev => ({
    //     x: prev.x + dx,
    //     y: prev.y + dy,
    //     zoom: prev.zoom,
    //   }));
    // }

    // function onMouseUp() {
    //   isPanning = false;
    // }

    function onWheel(e) {
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = 1 - e.deltaY * 0.001;

      camera.setCamera(prev => {
        const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.2), 5);
        const ratio = newZoom / prev.zoom;

        return {
          zoom: newZoom,
          x: mouseX - ratio * (mouseX - prev.x),
          y: mouseY - ratio * (mouseY - prev.y),
        };
      });
    }

    // svg.addEventListener("mousedown", onMouseDown);
    // window.addEventListener("mousemove", onMouseMove);
    // window.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      // svg.removeEventListener("mousedown", onMouseDown);
      // window.removeEventListener("mousemove", onMouseMove);
      // window.removeEventListener("mouseup", onMouseUp);
      svg.removeEventListener("wheel", onWheel);
    };
  }, [camera, svgRef]);
}
