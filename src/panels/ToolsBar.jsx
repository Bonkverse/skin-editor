import {CANVAS_SIZE, BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR} from "../bonk/constants.js";

export default function ToolsBar({
  baseColor,
  setBaseColor,
  exportJSON,
  importJSON,
  resetCamera,
  setShowShortcuts,
  shapes,
}) {
  return ( 
    <div className="tools-bar">
        <label>
          Base color:
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
          />
        </label>

        <button className="editor-btn" onClick={exportJSON}>Export</button>

        <label className="file-label">
          Import
          <input
            type="file"
            accept=".json"
            onChange={importJSON}
            className="file-input"
          />
        </label>

        <button className="editor-btn" onClick={resetCamera}>Reset View</button>
        <button className="editor-btn" onClick={() => setShowShortcuts(true)}>Shortcuts</button>

        <button
          className="editor-btn"
          onClick={async () => {
            const skinJSON = {
              bc: parseInt(baseColor.replace("#", ""), 16),
              layers: [...shapes].reverse().map((s) => ({
                id: s.id,
                scale: +(s.scale / BONK_SCALE_FACTOR).toFixed(6),
                angle: +s.angle.toFixed(6),
                x: +(((s.x - CANVAS_SIZE / 2) / BONK_X_POS_FACTOR)).toFixed(6),
                y: +(((s.y - CANVAS_SIZE / 2) / BONK_Y_POS_FACTOR)).toFixed(6),
                flipX: !!s.flipX,
                flipY: !!s.flipY,
                color: parseInt(s.color.replace("#", ""), 16),
              })),
            };

            const username = prompt("Bonk.io Username:");
            const password = prompt("Bonk.io Password:");
            if (!username || !password) return alert("Missing credentials");

            const res = await fetch("/api/wear", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password, skin: skinJSON }),
            });

            const data = await res.json();
            if (data.ok) {
              alert(`✅ Skin applied successfully to slot ${data.activeSlot}!`);
            } else {
              alert("❌ Failed to wear skin: " + (data.error || "unknown"));
            }
          }}
        >
          Wear Skin
        </button>
      </div>
   );
}