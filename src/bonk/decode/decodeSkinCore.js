// decodeSkinCore.js
// Pure Bonk skin binary decoder (browser + node safe)
//
// A skin code is base64 AMF3: an object of class "a" holding the layer list
// (an AMF3 array) and the base color. The layer list is an AS3 array, so it
// can come in two parts:
//   - a dense part: slots 0..n-1, in order;
//   - an associative part, written *before* the dense part: "index" -> value
//     pairs for slots past the first gap. AS3 writes an array this way once a
//     slot in the middle has been emptied (layers removed in bonk.io).
// Any slot (dense or associative) may hold AMF3 null (0x01) or undefined
// (0x00) instead of a layer. Layers come out in slot order.

export function decodeSkinBytes(bytes) {
  try {
    return readSkin(bytes, false);
  } catch (error) {
    // This editor's encoder wrote the slot count as one byte, not an AMF3
    // integer, so its skins with more than 63 layers carry a count byte of
    // 0x80 or more. Read those the way it wrote them.
    try {
      return readSkin(bytes, true);
    } catch {
      throw error;
    }
  }
}

function readSkin(bytes, oneByteCount) {
  let i = 0;

  const readU8 = () => {
    if (i >= bytes.length) throw new Error("skin code ends too early");
    return bytes[i++];
  };
  const readU16 = () => (readU8() << 8) | readU8();
  const readU32 = () =>
    (readU8() << 24) | (readU8() << 16) | (readU8() << 8) | readU8();

  const readFloat = () => {
    if (i + 4 > bytes.length) throw new Error("skin code ends too early");
    const view = new DataView(bytes.buffer, bytes.byteOffset + i, 4);
    const v = view.getFloat32(0, false);
    i += 4;
    return v;
  };

  // AMF3 variable-length integer (1 to 4 bytes).
  const readU29 = () => {
    let value = 0;
    for (let n = 0; n < 3; n++) {
      const b = readU8();
      value = (value << 7) | (b & 0x7f);
      if (!(b & 0x80)) return value;
    }
    return (value << 8) | readU8();
  };

  // AMF3 strings: inline (low bit 1) or a reference to an earlier one.
  // The table fills in stream order: the outer class name "a", then keys
  // and the layer class name "al" as they appear.
  const strings = ["a"];
  const readString = () => {
    const header = readU29();
    if (!(header & 1)) {
      const ref = strings[header >> 1];
      if (ref === undefined) throw new Error(`bad string reference ${header >> 1}`);
      return ref;
    }
    const length = header >> 1;
    if (i + length > bytes.length) throw new Error("skin code ends too early");
    let s = "";
    for (let n = 0; n < length; n++) s += String.fromCharCode(bytes[i++]);
    if (length > 0) strings.push(s);
    return s;
  };

  // The first layer in the byte stream (whichever slot it is in) carries
  // the inline class definition (07 05 'a' 'l'); later layers refer back to
  // it with one byte (05).
  let classDefined = false;
  const readLayer = () => {
    if (!classDefined) {
      readU8(); readU8(); readU8(); readU8(); // 07 05 'a' 'l'
      strings.push("al");
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

    return { id, scale, angle, x, y, flipX, flipY, color };
  };

  // One slot's value: a layer, or null for an empty slot.
  const readSlot = (slot) => {
    const marker = readU8();
    if (marker === 0x01 || marker === 0x00) return null; // empty slot
    if (marker !== 0x0a) {
      throw new Error(`layer slot ${slot}: unexpected byte 0x${marker.toString(16)}`);
    }
    return readLayer();
  };

  // --- HEADER ---
  readU8(); // 0x0a
  readU8(); // 0x07
  readU8(); // 0x03
  readU8(); // 'a'
  readU16(); // version
  readU8(); // 0x09 (array)

  const denseCount = (oneByteCount ? readU8() : readU29()) >> 1;

  // --- LAYERS ---
  const slots = []; // [slot index, layer]

  // Associative part: "index" -> slot, ended by the empty string (0x01).
  for (;;) {
    const key = readString();
    if (key === "") break;
    const slot = Number(key);
    if (!Number.isInteger(slot) || slot < 0) {
      throw new Error(`layer list has a non-index key "${key}"`);
    }
    const layer = readSlot(slot);
    if (layer) slots.push([slot, layer]);
  }

  // Dense part: slots 0..denseCount-1.
  for (let slot = 0; slot < denseCount; slot++) {
    const layer = readSlot(slot);
    if (layer) slots.push([slot, layer]);
  }

  slots.sort((a, b) => a[0] - b[0]);
  const layers = slots.map(([, layer]) => layer);

  // --- BASE COLOR ---
  const bc = readU32() >>> 0;

  return { bc, layers };
}
