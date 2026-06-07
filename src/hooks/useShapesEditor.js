// src/hooks/useShapesEditor.js
import { useState, useRef } from "react";
import { svgCache } from "../utils/svgCache.js";

export function useShapesEditor() {
  const [shapes, setShapes] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [isReordering, setIsReordering] = useState(false);

  // Keep a ref of selectedIndices so imperative handlers can read it
  // synchronously without stale closures
  const selectedRef = useRef([]);
  const _setSelected = (v) => {
    const next = typeof v === "function" ? v(selectedRef.current) : v;
    selectedRef.current = next;
    setSelectedIndices(next);
  };

  const clearSelection = () => _setSelected([]);

  function commitShapes(nextShapes) {
    setShapes((prev) => {
      setHistory((h) => [...h.slice(-50), prev]);
      setFuture([]);
      return nextShapes;
    });
  }

  function updateShape(index, patch, opts = {}) {
    const { commit = true } = opts;
    setShapes(prev => {
      const curr = prev[index];
      if (!curr) return prev;
      let changed = false;
      for (const k in patch) { if (curr[k] !== patch[k]) { changed = true; break; } }
      if (!changed) return prev;
      const next = prev.map((s, i) => i === index ? { ...s, ...patch } : s);
      if (commit) { setHistory(h => [...h.slice(-50), prev]); setFuture([]); }
      return next;
    });
  }

  // Apply same patch to all selected shapes simultaneously.
  // Used for: color, scale, angle, flipX, flipY from multi-select panel.
  function updateSelectedShapes(patch, opts = {}) {
    const { commit = true } = opts;
    const sel = new Set(selectedRef.current);
    if (sel.size === 0) return;
    setShapes(prev => {
      const next = prev.map((s, i) =>
        sel.has(i) && !s.locked ? { ...s, ...patch } : s
      );
      if (commit) { setHistory(h => [...h.slice(-50), prev]); setFuture([]); }
      return next;
    });
  }

  // Nudge all selected shapes by (dx, dy) — used for arrow keys multi-select
  function nudgeSelected(dx, dy, opts = {}) {
    const { commit = true } = opts;
    const sel = new Set(selectedRef.current);
    if (sel.size === 0) return;
    setShapes(prev => {
      const next = prev.map((s, i) =>
        sel.has(i) && !s.locked ? { ...s, x: s.x + dx, y: s.y + dy } : s
      );
      if (commit) { setHistory(h => [...h.slice(-50), prev]); setFuture([]); }
      return next;
    });
  }

  // Move all selected shapes by (dx, dy) from their ORIGINAL positions at drag start.
  // Call startPositions = snapshot of {index → {x,y}} at mousedown,
  // then call this each mousemove with the total delta from drag start.
  function moveSelectedShapes(startPositions, dx, dy, opts = {}) {
    const { commit = true } = opts;
    setShapes(prev => {
      const next = prev.map((s, i) => {
        const start = startPositions[i];
        if (!start || s.locked) return s;
        return { ...s, x: start.x + dx, y: start.y + dy };
      });
      if (commit) { setHistory(h => [...h.slice(-50), prev]); setFuture([]); }
      return next;
    });
  }

  function deleteShape(index) {
    setShapes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setHistory((h) => [...h.slice(-50), prev]);
      setFuture([]);
      return next;
    });
    _setSelected([]);
  }

  function deleteSelected() {
    const sel = new Set(selectedRef.current);
    if (sel.size === 0) return;
    setShapes(prev => {
      const next = prev.filter((_, i) => !sel.has(i));
      setHistory(h => [...h.slice(-50), prev]);
      setFuture([]);
      return next;
    });
    _setSelected([]);
  }

  function addShape(id, opts = {}) {
    const newShape = {
      id, x: 0, y: 0, angle: 0, scale: 1,
      flipX: false, flipY: false, locked: false, hidden: false, color: "#000000",
      ...opts,
    };
    const newShapes = [...shapes, newShape];
    commitShapes(newShapes);
    _setSelected([newShapes.length - 1]);

  }

  // Shift+click: toggle an index in/out of the selection
  function toggleSelection(index) {
    const s = shapes[index];
    if (!s || s.hidden) return;
    _setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }

  function isSelected(index) {
    const s = shapes[index];
    if (!s || s.hidden) return false;
    return selectedIndices.includes(index);
  }

  // Box-select: select all non-hidden, non-locked shapes whose AABB overlaps the rect.
  // Uses rotated-corner projection so partially-overlapping shapes are included
  // as soon as any edge of the rubber-band touches them.
  function boxSelect(x1, y1, x2, y2) {
    const rMinX = Math.min(x1, x2), rMaxX = Math.max(x1, x2);
    const rMinY = Math.min(y1, y2), rMaxY = Math.max(y1, y2);
    const hits = [];
    for (let i = 0; i < shapes.length; i++) {
      const s = shapes[i];
      if (s.hidden || s.locked) continue;
      const meta = svgCache.get(s.id);
      if (!meta) continue;
      const hw = (meta.w / 2) * s.scale;
      const hh = (meta.h / 2) * s.scale;
      const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
      let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
      for (const [lx, ly] of [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]) {
        const wx = s.x + lx * cos - ly * sin;
        const wy = s.y + lx * sin + ly * cos;
        if (wx < sMinX) sMinX = wx; if (wx > sMaxX) sMaxX = wx;
        if (wy < sMinY) sMinY = wy; if (wy > sMaxY) sMaxY = wy;
      }
      if (sMaxX >= rMinX && sMinX <= rMaxX && sMaxY >= rMinY && sMinY <= rMaxY) {
        hits.push(i);
      }
    }
    _setSelected(hits);
  }

  function undo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [shapes, ...f]);
    setShapes(prev);
    _setSelected((sel) => sel.filter((i) => i < prev.length));
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, shapes]);
    setShapes(next);
    _setSelected((sel) => sel.filter((i) => i < next.length));
  }

  function moveShapeUp(index) {
    if (index >= shapes.length - 1) return;
    setIsReordering(true);
    const newShapes = [...shapes];
    [newShapes[index], newShapes[index + 1]] = [newShapes[index + 1], newShapes[index]];
    commitShapes(newShapes);
    _setSelected([index + 1]);
    setTimeout(() => setIsReordering(false), 150);
  }

  function moveShapeDown(index) {
    if (index <= 0) return;
    setIsReordering(true);
    const newShapes = [...shapes];
    [newShapes[index], newShapes[index - 1]] = [newShapes[index - 1], newShapes[index]];
    commitShapes(newShapes);
    _setSelected([index - 1]);
    setTimeout(() => setIsReordering(false), 150);
  }

  function getShapeMarkup(id, color = "#000", size = 24) {
    const meta = svgCache.get(id);
    if (!meta) return "";
    const { html, w, h } = meta;
    const scale = (size * 0.85) / Math.max(w, h);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-size/2} ${-size/2} ${size} ${size}">
      <g transform="scale(${scale})" fill="currentColor" stroke="currentColor" style="color: ${color};">${html}</g>
    </svg>`;
  }

  return {
    shapes, selectedIndices, isReordering,
    setSelectedIndices: _setSelected, clearSelection, isSelected,
    toggleSelection, boxSelect,
    addShape,
    updateShape, updateSelectedShapes, nudgeSelected, moveSelectedShapes,
    deleteShape, deleteSelected,
    moveShapeUp, moveShapeDown,
    undo, redo,
    commitShapes, setShapes,
    getShapeMarkup,
  };
}