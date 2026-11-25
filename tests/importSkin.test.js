// Run: npm test
// Import JSON (src/bonk/importSkin.js): shared skin files are untrusted, and
// colors end up in the Layers panel's HTML.
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSkinJSON, MAX_IMPORT_LAYERS } from "../src/bonk/importSkin.js";
import { renderSize, withinLayerLimit, MAX_RENDER_LAYERS } from "../src/render/limits.js";

// What Export JSON writes (useBonkSerializer.buildBonkLayers): bottom→top.
const exported = {
  bc: 0x448aff,
  layers: [
    { id: 13, scale: 0.25, angle: 30, x: 1.5, y: -2, flipX: false, flipY: true, color: 0xff0000 },
    { id: 115, scale: 0.1, angle: 0, x: 0, y: 0, flipX: true, flipY: false, color: 0x00ff00 },
  ],
};

test("a file the editor exported imports, top layer first", () => {
  const { baseColor, shapes } = parseSkinJSON(exported);
  assert.equal(baseColor, "#448aff");
  assert.deepEqual(shapes.map((s) => [s.id, s.color, s.flipX]), [
    [115, "#00ff00", true],
    [13, "#ff0000", false],
  ]);
  assert.equal(shapes[1].angle, Math.PI / 6);
});

test("a string color is refused, not put into the page", () => {
  const evil = structuredClone(exported);
  evil.layers[0].color = '"><img src=x onerror=alert(1)>';
  assert.throws(() => parseSkinJSON(evil), /color isn't a color/);
});

test("a string base color is refused", () => {
  assert.throws(() => parseSkinJSON({ ...exported, bc: "<svg onload=alert(1)>" }), /base color/);
});

for (const [what, patch, message] of [
  ["unknown shape", { id: 999 }, /unknown shape/],
  ["shape id as a string", { id: "13" }, /unknown shape/],
  ["color over 24 bits", { color: 0x1000000 }, /color/],
  ["NaN position", { x: "abc" }, /x isn't a number/],
  ["Infinity scale", { scale: Infinity }, /scale isn't a number/],
]) {
  test(`refuses a layer with ${what}`, () => {
    const bad = structuredClone(exported);
    Object.assign(bad.layers[0], patch);
    assert.throws(() => parseSkinJSON(bad), message);
  });
}

test("refuses absurd layer counts", () => {
  const layers = Array.from({ length: MAX_IMPORT_LAYERS + 1 }, () => exported.layers[0]);
  assert.throws(() => parseSkinJSON({ bc: 0, layers }), /more than/);
  assert.equal(parseSkinJSON({ bc: 0, layers: layers.slice(1) }).shapes.length, MAX_IMPORT_LAYERS);
});

test("render size: 512 by default, a sane range, integers only", () => {
  assert.equal(renderSize(undefined), 512);
  assert.equal(renderSize(128), 128);
  assert.equal(renderSize(1024), 1024);
  for (const bad of [40000, 1025, 0, -5, 15, 512.5, "512", null, NaN]) {
    assert.equal(renderSize(bad), null, `size ${bad}`);
  }
});

test("the render cap fits skins this editor can make (one-byte layer count)", () => {
  assert.equal(MAX_RENDER_LAYERS, 255);
});

test("the renderer refuses skins with more layers than it draws", () => {
  const layers = (n) => ({ bc: 0, layers: Array.from({ length: n }, () => ({ id: 13 })) });
  assert.equal(withinLayerLimit(layers(16)), true);
  assert.equal(withinLayerLimit(layers(MAX_RENDER_LAYERS)), true);
  assert.equal(withinLayerLimit(layers(MAX_RENDER_LAYERS + 1)), false);
  assert.equal(withinLayerLimit(layers(25000)), false);
  assert.equal(withinLayerLimit({ bc: 0 }), false);
});
