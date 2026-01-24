// src/utils/screenToWorld.js
export function screenToWorld(clientX, clientY, camera) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  return {
    x: (clientX - camera.camera.x - cx) / camera.camera.zoom,
    y: (clientY - camera.camera.y - cy) / camera.camera.zoom,
  };
}
