// decodeSkinCore.js
// Pure Bonk skin binary decoder (browser + node safe)

export function decodeSkinBytes(bytes) {
  let i = 0;

  const readU8 = () => bytes[i++];
  const readU16 = () => (readU8() << 8) | readU8();
  const readU32 = () =>
    (readU8() << 24) | (readU8() << 16) | (readU8() << 8) | readU8();

  const readFloat = () => {
    const view = new DataView(bytes.buffer, i, 4);
    const v = view.getFloat32(0, false);
    i += 4;
    return v;
  };

  // --- HEADER ---
  readU8(); // 0x0a
  readU8(); // 0x07
  readU8(); // 0x03
  readU8(); // 'a'
  readU16(); // version
  readU8(); // 0x09

  const layerCount = (readU8() - 1) / 2;
  readU8(); // 0x01

  // --- LAYERS ---
  const layers = [];
  for (let l = 0; l < layerCount; l++) {
    readU8(); // 0x0a

    if (l === 0) {
      readU8(); readU8(); readU8(); readU8();
    } else {
      readU8();
    }

    readU16(); // always 1
    const id = readU16();

    const scale = readFloat();
    const angle = readFloat();
    const x = readFloat();
    const y = readFloat();

    const flipX = !!readU8();
    const flipY = !!readU8();
    const color = readU32() >>> 0;

    layers.push({
      id,
      scale,
      angle,
      x,
      y,
      flipX,
      flipY,
      color,
    });
  }

  // --- BASE COLOR ---
  const bc = readU32() >>> 0;

  return { bc, layers };
}
