// src/panels/TopBar.jsx

import { renderSkinToSVG } from "../render/renderSkinToSVG";
import { svgToPNG } from "../render/svgToPNG";
import { encodeSkin } from "../utils/encodeSkin";
import { BONKVERSE_BASE_URL } from "../config/env";
import { requireBonkverseAuth } from "../auth/requireAuth";

export default function TopBar({ camera, bonk, shapes, ui, overlay, onOpenPicker, onActivateOverlay }) {
  const hasOverlay = !!overlay?.overlay?.src;
  const overlayMode = overlay?.overlayMode;

  // Load an image file as overlay — same logic as the canvas drop handler
  function handleOverlayFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      overlay.setImage(src, img);
      // After setting the image, activate the overlay tab
      if (onActivateOverlay) onActivateOverlay();
    };
    img.src = src;
  }

  // ── Wear: inform but don't block (recoverable — only changes your slot) ──
  async function handleWear() {
    bonk.checkBeforeBonk(); // fires summary toast; non-blocking

    const skinJSON = bonk.exportSkinObject();
    const username = prompt("Bonk.io Username:");
    const password = prompt("Bonk.io Password:");
    if (!username || !password) return alert("Missing credentials");

    const res = await fetch("/api/wear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, skin: skinJSON }),
    });
    const data = await res.json();
    if (data.ok) alert(`✅ Applied to slot ${data.activeSlot}!`);
    else alert("❌ Failed: " + (data.error || "unknown"));
  }

  // ── Publish: hard-stop on destructive issues (permanent + shared) ──
  async function handlePublish() {
    try {
      const ok = bonk.checkBeforeBonk(); // toast + ok flag
      if (!ok) {
        const proceed = window.confirm(
          "Some shapes will break in bonk (reset to 0.25, moved to origin, or the whole skin dropped if over 16 layers).\n\nPublish anyway?"
        );
        if (!proceed) return;
      }

      const me = await requireBonkverseAuth(); if (!me) return;
      const skinName = prompt("Skin name?"); if (!skinName) return;
      const creator = me.user.username;
      const svg = renderSkinToSVG(shapes.shapes, bonk.baseColor);
      const skinObject = bonk.exportSkinObject();
      const skinCode = encodeSkin(skinObject);
      const fd = new FormData();
      fd.append("skin_name", skinName); fd.append("creator", creator); fd.append("skin_code", skinCode);
      fd.append("svg", new Blob([svg], { type: "image/svg+xml" }), "skin.svg");
      const res = await fetch(`${BONKVERSE_BASE_URL}/api/publish-skin/`, { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) { alert("❌ Publish failed"); return; }
      window.open(data.skin.share_url, "_blank", "noopener,noreferrer");
    } catch (err) { console.error(err); alert("❌ Error publishing skin"); }
  }

  return (
    <div className="top-bar">
      <div className="top-bar-brand">🎮 Bonkverse Editor</div>

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

        {/* Upload overlay image — always visible so users know it exists */}
        <label
          className="tb-btn tb-btn-label"
          title="Upload an image to use as a tracing overlay"
        >
          🖼️ {hasOverlay ? "Change Overlay" : "Add Overlay"}
          <input
            type="file"
            accept="image/*"
            className="file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleOverlayFile(f);
              e.target.value = "";
            }}
          />
        </label>

        {/* Overlay edit toggle — only shown when an overlay is loaded */}
        {hasOverlay && (
          <button
            className={`tb-btn ${overlayMode ? "tb-btn-active" : ""}`}
            onClick={onActivateOverlay}
            title="Switch to overlay tab and enter edit mode (O)"
          >
            {overlayMode ? "Editing Overlay" : "Edit Overlay"}
          </button>
        )}

        <div className="tb-sep" />

        <button className="tb-btn" onClick={handleWear}>Wear Skin</button>

        <button className="tb-btn tb-btn-publish" onClick={handlePublish}>🚀 Publish</button>
      </div>

      <button className="fab-add-shape" onClick={onOpenPicker} title="Add shape (Shift+Space)">+</button>
    </div>
  );
}