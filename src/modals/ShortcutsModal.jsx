// src/modals/ShortcutsModal.jsx
export default function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  const sections = [
    {
      title: "Camera",
      shortcuts: [
        { keys: ["Scroll"], label: "Zoom in / out" },
        { keys: ["Middle drag"], label: "Pan" },
        { keys: ["Space", "drag"], label: "Pan" },
        { keys: ["Drag", "empty"], label: "Pan" },
      ],
    },
    {
      title: "Panel Tabs",
      shortcuts: [
        { keys: ["1"], label: "Properties / Background tab" },
        { keys: ["2"], label: "Layers tab" },
        { keys: ["3"], label: "Overlay tab (if loaded)" },
        { keys: ["O"], label: "Activate overlay mode + tab" },
      ],
    },
    {
      title: "Selection",
      shortcuts: [
        { keys: ["Click"], label: "Select shape" },
        { keys: ["Esc"], label: "Deselect / exit overlay" },
        { keys: ["Shift", "Space"], label: "Open shape picker" },
      ],
    },
    {
      title: "Transform",
      shortcuts: [
        { keys: ["↑↓←→"], label: "Move 1 unit" },
        { keys: ["Shift", "↑↓←→"], label: "Move 10 units" },
        { keys: ["R"], label: "Rotate +5°" },
        { keys: ["Shift", "R"], label: "Rotate −5°" },
        { keys: ["["], label: "Scale down 5%" },
        { keys: ["]"], label: "Scale up 5%" },
        { keys: ["X"], label: "Flip horizontal" },
        { keys: ["Y"], label: "Flip vertical" },
        { keys: ["Drag handle"], label: "Scale + rotate freely" },
      ],
    },
    {
      title: "Edit",
      shortcuts: [
        { keys: ["Ctrl", "C"], label: "Copy shape" },
        { keys: ["Ctrl", "V"], label: "Paste shape" },
        { keys: ["Ctrl", "D"], label: "Duplicate shape" },
        { keys: ["Del"], label: "Delete shape" },
        { keys: ["Ctrl", "Z"], label: "Undo" },
        { keys: ["Ctrl", "Y"], label: "Redo" },
      ],
    },
    {
      title: "Image Overlay",
      shortcuts: [
        { keys: ["O"], label: "Enter overlay mode + open tab" },
        { keys: ["Esc"], label: "Exit overlay mode" },
        { keys: ["Drag body"], label: "Move overlay" },
        { keys: ["Drag handle"], label: "Scale + rotate overlay" },
      ],
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎹 Keyboard Shortcuts</h2>
        <div className="shortcuts-grid">
          {sections.map((section) => (
            <div key={section.title} className="shortcuts-section">
              <h3>{section.title}</h3>
              {section.shortcuts.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <div className="shortcut-keys">
                    {s.keys.map((k, j) => (
                      <span key={j}>
                        <kbd>{k}</kbd>
                        {j < s.keys.length - 1 && <span className="shortcut-plus">+</span>}
                      </span>
                    ))}
                  </div>
                  <span className="shortcut-label">{s.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
