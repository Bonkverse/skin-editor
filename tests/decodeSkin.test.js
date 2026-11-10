// Run: npm test (Node's built-in test runner, no extra dependencies).
import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeSkinCode } from "../src/bonk/decode/decodeSkinNode.js";

// Real skin codes from the Bonkverse gallery whose layer lists have empty
// slots (layers removed in bonk.io). Before the fix the decoder threw on the
// first empty slot, and the render service answered 400 invalid_skin_code.
const WITH_EMPTY_SLOTS = {
  // slot 0 empty: the first real layer (slot 1) carries the class definition
  firstSlotEmpty:
    "CgcDYQACCRkBAQoHBWFsAAEADT4ZmZoAAAAAAAAAAMDwAAAAAAD6+voKBQABAA0+ij1xAAAAAAAAAADA8AAAAAAAAAAACgUAAQANPhmZmgAAAADAgAAAv8AAAAAAAPr6+goFAAEADT6ZmZoAAAAAwIAAAL/AAAAAAAAAAAAKBQABAA0/IUeuAAAAAL/AAADAYAAAAAAA+vr6AQEBAQEBAAAAAA==",
  // empty slots in the middle and at the end; URL-encoded like stored codes
  middleSlotsEmpty:
    "CgcDYQACCSEBCgcFYWwAAQBoPpmZmgAAAAAAAAAAAAAAAAAAAAAAAAoFAAEAaD44UewAAAAAAAAAAAAAAAAAAACB1PoKBQABAGg%2BQo9cAAAAAAAAAAAAAAAAAAAAT8P3CgUAAQBoPkzMzQAAAAAAAAAAAAAAAAAAACm29goFAAEAaD5XCj0AAAAAAAAAAAAAAAAAAAADqfQKBQABAGg%2BYUeuAAAAAAAAAAAAAAAAAAAAA5vlCgUAAQBoPmuFHwAAAAAAAAAAAAAAAAAAAAKI0QoFAAEAaD51wo8AAAAAAAAAAAAAAAAAAAACd70KBQABAGg%2BgAAAAAAAAAAAAAAAAAAAAAAAAVebAQEBAQEBAQAAAAA=",
};

// The firstSlotEmpty skin with its empty slots taken out: 5 slots, 5 layers,
// the shape every decoder already handled.
function withoutEmptySlots(code) {
  const bytes = Buffer.from(code, "base64");
  const head = bytes.subarray(0, 7); // 0a 07 03 'a' version 09
  let i = 9; // after the slot count and 0x01
  const layers = [];
  while (i < bytes.length - 4) {
    if (bytes[i] === 0x01) { i += 1; continue; }
    const size = layers.length === 0 ? 1 + 4 + 4 + 16 + 2 + 4 : 1 + 1 + 4 + 16 + 2 + 4;
    layers.push(bytes.subarray(i, i + size));
    i += size;
  }
  const count = Buffer.from([layers.length * 2 + 1, 0x01]);
  return Buffer.concat([head, count, ...layers, bytes.subarray(bytes.length - 4)]).toString("base64");
}

test("skips empty layer slots, keeping the real layers in order", () => {
  const first = decodeSkinCode(WITH_EMPTY_SLOTS.firstSlotEmpty);
  assert.equal(first.layers.length, 5);
  assert.deepEqual(
    first.layers.map((layer) => layer.id),
    [13, 13, 13, 13, 13],
  );

  const middle = decodeSkinCode(WITH_EMPTY_SLOTS.middleSlotsEmpty);
  assert.equal(middle.layers.length, 9);
  assert.ok(middle.layers.every((layer) => layer.id === 104));
});

test("reads layer fields after an empty first slot", () => {
  const [layer] = decodeSkinCode(WITH_EMPTY_SLOTS.firstSlotEmpty).layers;
  assert.ok(Math.abs(layer.scale - 0.15) < 1e-6);
  assert.equal(layer.flipX, false);
  assert.equal(layer.color, 0xfafafa);
});

test("codes without empty slots decode as before", () => {
  const skin = decodeSkinCode(withoutEmptySlots(WITH_EMPTY_SLOTS.firstSlotEmpty));
  assert.equal(skin.layers.length, 5);
  assert.equal(skin.layers[0].color, 0xfafafa);
});

test("empty slots change nothing about the layers that are there", () => {
  assert.deepEqual(
    decodeSkinCode(WITH_EMPTY_SLOTS.firstSlotEmpty),
    decodeSkinCode(withoutEmptySlots(WITH_EMPTY_SLOTS.firstSlotEmpty)),
  );
});

// Real skin codes whose layer list has a gap, so AS3 wrote the slots past it
// as "index" -> layer pairs before the dense part. #9's decoder read the
// first key as a layer and refused them; the decoder before #9 misread them
// as garbage layers (a wrong image, no error).
const SPARSE = {
  // slots 6 and 7 hold null in the associative part; 4 dense layers
  skin166:
    "CgcDYQACCQkDNgADNwEBCgcFYWwAAQBDPoAAAAAAAAAAAAAAAAAAAAAAADEbkgoFAAEAQz6AAAAAAAAAAAAAAAAAAAABAAC3HBwKBQABAEM%2BgAAAAAAAAAAAAAAAAAAAAQEAxigoCgUAAQBDPoAAAAAAAAAAAAAAAAAAAAABABojfgAAAAA=",
  // every layer is in the associative part (slots 8-15); slots 0-6 are null.
  // The first layer there carries the class definition.
  skin543:
    "CgcDYQACCQ8DOAoHBWFsAAEAUD11wo/C3AAAQIAAAMAAAAAAAAAaI34DOQoFAAEAUD11wo9C3AAAwIAAAMAAAAAAAAAaI34FMTAKBQABAA0%2BszMzAAAAAAAAAABAgAAAAAAAAAAABTExCgUAAQANPrMzMwAAAAAAAAAAQNAAAAAAANMvLwUxMgoFAAEADT6zMzMAAAAAAAAAAEEYAAAAAAAAAAAFMTMKBQABAFA%2BdcKPQzQAAAAAAABAQAAAAAAAAAAABTE0CgUAAQANP0AAAAAAAAAAAAAAAAAAAAAAANMvLwUxNQoFAAEADT9ZmZoAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQDTLy8=",
};

test("reads layers written as index -> layer pairs", () => {
  const skin = decodeSkinCode(SPARSE.skin543);
  assert.equal(skin.bc, 0xd32f2f);
  assert.deepEqual(
    skin.layers.map((layer) => layer.id),
    [80, 80, 13, 13, 13, 80, 13, 13],
  );
  // slot 8: the first eye
  assert.ok(Math.abs(skin.layers[0].x - 4) < 1e-6);
  assert.equal(skin.layers[0].color, 0x1a237e);
  // slot 15: the last layer
  assert.ok(Math.abs(skin.layers[7].scale - 0.85) < 1e-6);
});

test("skips empty slots in the index -> layer pairs", () => {
  const skin = decodeSkinCode(SPARSE.skin166);
  assert.equal(skin.bc, 0);
  assert.deepEqual(
    skin.layers.map((layer) => layer.color),
    [0x311b92, 0xb71c1c, 0xc62828, 0x1a237e],
  );
});

test("a corrupt slot is a clear error, not a silent misread", () => {
  // Replace the first layer marker (0x0a) with 0x0b.
  const bytes = Buffer.from(WITH_EMPTY_SLOTS.middleSlotsEmpty.replace(/%2B/g, "+"), "base64");
  bytes[9] = 0x0b;
  assert.throws(() => decodeSkinCode(bytes.toString("base64")), /layer slot 0: unexpected byte 0xb/);
});
