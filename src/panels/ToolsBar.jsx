import {CANVAS_SIZE, BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR} from "../bonk/constants.js";
import { renderSkinToSVG } from "../render/renderSkinToSVG";
import { svgToPNG } from "../render/svgToPNG";
import { encodeSkin } from "../utils/encodeSkin";
import { BONKVERSE_BASE_URL } from "../config/env";
import { requireBonkverseAuth } from "../auth/requireAuth";



export default function ToolsBar({
  ui,
  bonk,
  camera,
  shapes,
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

        <button
          className="editor-btn"
          onClick={async () => {
            const svg = renderSkinToSVG(shapes.shapes, bonk.baseColor);
            const png = await svgToPNG(svg, 512);

            const a = document.createElement("a");
            a.href = png;
            a.download = "bonk-skin.png";
            a.click();
          }}
        >
          Export Image
        </button>




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

        <button
          className="editor-btn"
          onClick={async () => {
            try {
              // 1️⃣ Require login
              const me = await requireBonkverseAuth();
              if (!me) return;

              // 2️⃣ Ask for skin name
              const skinName = prompt("Skin name?");
              if (!skinName) return;

              // 3️⃣ Use authenticated username
              const creator = me.user.username;

              // 4️⃣ Build skin payload
              const svg = renderSkinToSVG(shapes.shapes, bonk.baseColor);
              const skinObject = bonk.exportSkinObject();
              const skinCode = encodeSkin(skinObject);

              const fd = new FormData();
              fd.append("skin_name", skinName);
              fd.append("creator", creator);
              fd.append("skin_code", skinCode);
              fd.append(
                "svg",
                new Blob([svg], { type: "image/svg+xml" }),
                "skin.svg"
              );

              // 5️⃣ Publish
              const res = await fetch(`${BONKVERSE_BASE_URL}/api/publish-skin/`, {
                method: "POST",
                credentials: "include",
                body: fd,
              });

              const data = await res.json();

              if (!res.ok || !data.success) {
                alert("❌ Publish failed");
                return;
              }

              window.open(data.skin.share_url, "_blank", "noopener,noreferrer");

            } catch (err) {
              console.error(err);
              alert("❌ Error publishing skin");
            }
          }}
        >
          🚀 Publish
        </button>



      </div>
   );
}