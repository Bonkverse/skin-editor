// decodeSkin.js
// Converts a Bonk.io / Bonkleagues skin code into readable JSON.
import fs from "fs";

function readInt32BE(buffer, offset) {
  return (
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  ) >>> 0;
}

function readInt16BE(buffer, offset) {
  const val = (buffer[offset] << 8) | buffer[offset + 1];
  return val & 0x8000 ? val - 0x10000 : val;
}

function readFloatBE(buffer, offset) {
  const view = new DataView(buffer.buffer, offset, 4);
  return view.getFloat32(0, false);
}

export function decodeSkinCode(skinCode) {
  // Step 1: URL decode
  const decodedUrl = decodeURIComponent(skinCode);
  // const decodedUrl = decodeURIComponent(decodeURIComponent(skinCode));

  // Step 2: Base64 decode
  const binary = atob(decodedUrl);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);

  let index = 0;
  const readByte = () => buffer[index++];
  const readShort = () => {
    const v = readInt16BE(buffer, index);
    index += 2;
    return v;
  };
  const readInt = () => {
    const v = readInt32BE(buffer, index);
    index += 4;
    return v;
  };
  const readFloat = () => {
    const v = readFloatBE(buffer, index);
    index += 4;
    return v;
  };
  const readBoolean = () => readByte() !== 0;

  // Skip header bytes
  readByte(); // 0x0A
  readByte(); // 0x07
  readByte(); // 0x03
  readByte(); // 0x61
  readShort(); // 0x02
  readByte(); // 0x09
  const numLayersX2Plus1 = readByte();
  readByte(); // 0x01

  const numLayers = (numLayersX2Plus1 - 1) / 2;
  const layers = [];

  for (let i = 0; i < numLayers; i++) {
    readByte(); // 0x0A
    if (i === 0) {
      readByte(); // 0x07
      readByte(); // 0x05
      readByte(); // 0x61
      readByte(); // 0x6C
    } else {
      readByte(); // 0x05
    }

    readShort(); // 1
    const shapeId = readShort();
    const scale = readFloat();
    const angle = readFloat();
    const x = readFloat();
    const y = readFloat();
    const flipX = readBoolean();
    const flipY = readBoolean();
    const color = readInt();

    layers.push({ id: shapeId, scale, angle, x, y, flipX, flipY, color });
  }

  const bc = readInt();

  return { layers, bc };
}

// Example usage:
const skin = "CgcDYQACCSEBCgcFYWwAAQAcPQsEq0L1Bp1Av9AcwGhpnAAAAP8AAAoFAAEAHD0If8xCroZEQKht3cCyKXoAAAD%2FAAAKBQABABw9JiRXQivDeEBLppjA2UThAAAA%2FwAACgUAAQAcPRmVaMDeSEc%2FBx%2BKwMN9jQAAAP8AAAoFAAEAHD0TqB7BkTspv0vrr8COSXcAAAD%2FAAAKBQABABw9OqvNwcf4VsAjPOa%2Fn%2B23AAAA%2FwAACgUAAQAcPTqrzcHH%2BFbAVkiuPocB%2FAAAAP8AAAoFAAEAHD06q83Bx%2FhWwIUybD%2FuEmIAAAD%2FAAAKBQABABw9OqvNwcf4VsCgKH5AXIuxAAAA%2FwAACgUAAQAiPg3xWkKLiHtAqePgwJB10wAAAP%2F%2F%2FwoFAAEAIj4TkhlB5ZUDQIHwSMC8OtwAAAD%2F%2F%2F8KBQABACI%2BGlj3wcqcgz%2B7r%2FPAv4s7AAAA%2F%2F%2F%2FCgUAAQBwPJ35e0LcGkO%2FzWaEwE1TrAEBAGdDDQoFAAEAHD6cLc%2FCeBWQwDuI8L7uI68AAAD%2F%2F%2F8KBQABAHA8mnO0QwUbt7%2BUb87AUPuxAAAAZ0MNCgUAAQAcPrrXMEKufXLAAAAAwSvoMAAAAGdDDQAAAAA%3D";
console.log(decodeSkinCode(skin));
// Write the decoded skin to a json file
fs.writeFileSync("decodeddBLSkin.json", JSON.stringify(decodeSkinCode(skin), null, 2));

