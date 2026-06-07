// src/hooks/useOverlay.js
import { useState } from "react";
import { BALL_RADIUS_PX } from "../bonk/constants";

export function useOverlay() {
  const [overlay, setOverlay] = useState({
    src: null,
    _img: null,
    x: 0,
    y: 0,
    scale: 1,
    angle: 0,
    opacity: 0.5,
    visible: true,
    sampledColors: [],
  });

  // Whether the user is actively editing the overlay.
  // When false, overlay is drawn but mouse events pass through to shapes.
  const [overlayMode, setOverlayMode] = useState(false);
  // Whether the overlay settings panel is open
  const [showOverlayPanel, setShowOverlayPanel] = useState(false);

  function setImage(src, imgElement) {
    const colors = sampleColors(imgElement);
    setOverlay((o) => ({
      ...o,
      src,
      _img: imgElement,
      x: 0,
      y: 0,
      scale: 1,
      angle: 0,
      visible: true,
      sampledColors: colors,
    }));
    setOverlayMode(true);
    setShowOverlayPanel(true);
  }

  function clearOverlay() {
    setOverlay((o) => ({
      ...o,
      src: null,
      _img: null,
      sampledColors: [],
      visible: false,
    }));
    setOverlayMode(false);
    setShowOverlayPanel(false);
  }

  function toggleOverlayMode() {
    setOverlayMode((v) => !v);
  }

  return {
    overlay,
    setOverlay,
    setImage,
    clearOverlay,
    overlayMode,
    setOverlayMode,
    toggleOverlayMode,
    showOverlayPanel,
    setShowOverlayPanel,
  };
}

// ── Color sampling: k-means on a 64×64 thumbnail ─────────────────────────
function sampleColors(img, count = 8) {
  try {
    const SIZE = 64;
    const oc = document.createElement("canvas");
    oc.width = SIZE;
    oc.height = SIZE;
    const ctx = oc.getContext("2d");
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (pixels.length === 0) return [];
    return kMeans(pixels, count, 3).map(([r, g, b]) =>
      "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
    );
  } catch { return []; }
}

function kMeans(pixels, k, iterations) {
  let centroids = Array.from({ length: k }, (_, i) =>
    [...pixels[Math.floor((i / k) * pixels.length)]]
  );
  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let best = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (p[0]-centroids[j][0])**2 + (p[1]-centroids[j][1])**2 + (p[2]-centroids[j][2])**2;
        if (d < bestDist) { bestDist = d; best = j; }
      }
      clusters[best].push(p);
    }
    centroids = clusters.map((cluster, j) => {
      if (cluster.length === 0) return centroids[j];
      const avg = [0, 0, 0];
      for (const p of cluster) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; }
      return avg.map((v) => v / cluster.length);
    });
  }
  return centroids;
}