// // server.js
// import express from "express";
// import path from "path";
// import { fileURLToPath } from "url";
// import fetch from "node-fetch"; // install with: npm install node-fetch
// import { encodeSkin } from "./src/utils/encodeSkin.js"; // import your encoder
// import process from "process";

// import { Buffer } from "buffer";
// import sharp from "sharp";
// import { decodeSkinCode } from "./decodeSkin.js"; // your decoder
// import { renderSkinToSVGFromBonk } from "./src/render/renderSkinToSVGFromBonk.js";
// import { loadAndNormalizeSvgNode } from "./src/utils/loadSvgNode.js";
// import { TOTAL_BONK_SHAPES } from "./src/bonk/constants.js";

// for (let i = 1; i <= TOTAL_BONK_SHAPES; i++) {
//   loadAndNormalizeSvgNode(i);
// }

// console.log("✅ Server SVG cache loaded");

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const BONK_AVATAR_UPDATE_URL = "https://bonk2.io/scripts/avatar_update.php";
// const BONK_LOGIN_URL = "https://bonk2.io/scripts/login_legacy.php";

// const app = express();

// // Serve static files from dist
// app.use(express.static(path.join(__dirname, "dist")));

// app.use(express.json({ limit: "1mb" }));

// app.post("/api/wear", async (req, res) => {
//   try {
//     const { username, password, skin } = req.body;
//     if (!username || !password || !skin) {
//       return res.status(400).json({ ok: false, error: "missing_params" });
//     }

//     // 1️⃣ Login to Bonk.io
//     const loginRes = await fetch(BONK_LOGIN_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: new URLSearchParams({
//         task: "legacy",
//         username,
//         password,
//       }),
//     });

//     const loginData = await loginRes.json();
//     if (loginData.r !== "success" || !loginData.token) {
//       return res.status(401).json({ ok: false, error: loginData.error || "login_failed" });
//     }

//     const token = loginData.token;
//     const activeSlot =
//       loginData.activeAvatarNumber ||
//       loginData.activeavatarnumber ||
//       3; // fallback if missing

//     // 2️⃣ Encode JSON into skinCode
//     const skinCode = encodeSkin(skin);

//     // 3️⃣ Apply skin to user’s active slot
//     const updateRes = await fetch(BONK_AVATAR_UPDATE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: new URLSearchParams({
//         task: "updateavatar",
//         token,
//         newavatarslot: String(activeSlot),
//         newavatar: skinCode,
//       }),
//     });

//     const updateData = await updateRes.json();
//     if (updateData.r !== "success") {
//       return res.status(400).json({ ok: false, error: updateData.error || "update_failed" });
//     }

//     // ✅ Done
//     res.json({ ok: true, skinCode, activeSlot });
//   } catch (err) {
//     console.error("Error in /api/wear:", err);
//     res.status(500).json({ ok: false, error: "server_error" });
//   }
// });

// app.post("/api/render", async (req, res) => {
//   try {
//     const { skinCode, size = 512 } = req.body;
//     if (!skinCode) {
//       return res.status(400).json({ error: "missing_skin_code" });
//     }

//     // 1️⃣ Decode skin code → Bonk JSON
//     const skin = decodeSkinCode(skinCode);

//     // 2️⃣ Render SVG (Bonk-space aware)
//     const svg = renderSkinToSVGFromBonk(skin);

//     // 3️⃣ SVG → PNG
//     const png = await sharp(Buffer.from(svg))
//       .resize(size, size)
//       .png()
//       .toBuffer();

//     // 4️⃣ Return image
//     res.set("Content-Type", "image/png");
//     res.send(png);
//   } catch (err) {
//     console.error("Error in /api/render:", err);
//     res.status(500).json({ error: "render_failed" });
//   }
// });


// // Example API route
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", time: new Date().toISOString() });
// });

// // ✅ Fallback for SPA routes (Express 5-safe)
// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

// // Railway will inject PORT automatically
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`✅ Server running on port ${port}`);
// });

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { encodeSkin } from "./src/utils/encodeSkin.js";
import process from "process";

import { Buffer } from "buffer";
import sharp from "sharp";
import { decodeSkinCode } from "./decodeSkin.js";
import { renderSkinToSVGFromBonk } from "./src/render/renderSkinToSVGFromBonk.js";
import { loadAndNormalizeSvgNode } from "./src/utils/loadSvgNode.js";
import { TOTAL_BONK_SHAPES } from "./src/bonk/constants.js";

for (let i = 1; i <= TOTAL_BONK_SHAPES; i++) {
  loadAndNormalizeSvgNode(i);
}

console.log("✅ Server SVG cache loaded");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BONK_AVATAR_UPDATE_URL = "https://bonk2.io/scripts/avatar_update.php";
const BONK_LOGIN_URL = "https://bonk2.io/scripts/login_legacy.php";

const app = express();

app.use(express.static(path.join(__dirname, "dist")));

app.use(express.json({ limit: "10mb" }));

app.post("/api/wear", async (req, res) => {
  try {
    const { username, password, skin } = req.body;

    if (!username || !password || !skin) {
      return res.status(400).json({
        ok: false,
        error: "missing_params",
      });
    }

    const loginRes = await fetch(BONK_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        task: "legacy",
        username,
        password,
      }),
    });

    const loginData = await loginRes.json();

    if (loginData.r !== "success" || !loginData.token) {
      return res.status(401).json({
        ok: false,
        error: loginData.error || "login_failed",
      });
    }

    const token = loginData.token;

    const activeSlot =
      loginData.activeAvatarNumber ||
      loginData.activeavatarnumber ||
      3;

    const skinCode = encodeSkin(skin);

    const updateRes = await fetch(BONK_AVATAR_UPDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        task: "updateavatar",
        token,
        newavatarslot: String(activeSlot),
        newavatar: skinCode,
      }),
    });

    const updateData = await updateRes.json();

    if (updateData.r !== "success") {
      return res.status(400).json({
        ok: false,
        error: updateData.error || "update_failed",
      });
    }

    return res.json({
      ok: true,
      skinCode,
      activeSlot,
    });
  } catch (err) {
    console.error("Error in /api/wear:", err);

    return res.status(500).json({
      ok: false,
      error: "server_error",
      hint: err.message,
    });
  }
});

app.post("/api/render", async (req, res) => {
  try {
    const { skinCode, size = 512 } = req.body;

    if (!skinCode) {
      return res.status(400).json({
        ok: false,
        error: "missing_skin_code",
      });
    }

    const skin = decodeSkinCode(skinCode);
    const svg = renderSkinToSVGFromBonk(skin);

    const png = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    return res.send(png);
  } catch (err) {
    console.error("Error in /api/render:", err);

    return res.status(500).json({
      ok: false,
      error: "render_failed",
      hint: err.message,
    });
  }
});

app.post("/api/render-bundle", async (req, res) => {
  try {
    const { skinCode } = req.body;

    if (!skinCode) {
      return res.status(400).json({
        ok: false,
        error: "missing_skin_code",
      });
    }

    const skin = decodeSkinCode(skinCode);
    const svg = renderSkinToSVGFromBonk(skin);

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(512, 512)
      .png()
      .toBuffer();

    const thumbBuffer = await sharp(Buffer.from(svg))
      .resize(128, 128)
      .png()
      .toBuffer();

    return res.json({
      ok: true,
      svg,
      pngBase64: pngBuffer.toString("base64"),
      thumbnailBase64: thumbBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("Error in /api/render-bundle:", err);

    return res.status(500).json({
      ok: false,
      error: "render_bundle_failed",
      hint: err.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  return res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});