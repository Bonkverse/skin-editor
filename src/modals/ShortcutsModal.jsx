// src/modals/ShortcutsModal.jsx
export default function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>🎹 Keyboard Shortcuts</h2>
        <ul>
          <li><b>Arrow Keys</b> — Move (Shift = 10px)</li>
          <li><b>R / Shift+R</b> — Rotate ±5°</li>
          <li><b>+</b> / <b>-</b> — Scale up/down</li>
          <li><b>X / Y</b> — Flip horizontally/vertically</li>
          <li><b>Ctrl+D</b> — Duplicate selected</li>
          <li><b>Ctrl+C / Ctrl+V</b> — Copy / Paste</li>
          <li><b>Shift / Ctrl+Click</b> — Multi-select</li>
        </ul>

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
