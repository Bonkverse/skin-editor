// Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { TOTAL_BONK_SHAPES } from "../src/bonk/constants.js";
import { decodeSkinCode } from "../src/bonk/decode/decodeSkinNode.js";
import { renderSkinToSVGFromBonk } from "../src/render/renderSkinToSVGFromBonk.js";
import { loadAndNormalizeSvgNode } from "../src/utils/loadSvgNode.js";

const centers = JSON.parse(fs.readFileSync("src/utils/shapeCenters.json", "utf-8"));

// The renderer skips a layer whose shape it doesn't have, without an error,
// so a missing file or center shows up only as a skin with a layer gone.
test("every shape the editor offers has an SVG file and a center", () => {
  for (let id = 1; id <= TOTAL_BONK_SHAPES; id++) {
    assert.ok(fs.existsSync(path.join("public/output_shapes", `${id}.svg`)), `shape ${id}: no SVG`);
    assert.ok(centers[id], `shape ${id}: no entry in shapeCenters.json`);
  }
});

test("the whisp (shape 115) renders", () => {
  for (let id = 1; id <= TOTAL_BONK_SHAPES; id++) loadAndNormalizeSvgNode(id);
  // Skin with one layer (shape 13); change its shape id to 115.
  const bytes = Buffer.from(
    "CgcDYQACCQMBCgcFYWwAAQANPhmZmgAAAAAAAAAAAAAAAAAAAPr6+gAAAAA=",
    "base64",
  );
  assert.equal(bytes.readUInt16BE(16), 13);
  bytes.writeUInt16BE(115, 16);

  const skin = decodeSkinCode(bytes.toString("base64"));
  assert.deepEqual(skin.layers.map((layer) => layer.id), [115]);
  const svg = renderSkinToSVGFromBonk(skin);
  assert.match(svg, /<path d="M20\.25 -17\.2/); // the whisp's outline
});
