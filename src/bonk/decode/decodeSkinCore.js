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
  // The layer list has a fixed number of slots. A slot whose layer was
  // removed in bonk.io holds AMF3 null (0x01) or undefined (0x00) instead of
  // a layer object, so skip it. The first *layer* (not slot 0, which may be
  // empty) carries the inline class definition (07 05 'a' 'l'); later layers
  // refer back to it with one byte (05).
  const layers = [];
  let classDefined = false;
  for (let l = 0; l < layerCount; l++) {
    const marker = readU8();
    if (marker === 0x01 || marker === 0x00) continue; // empty slot
    if (marker !== 0x0a) {
      throw new Error(`layer slot ${l}: unexpected byte 0x${marker.toString(16)}`);
    }

    if (!classDefined) {
      readU8(); readU8(); readU8(); readU8();
      classDefined = true;
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
