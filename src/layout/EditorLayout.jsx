// src/layout/EditorLayout.jsx
//
// The top-level layout shell. Replaces EditorShell.
// Three columns: LeftPanel | Canvas | RightPanel
// Plus a thin top action bar.

import LeftPanel from "../panels/LeftPanel";
import RightPanel from "../panels/RightPanel";
import TopBar from "../panels/TopBar";

export default function EditorLayout({
  children,        // the canvas
  shapes,
  camera,
  bonk,
  overlay,
  ui,
}) {
  return (
    <div className="editor-layout">
      <TopBar camera={camera} bonk={bonk} shapes={shapes} ui={ui} overlay={overlay} />
      <div className="editor-body">
        <LeftPanel shapes={shapes} ui={ui} />
        <div className="editor-canvas-area">
          {children}
        </div>
        <RightPanel shapes={shapes} bonk={bonk} overlay={overlay} />
      </div>
    </div>
  );
}
