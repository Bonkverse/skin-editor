// encodeSkin.js
// Converts a Bonk.io skin JSON (like the one exported from the editor) back into a Bonk.io / Bonkleagues skin code.

function writeInt32BE(buffer, offset, value) {
  buffer[offset] = (value >>> 24) & 0xff;
  buffer[offset + 1] = (value >>> 16) & 0xff;
  buffer[offset + 2] = (value >>> 8) & 0xff;
  buffer[offset + 3] = value & 0xff;
}

function writeInt16BE(buffer, offset, value) {
  buffer[offset] = (value >> 8) & 0xff;
  buffer[offset + 1] = value & 0xff;
}

function writeFloatBE(buffer, offset, value) {
  const view = new DataView(buffer.buffer);
  view.setFloat32(offset, value, false);
}

// Converts a JSON object { bc, layers } → skinCode string
export function encodeSkin(json) {
  const { bc, layers } = json;
  const numLayers = layers.length;

  // Estimate total bytes (header + each layer + footer)
  const size = 30 + numLayers * 32 + 10;
  const buffer = new Uint8Array(size);
  let index = 0;
  const writeByte = (v) => (buffer[index++] = v);

  // --- HEADER ---
  writeByte(0x0a);
  writeByte(0x07);
  writeByte(0x03);
  writeByte(0x61);
  writeInt16BE(buffer, index, 0x02); index += 2;
  writeByte(0x09);
  writeByte(2 * numLayers + 1);
  writeByte(0x01);

  // --- LAYERS ---
  for (let i = 0; i < numLayers; i++) {
    const l = layers[i];
    writeByte(0x0a);
    if (i === 0) {
      writeByte(0x07);
      writeByte(0x05);
      writeByte(0x61);
      writeByte(0x6c);
    } else {
      writeByte(0x05);
    }
    writeInt16BE(buffer, index, 1); index += 2;
    writeInt16BE(buffer, index, l.id); index += 2;
    writeFloatBE(buffer, index, l.scale); index += 4;
    writeFloatBE(buffer, index, l.angle); index += 4;
    writeFloatBE(buffer, index, l.x); index += 4;
    writeFloatBE(buffer, index, l.y); index += 4;
    writeByte(l.flipX ? 1 : 0);
    writeByte(l.flipY ? 1 : 0);
    writeInt32BE(buffer, index, l.color); index += 4;
  }

  // --- BASE COLOR ---
  writeInt32BE(buffer, index, bc); index += 4;

  // Trim unused bytes
  const out = buffer.slice(0, index);

  // --- Convert to encoded skin string ---
  let binary = "";
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  const b64 = btoa(binary);
  const encodedUrl = encodeURIComponent(b64);
  return encodedUrl;
}

// Example usage in Node:
// import fs from "fs";
// import { encodeSkin } from "./encodeSkin.js";
// const json = JSON.parse(fs.readFileSync("./Bonkverse Skin (1).json", "utf8"));
// const code = encodeSkin(json);
// console.log(code);
