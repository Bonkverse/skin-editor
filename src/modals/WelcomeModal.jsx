// src/modals/WelcomeModal.jsx
export default function WelcomeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>🎨 Welcome to the Bonkverse Skin Editor!</h2>

        <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#ccc" }}>
          Here's what you can do:
        </p>

        <ul style={{ fontSize: "14px", lineHeight: "1.8", color: "#ccc" }}>
          <li>🧩 <b>Add Shapes:</b> Click any shape in the panel to add it to the canvas.</li>
          <li>🖱️ <b>Move:</b> Drag a shape to reposition it. Drag empty canvas to pan.</li>
          <li>🔄 <b>Scale + Rotate:</b> Drag the teal handle at the top-right corner of a selected shape.</li>
          <li>🎨 <b>Colors:</b> Select a shape and use the color picker on the right. Change the base ball color at the top.</li>
          <li>📐 <b>Angle input:</b> Angles are in degrees — type <b>90</b> to rotate 90° sideways.</li>
          <li>↕️ <b>Layers:</b> Use Move Up / Move Down or drag in the Layers panel to reorder shapes.</li>
          <li>🔍 <b>Zoom:</b> Scroll wheel to zoom in/out, centered on your cursor.</li>
          <li>🧭 <b>Pan:</b> Drag empty canvas space, hold <b>Space</b> and drag, or use middle mouse button.</li>
          <li>⌨️ <b>Shortcuts:</b> Arrow keys to nudge, <b>R</b> to rotate, <b>[ ]</b> to scale, <b>X/Y</b> to flip, <b>Ctrl+D</b> to duplicate, <b>Del</b> to delete. Press <b>Shortcuts</b> in the toolbar for the full list.</li>
          <li>💾 <b>Export / Import:</b> Save your skin as JSON or load one back in. Export as PNG image.</li>
          <li>🚀 <b>Publish:</b> Publish your skin to Bonkverse and share it with others.</li>
          <li>👕 <b>Wear Skin:</b> Apply your design to your Bonk.io account directly.</li>
          <li>📷 <b>Image Overlay:</b> Drag and drop an image onto the canvas to trace over it.</li>
        </ul>

        <button className="close-btn" onClick={onClose}>
          Let's go!
        </button>
      </div>
    </div>
  );
}
