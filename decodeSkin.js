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

const skin = "CgcDYQACCSEBCgcFYWwAAQBCPTcS3ENX6aW%2Fjc7lQJgImwEBAAAAAAoFAAEAQj2xSCRDUtl9viHdZECQxlMBAQDQi2UKBQABAEI870b3QcrJIEBpvqFAE2wiAQEAAAAACgUAAQBCPOxQR0HKySDAPpdevzzpfgAAAAAAAAoFAAEAQj49ao9DYac2v%2BiJij7%2FadQAAADQi2UKBQABAEI9mtpsQ1LZfb87d7VArs5CAQEAAAAACgUAAQBCPiJH60Ir8R%2B%2Bvh6%2FQF2HSwAAANCLZQoFAAEAQj3IpkZConCjQOQNpkCy1UsBAQCCPSEKBQABAEI96m07QqjdZUENGQVAjRkFAAEA6qyICgUAAQBCPklyaENIzyk%2Fgs8awHNzOAAAAOqsiAoFAAEAQj5hv2pDvhK5vzc2tr%2F5o%2FEBAQDQi2UKBQABAEI%2BJF7%2BQ%2BFcZr9wJdNAmwL1AQEAdjkcCgUAAQBCPpMUbUPhEga%2FZu0PQahI9wABAKdoRwoFAAEAQj6TFG1Dh3V5vspuC0FuLrkAAACnaEcKBQABAEI%2BFxLyQzb5acCuvJa%2FMLx3AAAAdjkcCgUAAQBCPhcS8kMXt1XAsjWTwAR4LQABAHY5HACrjHY%3D";
console.log(decodeSkinCode(skin));
// Write the decoded skin to a json file
fs.writeFileSync("decodeddBLSkin.json", JSON.stringify(decodeSkinCode(skin), null, 2));

