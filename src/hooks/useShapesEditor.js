// src/hooks/useShapesEditor.js
import { useState } from "react";
import { svgCache } from "../utils/svgCache.js";

export function useShapesEditor() {
  // ===== STATE =====
  const [shapes, setShapes] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  // const [isDragging, setIsDragging] = useState(false);

  // ===== HELPERS =====
  const clearSelection = () => setSelectedIndices([]);

  function commitShapes(nextShapes) {
    setShapes((prev) => {
      // push prev into history
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
      for (const k in patch) {
        if (curr[k] !== patch[k]) {
          changed = true;
          break;
        }
      }
      if (!changed) return prev;

      const next = prev.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      );

      if (commit) {
        setHistory(h => [...h.slice(-50), prev]);
        setFuture([]);
      }

      return next;
    });
  }

  // ===== ACTIONS =====
  function addShape(id, opts = {}) {
    const newShape = {
      id,
      x: 0,
      y: 0,
      angle: 0,
      scale: 1,
      flipX: false,
      flipY: false,
      locked: false,
      hidden: false,
      color: "#000000",
      ...opts,
    };

    const newShapes = [...shapes, newShape];
    commitShapes(newShapes);
    setSelectedIndices([newShapes.length - 1]);

    if (newShapes.length === 16) {
      alert("✨ You’ve reached Bonk’s limit of 16 shapes! ✨");
    }
  }


  function isSelected(index) {
    const s = shapes[index];
    if (!s || s.hidden) return false;
    return selectedIndices.includes(index);
  }


  function undo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [shapes, ...f]);
    setShapes(prev);
    setSelectedIndices((sel) => sel.filter((i) => i < prev.length));
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, shapes]);
    setShapes(next);
    setSelectedIndices((sel) => sel.filter((i) => i < next.length));
  }

  function moveShapeUp(index) {
    if (index >= shapes.length - 1) return;
    setIsReordering(true);
    const newShapes = [...shapes];
    [newShapes[index], newShapes[index + 1]] = [
      newShapes[index + 1],
      newShapes[index],
    ];
    commitShapes(newShapes);
    setSelectedIndices([index + 1]);
    setTimeout(() => setIsReordering(false), 150);
  }

  function moveShapeDown(index) {
    if (index <= 0) return;
    setIsReordering(true);
    const newShapes = [...shapes];
    [newShapes[index], newShapes[index - 1]] = [
      newShapes[index - 1],
      newShapes[index],
    ];
    commitShapes(newShapes);
    setSelectedIndices([index - 1]);
    setTimeout(() => setIsReordering(false), 150);
  }

  function getShapeMarkup(id, color = "#000", size = 24) {
    const meta = svgCache.get(id);
    if (!meta) return "";

    const { html, w, h } = meta;
    const scale = (size * 0.85) / Math.max(w, h);

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${size}"
        height="${size}"
        viewBox="${-size / 2} ${-size / 2} ${size} ${size}"
      >
        <g
          transform="scale(${scale})"
          fill="currentColor"
          stroke="currentColor"
          style="color: ${color};"
        >
          ${html}
        </g>
      </svg>
    `;
  }

  // ===== PUBLIC API =====
  return {
    // state
    shapes,
    selectedIndices,
    isReordering,

    // selection
    setSelectedIndices,
    clearSelection,
    isSelected,

    // shape ops
    addShape,
    updateShape,
    moveShapeUp,
    moveShapeDown,

    // history
    undo,
    redo,

    // advanced
    commitShapes,
    setShapes, // exposed intentionally (importJSON needs this)
    getShapeMarkup,
  };
}
