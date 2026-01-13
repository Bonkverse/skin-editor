// src/hooks/useShapesEditor.js
import { useState } from "react";
import { CANVAS_SIZE } from "../bonk/constants";

export function useShapesEditor() {
  // ===== STATE =====
  const [shapes, setShapes] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [isReordering, setIsReordering] = useState(false);

  // ===== HELPERS =====
  const clearSelection = () => setSelectedIndices([]);

  function commitShapes(newShapes) {
    setHistory((h) => [...h.slice(-50), shapes]);
    setFuture([]);
    setShapes(newShapes);
  }

  // ===== ACTIONS =====
  function addShape(id, opts = {}) {
    const newShape = {
      id,
      x: CANVAS_SIZE / 2,
      y: CANVAS_SIZE / 2,
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

  function updateShape(index, patch) {
    if (!shapes[index]) return;
    commitShapes(
      shapes.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function isSelected(index) {
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
  };
}
