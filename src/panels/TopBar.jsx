// src/panels/TopBar.jsx
// The Overlay button now calls onActivateOverlay instead of just toggleOverlayMode.
// This enters overlay mode AND switches the panel to the overlay tab in one click.

import { renderSkinToSVG } from "../render/renderSkinToSVG";
import { svgToPNG } from "../render/svgToPNG";
import { encodeSkin } from "../utils/encodeSkin";
import { BONKVERSE_BASE_URL } from "../config/env";
import { requireBonkverseAuth } from "../auth/requireAuth";

export default function TopBar({ camera, bonk, shapes, ui, overlay, onOpenPicker, onActivateOverlay }) {
  const hasOverlay = !!overlay?.overlay?.src;
  const overlayMode = overlay?.overlayMode;

  return (
    <div className="top-bar">
      <div className="top-bar-brand">🎮 Bonkverse Editor</div>

      <div className="top-bar-actions">
        <button className="tb-btn" onClick={bonk.exportJSON}>Export</button>

        <label className="tb-btn tb-btn-label">
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

        {/* Overlay button — one click: enters mode + opens overlay tab */}
        {hasOverlay && (
          <button
            className={`tb-btn ${overlayMode ? "tb-btn-active" : ""}`}
            onClick={onActivateOverlay}
            title="Switch to overlay tab and enter edit mode (O)"
          >
            🖼️ {overlayMode ? "Editing Overlay" : "Overlay"}
          </button>
        )}

        <div className="tb-sep" />

        <button className="tb-btn" onClick={async () => {
          const skinJSON = bonk.exportSkinObject();
          const username = prompt("Bonk.io Username:");
          const password = prompt("Bonk.io Password:");
          if (!username || !password) return alert("Missing credentials");
          const res = await fetch("/api/wear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, skin: skinJSON }) });
          const data = await res.json();
          if (data.ok) alert(`✅ Applied to slot ${data.activeSlot}!`);
          else alert("❌ Failed: " + (data.error || "unknown"));
        }}>Wear Skin</button>

        <button className="tb-btn tb-btn-publish" onClick={async () => {
          try {
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
        }}>🚀 Publish</button>
      </div>

      <button className="fab-add-shape" onClick={onOpenPicker} title="Add shape (Shift+Space)">+</button>
    </div>
  );
}
