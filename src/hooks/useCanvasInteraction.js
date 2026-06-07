// src/hooks/useCanvasInteraction.js
// Empty-space left drag:
//   - If Space is held (canvas._spaceHeld.current === true) → call canvas._startPan(e)
//   - Otherwise → rubber-band box select
// This is the single decision point. The camera hook no longer tries to
// detect empty-canvas clicks at all — it only handles middle mouse and Space+left.

import { useEffect, useRef } from "react";
import { screenToWorld } from "../utils/screenToWorld";
import { hitTestShapes } from "../canvas/hitTest";
import {
  isOnHandle, isOnBox,
  getMultiSelectBounds, isOnMultiHandle, isInMultiBox,
} from "../canvas/drawSelectionOverlay";
import { svgCache } from "../utils/svgCache";
import { BALL_RADIUS_PX } from "../bonk/constants";

export function useCanvasInteraction(canvasRef, shapes, camera, overlay) {
  const shapesRef = useRef(shapes.shapes);
  const selectedRef = useRef(shapes.selectedIndices);
  const cameraRef = camera.cameraRef;
  const overlayRef = useRef(overlay.overlay);
  const overlayModeRef = useRef(overlay.overlayMode);
  const setOverlayRef = useRef(overlay.setOverlay);
  const toggleOverlayModeRef = useRef(overlay.toggleOverlayMode);
  const setShowOverlayPanelRef = useRef(overlay.setShowOverlayPanel);

  useEffect(() => { shapesRef.current = shapes.shapes; });
  useEffect(() => { selectedRef.current = shapes.selectedIndices; });
  useEffect(() => { overlayRef.current = overlay.overlay; });
  useEffect(() => { overlayModeRef.current = overlay.overlayMode; });
  useEffect(() => { setOverlayRef.current = overlay.setOverlay; });
  useEffect(() => { toggleOverlayModeRef.current = overlay.toggleOverlayMode; });
  useEffect(() => { setShowOverlayPanelRef.current = overlay.setShowOverlayPanel; });

  const updateShapeRef = useRef(shapes.updateShape);
  const updateSelectedRef = useRef(shapes.updateSelectedShapes);
  const moveSelectedRef = useRef(shapes.moveSelectedShapes);
  const nudgeSelectedRef = useRef(shapes.nudgeSelected);
  const setSelectedRef = useRef(shapes.setSelectedIndices);
  const toggleSelRef = useRef(shapes.toggleSelection);
  const boxSelectRef = useRef(shapes.boxSelect);
  const clearSelectionRef = useRef(shapes.clearSelection);
  const commitShapesRef = useRef(shapes.commitShapes);
  const deleteSelectedRef = useRef(shapes.deleteSelected);
  const undoRef = useRef(shapes.undo);
  const redoRef = useRef(shapes.redo);

  useEffect(() => { updateShapeRef.current = shapes.updateShape; });
  useEffect(() => { updateSelectedRef.current = shapes.updateSelectedShapes; });
  useEffect(() => { moveSelectedRef.current = shapes.moveSelectedShapes; });
  useEffect(() => { nudgeSelectedRef.current = shapes.nudgeSelected; });
  useEffect(() => { setSelectedRef.current = shapes.setSelectedIndices; });
  useEffect(() => { toggleSelRef.current = shapes.toggleSelection; });
  useEffect(() => { boxSelectRef.current = shapes.boxSelect; });
  useEffect(() => { clearSelectionRef.current = shapes.clearSelection; });
  useEffect(() => { commitShapesRef.current = shapes.commitShapes; });
  useEffect(() => { deleteSelectedRef.current = shapes.deleteSelected; });
  useEffect(() => { undoRef.current = shapes.undo; });
  useEffect(() => { redoRef.current = shapes.redo; });

  const clipboardRef = useRef(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    function isTyping() {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    }

    function onKeyDown(e) {
      if (isTyping()) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if ((e.key === "o" || e.key === "O") && overlayRef.current.src) {
        toggleOverlayModeRef.current(); return;
      }

      const allShapes = shapesRef.current;
      const selected = selectedRef.current;
      const idx = selected[0] ?? null;
      const shape = idx !== null ? allShapes[idx] : null;
      const hasMulti = selected.length > 1;

      if (ctrl && e.key === "z") { e.preventDefault(); undoRef.current(); return; }
      if (ctrl && (e.key === "y" || (shift && e.key === "z"))) { e.preventDefault(); redoRef.current(); return; }

      if (ctrl && e.key === "v") {
        e.preventDefault();
        if (clipboardRef.current) {
          const src = clipboardRef.current;
          const next = [...allShapes, { ...src, x: src.x + 15, y: src.y + 15 }];
          commitShapesRef.current(next);
          setSelectedRef.current([next.length - 1]);
        }
        return;
      }

      if (e.key === "Escape") {
        if (overlayModeRef.current) toggleOverlayModeRef.current();
        else clearSelectionRef.current();
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        if (hasMulti) { deleteSelectedRef.current(); return; }
        if (idx !== null && !shape?.locked) {
          commitShapesRef.current(allShapes.filter((_, i) => i !== idx));
          clearSelectionRef.current();
        }
        return;
      }

      const step = shift ? 10 : 1;
      if (e.key === "ArrowLeft")  { e.preventDefault(); hasMulti ? nudgeSelectedRef.current(-step, 0) : (shape && updateShapeRef.current(idx, { x: shape.x - step })); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); hasMulti ? nudgeSelectedRef.current(step, 0)  : (shape && updateShapeRef.current(idx, { x: shape.x + step })); return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); hasMulti ? nudgeSelectedRef.current(0, -step) : (shape && updateShapeRef.current(idx, { y: shape.y - step })); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); hasMulti ? nudgeSelectedRef.current(0, step)  : (shape && updateShapeRef.current(idx, { y: shape.y + step })); return; }

      if (idx === null || !shape || shape.locked) return;

      if (ctrl && e.key === "c") { e.preventDefault(); clipboardRef.current = { ...shape }; return; }
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const next = [...allShapes, { ...shape, x: shape.x + 15, y: shape.y + 15 }];
        commitShapesRef.current(next);
        setSelectedRef.current([next.length - 1]);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const d = (5 * Math.PI) / 180;
        if (hasMulti) { updateSelectedRef.current({ angle: shape.angle + (shift ? -d : d) }); return; }
        updateShapeRef.current(idx, { angle: shape.angle + (shift ? -d : d) });
        return;
      }
      if (e.key === "[") { e.preventDefault(); hasMulti ? updateSelectedRef.current({ scale: Math.max(0.05, shape.scale * 0.95) }) : updateShapeRef.current(idx, { scale: Math.max(0.05, shape.scale * 0.95) }); return; }
      if (e.key === "]") { e.preventDefault(); hasMulti ? updateSelectedRef.current({ scale: shape.scale * 1.05 }) : updateShapeRef.current(idx, { scale: shape.scale * 1.05 }); return; }
      if (e.key === "x" || e.key === "X") { e.preventDefault(); hasMulti ? updateSelectedRef.current({ flipX: !shape.flipX }) : updateShapeRef.current(idx, { flipX: !shape.flipX }); return; }
      if (e.key === "y" || e.key === "Y") { e.preventDefault(); hasMulti ? updateSelectedRef.current({ flipY: !shape.flipY }) : updateShapeRef.current(idx, { flipY: !shape.flipY }); return; }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Mouse interaction ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toWorld = (cx, cy) => screenToWorld(cx, cy, cameraRef.current, canvas);

    function getOverlayHit(wx, wy) {
      const ov = overlayRef.current;
      if (!ov.src || !ov.visible || !ov._img) return null;
      const imgW = ov._img.naturalWidth || ov._img.width || 512;
      const imgH = ov._img.naturalHeight || ov._img.height || 512;
      const fitScale = (BALL_RADIUS_PX * 2) / Math.max(imgW, imgH);
      const drawW = imgW * fitScale * ov.scale;
      const drawH = imgH * fitScale * ov.scale;
      const hw = drawW / 2, hh = drawH / 2;
      const dx = wx - ov.x, dy = wy - ov.y;
      const cos = Math.cos(-ov.angle), sin = Math.sin(-ov.angle);
      const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
      const hr = 7 / cameraRef.current.zoom;
      if (Math.hypot(lx - hw, ly - (-hh)) <= hr) return "handle";
      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return "body";
      return null;
    }

    function onMouseDown(e) {
      if (e.button !== 0) return;

      const cam = cameraRef.current;
      const allShapes = shapesRef.current;
      const selected = selectedRef.current;
      const world = toWorld(e.clientX, e.clientY);

      // Overlay mode
      if (overlayModeRef.current) {
        const ovHit = getOverlayHit(world.x, world.y);
        if (ovHit === "handle") { startOverlayHandleDrag(world); return; }
        if (ovHit === "body")   { startOverlayBodyDrag(world); return; }
        toggleOverlayModeRef.current(); return;
      }

      // ── Shift+click: always toggle, never drag ────────────────
      // Must come BEFORE box/handle checks so Shift+clicking an already-
      // selected shape deselects it instead of starting a drag.
      if (e.shiftKey) {
        const hit = hitTestShapes(world.x, world.y, allShapes);
        if (hit !== null && !allShapes[hit].locked) {
          toggleSelRef.current(hit);
          return;
        }
        // Shift+click on empty — rubber-band without clearing selection
        startRubberBand(world, true);
        return;
      }

      // Multi-select group handle / box (no shift)
      if (selected.length > 1) {
        const bounds = getMultiSelectBounds(allShapes, selected, svgCache, cam.zoom);
        if (bounds && isOnMultiHandle(world.x, world.y, bounds, cam.zoom)) {
          startMultiHandleDrag(world, selected, bounds); return;
        }
        if (bounds && isInMultiBox(world.x, world.y, bounds)) {
          startMultiShapeDrag(world, selected, allShapes); return;
        }
      }

      // Single-select handle (no shift)
      if (selected.length === 1) {
        const selShape = allShapes[selected[0]];
        if (selShape && !selShape.locked) {
          if (isOnHandle(world.x, world.y, selShape, svgCache, cam.zoom)) {
            startHandleDrag(e, selected[0], selShape, world); return;
          }
          if (isOnBox(world.x, world.y, selShape, svgCache)) {
            startShapeDrag(selected[0], selShape, world); return;
          }
        }
      }

      // Plain hit test (no shift)
      const hit = hitTestShapes(world.x, world.y, allShapes);
      if (hit !== null && !allShapes[hit].locked) {
        setSelectedRef.current([hit]);
        startShapeDrag(hit, allShapes[hit], world);
        return;
      }

      // ── Empty space (no shift, no shape hit) ─────────────────
      clearSelectionRef.current();

      // If space is held, camera hook handles this as a pan — skip rubber-band
      const spaceHeld = canvas._spaceHeld?.current ?? false;
      if (spaceHeld) return;

      startRubberBand(world, false);
    }

    // ── Rubber-band ────────────────────────────────────────────
    // On every mousemove, also computes which shapes are currently
    // inside the rect and stores them in canvas._rubberBandHits (a Set).
    // The renderer reads this to draw live teal highlights over those shapes.
    function startRubberBand(worldStart, additive) {
      canvas._rubberBand = { x1: worldStart.x, y1: worldStart.y, x2: worldStart.x, y2: worldStart.y };
      canvas._rubberBandHits = new Set();

      // Inclusion test: rubber-band rect overlaps shape's axis-aligned bounding box.
      // We compute the shape's world-space AABB by projecting all 4 rotated corners
      // and taking min/max — same approach as drawMultiSelectionOverlay.
      // A shape is included as soon as ANY part of it overlaps the rect.
      function computeHits(rb) {
        const rMinX = Math.min(rb.x1, rb.x2), rMaxX = Math.max(rb.x1, rb.x2);
        const rMinY = Math.min(rb.y1, rb.y2), rMaxY = Math.max(rb.y1, rb.y2);
        const allShapes = shapesRef.current;
        const hits = new Set();
        for (let i = 0; i < allShapes.length; i++) {
          const s = allShapes[i];
          if (s.hidden || s.locked) continue;
          const meta = svgCache.get(s.id);
          if (!meta) continue;
          const hw = (meta.w / 2) * s.scale;
          const hh = (meta.h / 2) * s.scale;
          const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
          // Project 4 corners into world space and find AABB
          let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
          for (const [lx, ly] of [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]) {
            const wx = s.x + lx * cos - ly * sin;
            const wy = s.y + lx * sin + ly * cos;
            if (wx < sMinX) sMinX = wx; if (wx > sMaxX) sMaxX = wx;
            if (wy < sMinY) sMinY = wy; if (wy > sMaxY) sMaxY = wy;
          }
          // AABB intersection: overlaps if not separated on either axis
          if (sMaxX >= rMinX && sMinX <= rMaxX && sMaxY >= rMinY && sMinY <= rMaxY) {
            hits.add(i);
          }
        }
        return hits;
      }

      function onMove(ev) {
        const w = toWorld(ev.clientX, ev.clientY);
        const rb = { x1: worldStart.x, y1: worldStart.y, x2: w.x, y2: w.y };
        canvas._rubberBand = rb;
        canvas._rubberBandHits = computeHits(rb);
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const rb = canvas._rubberBand;
        canvas._rubberBand = null;
        canvas._rubberBandHits = new Set();
        if (rb && (Math.abs(rb.x2 - rb.x1) > 4 || Math.abs(rb.y2 - rb.y1) > 4)) {
          boxSelectRef.current(rb.x1, rb.y1, rb.x2, rb.y2);
        }
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // ── Multi-shape drag ───────────────────────────────────────
    function startMultiShapeDrag(worldStart, selectedIndices, allShapes) {
      const startPositions = {};
      for (const idx of selectedIndices) {
        startPositions[idx] = { x: allShapes[idx].x, y: allShapes[idx].y };
      }
      function onMove(ev) {
        const w = toWorld(ev.clientX, ev.clientY);
        moveSelectedRef.current(startPositions, w.x - worldStart.x, w.y - worldStart.y, { commit: false });
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const finalShapes = shapesRef.current;
        moveSelectedRef.current(
          Object.fromEntries(Object.keys(startPositions).map(i => [i, { x: finalShapes[i].x, y: finalShapes[i].y }])),
          0, 0, { commit: true }
        );
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // ── Multi handle drag ──────────────────────────────────────
    function startMultiHandleDrag(worldStart, selectedIndices, bounds) {
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      const startVec = { x: bounds.maxX - cx, y: bounds.minY - cy };
      const startDist = Math.hypot(startVec.x, startVec.y);
      const allShapes = shapesRef.current;
      const startStates = {};
      for (const idx of selectedIndices) {
        startStates[idx] = { scale: allShapes[idx].scale, angle: allShapes[idx].angle, x: allShapes[idx].x, y: allShapes[idx].y };
      }
      function onMove(ev) {
        const cur = toWorld(ev.clientX, ev.clientY);
        const curVec = { x: cur.x - cx, y: cur.y - cy };
        const scaleFactor = Math.hypot(curVec.x, curVec.y) / startDist;
        const angleDelta = Math.atan2(curVec.y, curVec.x) - Math.atan2(startVec.y, startVec.x);
        const patches = {};
        for (const idx of selectedIndices) {
          const st = startStates[idx];
          const dx = st.x - cx, dy = st.y - cy;
          const cos = Math.cos(angleDelta), sin = Math.sin(angleDelta);
          patches[idx] = {
            scale: Math.max(0.05, st.scale * scaleFactor),
            angle: st.angle + angleDelta,
            x: cx + (dx * cos - dy * sin) * scaleFactor,
            y: cy + (dx * sin + dy * cos) * scaleFactor,
          };
        }
        const next = shapesRef.current.map((s, i) => patches[i] && !s.locked ? { ...s, ...patches[i] } : s);
        shapesRef.current = next;
        shapes.setShapes(next);
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        updateSelectedRef.current({}, { commit: true });
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // ── Single shape drag ──────────────────────────────────────
    function startShapeDrag(index, shape, worldStart) {
      const startX = shape.x, startY = shape.y;
      let currentX = startX, currentY = startY;
      function onMove(ev) {
        const w = toWorld(ev.clientX, ev.clientY);
        currentX = startX + (w.x - worldStart.x);
        currentY = startY + (w.y - worldStart.y);
        updateShapeRef.current(index, { x: currentX, y: currentY }, { commit: false });
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        updateShapeRef.current(index, { x: currentX, y: currentY }, { commit: true });
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // ── Single handle drag ─────────────────────────────────────
    function startHandleDrag(e, index, shape, worldStart) {
      e.stopPropagation();
      const center = { x: shape.x, y: shape.y };
      const meta = svgCache.get(shape.id);
      const hw = (meta.w / 2) * shape.scale, hh = (meta.h / 2) * shape.scale;
      const cos0 = Math.cos(shape.angle), sin0 = Math.sin(shape.angle);
      const handleWorld = {
        x: shape.x + hw * cos0 - (-hh) * sin0,
        y: shape.y + hw * sin0 + (-hh) * cos0,
      };
      const startVec = { x: handleWorld.x - center.x, y: handleWorld.y - center.y };
      const startDist = Math.hypot(startVec.x, startVec.y);
      const startAngle = shape.angle, startScale = shape.scale;
      function onMove(ev) {
        const cur = toWorld(ev.clientX, ev.clientY);
        const curVec = { x: cur.x - center.x, y: cur.y - center.y };
        const dist = Math.hypot(curVec.x, curVec.y);
        const ad = Math.atan2(curVec.y, curVec.x) - Math.atan2(startVec.y, startVec.x);
        updateShapeRef.current(index, {
          scale: Math.max(0.05, startScale * (dist / startDist)),
          angle: startAngle + ad,
        }, { commit: false });
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        updateShapeRef.current(index, {}, { commit: true });
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    // ── Overlay drags ──────────────────────────────────────────
    function startOverlayBodyDrag(worldStart) {
      const ov = overlayRef.current;
      const startX = ov.x, startY = ov.y;
      function onMove(ev) {
        const w = toWorld(ev.clientX, ev.clientY);
        setOverlayRef.current((o) => ({ ...o, x: startX + (w.x - worldStart.x), y: startY + (w.y - worldStart.y) }));
      }
      function onUp() { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
      window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    }

    function startOverlayHandleDrag(worldStart) {
      const ov = overlayRef.current;
      const imgW = ov._img.naturalWidth || ov._img.width || 512;
      const imgH = ov._img.naturalHeight || ov._img.height || 512;
      const fitScale = (BALL_RADIUS_PX * 2) / Math.max(imgW, imgH);
      const drawW = imgW * fitScale * ov.scale, drawH = imgH * fitScale * ov.scale;
      const hw = drawW / 2, hh = drawH / 2;
      const cos0 = Math.cos(ov.angle), sin0 = Math.sin(ov.angle);
      const handleWorld = { x: ov.x + hw * cos0 - (-hh) * sin0, y: ov.y + hw * sin0 + (-hh) * cos0 };
      const startVec = { x: handleWorld.x - ov.x, y: handleWorld.y - ov.y };
      const startDist = Math.hypot(startVec.x, startVec.y);
      const startAngle = ov.angle, startScale = ov.scale;
      function onMove(ev) {
        const cur = toWorld(ev.clientX, ev.clientY);
        const curVec = { x: cur.x - ov.x, y: cur.y - ov.y };
        const dist = Math.hypot(curVec.x, curVec.y);
        const ad = Math.atan2(curVec.y, curVec.x) - Math.atan2(startVec.y, startVec.x);
        setOverlayRef.current((o) => ({ ...o, scale: Math.max(0.05, startScale * (dist / startDist)), angle: startAngle + ad }));
      }
      function onUp() { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
      window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    return () => canvas.removeEventListener("mousedown", onMouseDown);
  }, []);
}