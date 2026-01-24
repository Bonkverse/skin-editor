import {CANVAS_SIZE, BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR} from "../bonk/constants.js";

export default function ToolsBar({
  ui,
  bonk,
  camera,
}) {
  return ( 
    <div className="tools-bar">
        <label>
          Base color:
          <input
            type="color"
            value={bonk.baseColor}
            onChange={(e) => bonk.setBaseColor(e.target.value)}
          />
        </label>

        <button className="editor-btn" onClick={bonk.exportJSON}>Export</button>

        <label className="file-label">
          Import
          <input
            type="file"
            accept=".json"
            className="file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) bonk.importJSON(file);
              e.target.value = ""; // optional: allows re-importing same file
            }}
          />
        </label>


        <button className="editor-btn" onClick={camera.resetCamera}>Reset View</button>
        <button className="editor-btn" onClick={() => ui.setShowShortcuts(true)}>Shortcuts</button>

        <button
          className="editor-btn"
          onClick={async () => {
            const skinJSON = bonk.exportSkinObject(); // shared

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