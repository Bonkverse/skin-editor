// src/utils/rasterCache.js
//
// Stores colorized SVG shapes as HTMLImageElement objects.
//
// WHY NOT OffscreenCanvas bitmaps:
// Bitmaps lock in a pixel resolution. When shapes are scaled up large,
// the bitmap gets upscaled and blurs. SVG loaded into an <img> element
// stays vector — the browser re-renders it at whatever size drawImage
// needs, so it's always perfectly sharp at any zoom or scale.
//
// The async cost (Blob URL → Image load) only happens once per
// (shapeId, color) combination. After that, drawImage(img) is fast.

const cache = new Map(); // key: `${id}-${color}` → HTMLImageElement

/**
 * Returns a cached HTMLImageElement for a given shape + color.
 * The image is an SVG loaded from a Blob URL — renders as a vector.
 *
 * @param {number} id
 * @param {string} color   - hex e.g. "#ff0000"
 * @param {object} meta    - { html, w, h } from svgCache
 * @returns {Promise<HTMLImageElement>}
 */
export async function getRasterized(id, color, meta) {
  const key = `${id}-${color}`;
  if (cache.has(key)) return cache.get(key);

  const { html, w, h } = meta;

  const colorized = html.replaceAll("currentColor", color);

  // No width/height on the SVG tag — the browser treats it as a scalable
  // vector. drawImage(img, x, y, w, h) will render it at exactly (w, h)
  // pixels at full vector quality regardless of how large that is.
  const svgString = `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${-w / 2} ${-h / 2} ${w} ${h}"
  >${colorized}</svg>`;

  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();

    // Store world dimensions on the image so drawShape knows the
    // correct size to draw at, independent of any pixel dimensions.
    img._worldW = w;
    img._worldH = h;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Failed to load shape ${id}`));
      img.src = url;
    });

    cache.set(key, img);
    return img;
  } finally {
    // Blob URL can be revoked after the image loads —
    // the browser keeps the decoded SVG data in the img element.
    URL.revokeObjectURL(url);
  }
}

/**
 * Synchronous cache check — used during the draw loop.
 * Returns the image if already cached, null if not yet ready.
 */
export function getRasterizedSync(id, color) {
  return cache.get(`${id}-${color}`) ?? null;
}

/**
 * Warms the cache for a list of shapes (e.g. after skin import).
 */
export async function warmRasterCache(shapes, svgCache) {
  await Promise.all(
    shapes.map((s) => {
      const meta = svgCache.get(s.id);
      if (!meta) return Promise.resolve();
      return getRasterized(s.id, s.color, meta);
    })
  );
}

export function invalidateRaster(id, color) {
  cache.delete(`${id}-${color}`);
}

export function clearRasterCache() {
  cache.clear();
}