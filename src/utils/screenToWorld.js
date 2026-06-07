// src/utils/screenToWorld.js
//
// Converts screen mouse coords to world (canvas) coordinates.
//
// The renderer centers the world at the CSS center of the canvas element:
//   ctx.translate(W/(2*dpr) + cam.x,  H/(2*dpr) + cam.y)
//
// So we must invert from the canvas element's center, NOT window center.
// Always pass canvasEl. The fallback is only for backwards compat.

export function screenToWorld(clientX, clientY, cam, canvasEl) {
  let cx, cy;

  if (canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  } else {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
  }

  return {
    x: (clientX - cam.x - cx) / cam.zoom,
    y: (clientY - cam.y - cy) / cam.zoom,
  };
}