// src/panels/TopBar.jsx
import { renderSkinToSVG } from "../render/renderSkinToSVG";
import { svgToPNG } from "../render/svgToPNG";

export default function TopBar({
  camera, bonk, shapes, ui, overlay,
  onOpenPicker, onActivateOverlay,
  skinName, onWearClick, onPublishClick,
}) {
  const hasOverlay = !!overlay?.overlay?.src;
  const overlayMode = overlay?.overlayMode;
  const nameInvalid = !skinName.isValid();

  function handleOverlayFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { overlay.setImage(src, img); onActivateOverlay?.(); };
    img.src = src;
  }

  return (
    <div className="top-bar">
      <div className="top-bar-brand">🎮 Bonkverse Editor</div>

      <input
        className={`skin-name-input ${nameInvalid ? "invalid" : ""}`}
        value={skinName.name}
        placeholder="Untitled Skin"
        onChange={(e) => skinName.setName(e.target.value)}
        onFocus={() => skinName.setEditing(true)}
        onBlur={() => { skinName.setEditing(false); if (!skinName.name.trim()) skinName.setName("Untitled Skin"); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        title={nameInvalid ? "Letters, numbers, spaces, underscores only" : "Click to rename your skin"}
      />

      <div className="top-bar-actions">
        <button className="tb-btn" onClick={bonk.exportJSON}>Export</button>

        <label className="tb-btn tb-btn-label" title="Import skin JSON">
          Import
          <input type="file" accept=".json" className="file-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) bonk.importJSON(f); e.target.value = ""; }} />
        </label>

        <button className="tb-btn" onClick={async () => {
          const svg = renderSkinToSVG(shapes.shapes, bonk.baseColor);
          const png = await svgToPNG(svg, 512);
          const a = document.createElement("a"); a.href = png; a.download = "bonk-skin.png"; a.click();
        }}>Export PNG</button>

        <div className="tb-sep" />
        <button className="tb-btn" onClick={camera.resetCamera}>Reset View</button>
        <button className="tb-btn" onClick={() => ui.setShowShortcuts(true)}>Shortcuts</button>
        <div className="tb-sep" />

        <label className="tb-btn tb-btn-label" title="Upload an image to use as a tracing overlay">
          🖼️ {hasOverlay ? "Change Overlay" : "Add Overlay"}
          <input type="file" accept="image/*" className="file-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOverlayFile(f); e.target.value = ""; }} />
        </label>

        {hasOverlay && (
          <button className={`tb-btn ${overlayMode ? "tb-btn-active" : ""}`} onClick={onActivateOverlay}
            title="Switch to overlay tab and enter edit mode (O)">
            {overlayMode ? "Editing Overlay" : "Edit Overlay"}
          </button>
        )}

        <div className="tb-sep" />

        <button className="tb-btn" onClick={onWearClick}>Wear Skin</button>
        <button className="tb-btn tb-btn-publish" onClick={onPublishClick}>🚀 Publish</button>
      </div>

      <button className="fab-add-shape" onClick={onOpenPicker} title="Add shape (Shift+Space)">+</button>
    </div>
  );
}