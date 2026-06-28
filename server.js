// server.js
// Editor static host + SVG→PNG render service.
// NOTE: This service does NOT handle auth or wearing. Bonk login and avatar
// updates live in Django (skins/wear_skin.py). This server only renders images
// and serves the built editor.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

import { Buffer } from "buffer";
import sharp from "sharp";
import { decodeSkinCode } from "./src/bonk/decode/decodeSkinNode.js"; // handles single + double-encoded codes
import { renderSkinToSVGFromBonk } from "./src/render/renderSkinToSVGFromBonk.js";
import { loadAndNormalizeSvgNode } from "./src/utils/loadSvgNode.js";
import { TOTAL_BONK_SHAPES } from "./src/bonk/constants.js";

for (let i = 1; i <= TOTAL_BONK_SHAPES; i++) {
  loadAndNormalizeSvgNode(i);
}

console.log("✅ Server SVG cache loaded");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from dist
app.use(express.static(path.join(__dirname, "dist")));

app.use(express.json({ limit: "1mb", type: ["application/json", "text/*"] }));

app.post("/api/render", async (req, res) => {
  try {
    const { skinCode, size = 512 } = req.body;
    if (!skinCode) {
      return res.status(400).json({ error: "missing_skin_code" });
    }

    // 1️⃣ Decode skin code → Bonk JSON
    const skin = decodeSkinCode(skinCode);

    // 2️⃣ Render SVG (Bonk-space aware)
    const svg = renderSkinToSVGFromBonk(skin);

    // 3️⃣ SVG → PNG
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

    // 4️⃣ Return image
    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    console.error("Error in /api/render:", err);
    res.status(500).json({ error: "render_failed" });
  }
});

app.post("/api/render-bundle", async (req, res) => {
  try {
    const { skinCode, size = 512 } = req.body;

    if (!skinCode || typeof skinCode !== "string") {
      return res.status(400).json({ ok: false, error: "missing_or_invalid_skin_code" });
    }

    // 1️⃣ Decode
    let skin;
    try {
      skin = decodeSkinCode(skinCode);
    } catch (err) {
      return res.status(400).json({ ok: false, error: "invalid_skin_code", hint: err.message });
    }

    // 2️⃣ Render SVG
    let svg;
    try {
      svg = renderSkinToSVGFromBonk(skin);
    } catch (err) {
      return res.status(500).json({ ok: false, error: "svg_render_failed", hint: err.message });
    }

    // 3️⃣ Convert → PNG + thumbnail
    let pngBuffer, thumbBuffer;
    try {
      const svgBuffer = Buffer.from(svg);
      pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
      thumbBuffer = await sharp(svgBuffer).resize(128, 128).png().toBuffer();
    } catch (err) {
      return res.status(500).json({ ok: false, error: "png_conversion_failed", hint: err.message });
    }

    // 4️⃣ Return bundle
    return res.json({
      ok: true,
      svg,
      pngBase64: pngBuffer.toString("base64"),
      thumbnailBase64: thumbBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("🔥 Unexpected error in /api/render-bundle:", err);
    return res.status(500).json({ ok: false, error: "render_bundle_failed", hint: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// SPA fallback (Express 5-safe)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Railway injects PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});