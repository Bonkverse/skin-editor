// src/hooks/useCamera.js
//
// Exposes cameraRef alongside camera state so imperative handlers
// (pan, zoom) can read the current value synchronously without using
// setCamera as a getter (which is unreliable and causes pan bugs).

import { useState, useRef, useEffect } from "react";

export function useCamera() {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  // Always mirrors the latest camera state synchronously.
  // Use this in event handlers that need the current value immediately.
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  });

  function resetCamera() {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }

  return { camera, cameraRef, setCamera, resetCamera };
}