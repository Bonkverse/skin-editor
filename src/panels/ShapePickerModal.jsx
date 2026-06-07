// src/panels/ShapePickerModal.jsx
// Modal shape picker. Open with Shift+Space or the + FAB button.
// Searchable by shape number. Click to add to canvas, Escape to close.

import { useState, useEffect, useRef } from "react";
import { TOTAL_BONK_SHAPES } from "../bonk/constants";
import ShapeThumbnail from "../components/ShapeThumbnail";

export default function ShapePickerModal({ open, onClose, onAddShape }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter by shape number
  const ids = Array.from({ length: TOTAL_BONK_SHAPES }, (_, i) => i + 1).filter(
    (id) => !query || String(id).includes(query.trim())
  );

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="shape-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-header">
          <span className="sp-title">Add Shape</span>
          <button className="sp-close" onClick={onClose}>✕</button>
        </div>

        <input
          ref={inputRef}
          className="sp-search neon-input"
          placeholder="Search by number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="sp-grid">
          {ids.map((id) => (
            <div
              key={id}
              className="sp-item"
              onClick={() => { onAddShape(id); onClose(); }}
              title={`Shape ${id}`}
            >
              <ShapeThumbnail id={id} size={44} />
              <span className="sp-num">{id}</span>
            </div>
          ))}
          {ids.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", gridColumn: "1/-1", textAlign: "center", padding: 24 }}>
              No shapes matching "{query}"
            </p>
          )}
        </div>

        <div className="sp-hint">
          Click a shape to add it · <kbd>Esc</kbd> to close · <kbd>Shift+Space</kbd> to reopen
        </div>
      </div>
    </div>
  );
}
