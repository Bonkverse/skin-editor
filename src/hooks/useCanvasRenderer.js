// src/hooks/useCanvasRenderer.js
import { useEffect, useRef } from "react";
import { drawShape } from "../canvas/drawShape";
import { drawSelectionOverlay, drawMultiSelectionOverlay, drawRubberBand } from "../canvas/drawSelectionOverlay";
import { svgCache } from "../utils/svgCache";
import { BALL_RADIUS_PX } from "../bonk/constants";

const OV_HANDLE_RADIUS = 7;
const OV_BOX_COLOR = "rgba(255,255,255,0.6)";
const OV_HANDLE_FILL = "#ffffff";
const OV_HANDLE_STROKE = "#333";

// Teal tint drawn over shapes that are inside the live rubber-band rect
const HOVER_SELECT_COLOR = "rgba(0,255,204,0.18)";

export function useCanvasRenderer(canvasRef, shapes, camera, baseColor, overlay) {
  const shapesRef = useRef(shapes.shapes);
  const selectedRef = useRef(shapes.selectedIndices);
  const cameraRef = useRef(camera.camera);
  const baseColorRef = useRef(baseColor);
  const overlayRef = useRef(overlay.overlay);

  useEffect(() => { shapesRef.current = shapes.shapes; });
  useEffect(() => { selectedRef.current = shapes.selectedIndices; });
  useEffect(() => { cameraRef.current = camera.camera; });
  useEffect(() => { baseColorRef.current = baseColor; });
  useEffect(() => { overlayRef.current = overlay.overlay; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId, running = true;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    function drawFrame() {
      if (!running) return;
      rafId = requestAnimationFrame(drawFrame);

      const cam = cameraRef.current;
      const allShapes = shapesRef.current;
      const selected = new Set(selectedRef.current);
      const selectedArr = selectedRef.current;
      const bc = baseColorRef.current;
      const ov = overlayRef.current;
      const dpr = window.devicePixelRatio;
      const W = canvas.width, H = canvas.height;

      // canvas._rubberBandHits is a Set<index> set by useCanvasInteraction
      // containing shapes currently inside the live drag rect
      const rubberBandHits = canvas._rubberBandHits ?? new Set();

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(W / (2 * dpr) + cam.x, H / (2 * dpr) + cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // ── Ball ──────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS_PX + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 4 / cam.zoom; ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS_PX, 0, Math.PI * 2);
      ctx.fillStyle = bc; ctx.fill();
      ctx.strokeStyle = "#333"; ctx.lineWidth = 3 / cam.zoom; ctx.stroke();

      // ── Overlay image ─────────────────────────────────────────
      // Clipped to the ball circle when not in overlay mode.
      // Unclipped when in overlay mode so the user can drag freely.
      if (ov.src && ov.visible && ov._img) {
        const imgW = ov._img.naturalWidth || ov._img.width || 512;
        const imgH = ov._img.naturalHeight || ov._img.height || 512;
        const fitScale = (BALL_RADIUS_PX * 2) / Math.max(imgW, imgH);
        const drawW = imgW * fitScale * ov.scale;
        const drawH = imgH * fitScale * ov.scale;
        const overlayMode = canvas._overlayMode ?? false;

        ctx.save();

        // Clip to ball circle when not actively editing the overlay
        if (!overlayMode) {
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS_PX, 0, Math.PI * 2);
          ctx.clip();
        }

        ctx.translate(ov.x, ov.y); ctx.rotate(ov.angle);
        ctx.globalAlpha = ov.opacity;
        ctx.drawImage(ov._img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.globalAlpha = 1;

        // Box + handle — only shown in overlay mode
        if (overlayMode) {
          const hw = drawW / 2, hh = drawH / 2;
          const sw = 1.5 / cam.zoom, hr = OV_HANDLE_RADIUS / cam.zoom;
          ctx.strokeStyle = OV_BOX_COLOR; ctx.lineWidth = sw;
          ctx.setLineDash([6 / cam.zoom, 4 / cam.zoom]);
          ctx.strokeRect(-hw, -hh, drawW, drawH);
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(hw, -hh, hr, 0, Math.PI * 2);
          ctx.fillStyle = OV_HANDLE_FILL; ctx.fill();
          ctx.strokeStyle = OV_HANDLE_STROKE; ctx.lineWidth = sw; ctx.stroke();
        }

        ctx.restore();
      }

      // ── Non-selected shapes — clipped ─────────────────────────
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, BALL_RADIUS_PX, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < allShapes.length; i++) {
        if (!selected.has(i)) drawShape(ctx, allShapes[i], svgCache);
      }
      ctx.restore();

      // ── Selected shapes — unclipped ───────────────────────────
      for (const i of selected) drawShape(ctx, allShapes[i], svgCache);

      // ── Rubber-band hover highlights ──────────────────────────
      // Draw a teal tint over shapes whose CENTER is inside the drag rect.
      // Uses the shape's AABB in world space for the highlight rect.
      if (rubberBandHits.size > 0) {
        ctx.save();
        for (const i of rubberBandHits) {
          const s = allShapes[i];
          if (!s) continue;
          const meta = svgCache.get(s.id);
          if (!meta) continue;
          const { w, h } = meta;
          const hw = (w / 2) * s.scale;
          const hh = (h / 2) * s.scale;
          const cos = Math.cos(s.angle), sin = Math.sin(s.angle);

          // Draw highlight as a rotated rect matching the shape's bounding box
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle);
          ctx.fillStyle = HOVER_SELECT_COLOR;
          ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
          // Teal border
          ctx.strokeStyle = "rgba(0,255,204,0.6)";
          ctx.lineWidth = 1.5 / cam.zoom;
          ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
          ctx.restore();
        }
        ctx.restore();
      }

      // ── Selection overlays ────────────────────────────────────
      if (selected.size === 1) {
        const idx = [...selected][0];
        const s = allShapes[idx];
        if (s && !s.locked) drawSelectionOverlay(ctx, s, svgCache, cam.zoom);
      } else if (selected.size > 1) {
        drawMultiSelectionOverlay(ctx, allShapes, selectedArr, svgCache, cam.zoom);
      }

      // ── Rubber-band rect ──────────────────────────────────────
      const rb = canvas._rubberBand;
      if (rb) drawRubberBand(ctx, rb.x1, rb.y1, rb.x2, rb.y2, cam.zoom);

      ctx.restore();
    }

    drawFrame();
    return () => { running = false; cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [canvasRef]);
}