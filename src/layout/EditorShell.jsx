// layout/EditorShell.jsx
import "../index.css";

export default function EditorShell({ showShapes, showLayers, children}) {
  return (
    <div
      className={`editor-container 
        ${showShapes ? "show-shapes" : ""} 
        ${showLayers ? "show-layers" : ""}`}
    >
      {children}
    </div>
  );
}
