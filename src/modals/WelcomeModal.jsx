// src/modals/WelcomeModal.jsx
export default function WelcomeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>🎨 Welcome to the Bonkverse Skin Editor!</h2>

        <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#ccc" }}>
          Here’s what you can do right now:
        </p>

        <ul style={{ fontSize: "14px", lineHeight: "1.6", color: "#ccc" }}>
          <li>🧩 <b>Add & Edit Shapes:</b> Click any shape to add it, then drag, rotate, or scale using handles.</li>
          <li>🎨 <b>Change Colors:</b> Use the color picker to recolor selected shapes or the base body.</li>
          <li>↕️ <b>Layer Controls:</b> Move shapes forward/back or reorder layers using the “Move Up/Down” buttons.</li>
          <li>🖱️ <b>Multi-select:</b> Hold <b>Shift</b> or <b>Ctrl</b> to select and move multiple shapes at once.</li>
          <li>📷 <b>Image Overlay:</b> Drag and drop an image onto the canvas to trace over it (adjust opacity or hide it anytime).</li>
          <li>💾 <b>Export / Import:</b> Save your skin as JSON or load one back in.</li>
          <li>👕 <b>Wear Skin:</b> Apply your current design to your Bonk.io account directly.</li>
          <li>⚡ <b>Keyboard Shortcuts:</b> Move, rotate, scale, flip, duplicate, or delete using keys (press <b>Shift + ?</b> to view all).</li>
          <li>🧭 <b>Camera:</b> Zoom or pan with your mouse wheel and drag empty space to move around.</li>
        </ul>

        <button
          className="close-btn"
          style={{ marginTop: "20px" }}
          onClick={onClose}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
