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

const skin = "CgcDYQACCSEBCgcFYWwAAQA0P22nTEICFOPBA32ywWUaQQEBADJ0zAoFAAEAQDzZZXFEG5hJwA%2Fsb72u%2FlkAAQCxsbEKBQABAB49nQbSP4%2BMr8DRuHjA%2FAdpAAAAAAAACgUAAQBuPcmfCUP6p2VBMyd1wMiSHQEAAP%2F%2F%2FwoFAAEAbj2eSP1DoFLjQRYMt8DCB50AAQAAAAAKBQABAG49jkjIREPyv8D%2B1VXBHbMEAQEA%2F%2F%2F%2FCgUAAQBuPYcZ6EN2fr3A8wckwQv2VwAAAAAAAAoFAAEAHj3bJx5BPECpQQAfY8C8rqIAAAAAAAAKBQABAHM9w%2FM2Q0iuvkEVjlrAqkO%2BAQEAAAAACgUAAQBuPUTdgkOivorAML%2FrQM0KwwABAAAAAAoFAAEAbj1N9pxDeVhzv%2FUNK0C8fdcAAAD%2F%2F%2F8KBQABACM%2BuBDoQwqDzsB%2FnOpBG9mwAAAAdXV1CgUAAQAjPwv5SkRWqf%2FAVx41QQzPagAAAAAAAAoFAAEAGD7cbYxD%2Bdp8wDQDNkDgDeIAAAAAAAAKBQABABo%2BDSwsQ07lU8DD5iTA0ukQAQAA%2F%2F%2F%2FCgUAAQAaPg0sLENO5VPA2CoWwM2oCgEAAAAAAAD%2F%2F%2F8%3D";
console.log(decodeSkinCode(skin));
// Write the decoded skin to a json file
fs.writeFileSync("decodeddBLSkin.json", JSON.stringify(decodeSkinCode(skin), null, 2));

