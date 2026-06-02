// // src/utils/loadSvg.js
// import { svgCache } from "./svgCache";

// export async function loadAndNormalizeSvg(id) {
//   if (svgCache.has(id)) return svgCache.get(id);

//   const raw = await fetch(`/output_shapes/${id}.svg`).then(r => r.text());
//   const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
//   const svg = doc.documentElement;

//   // Force currentColor
//   const walk = el => {
//     if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none")
//       el.setAttribute("fill", "currentColor");
//     if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none")
//       el.setAttribute("stroke", "currentColor");
//     for (const c of el.children) walk(c);
//   };
//   walk(svg);

//   // 🔥 Measure real bounds
//   const temp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   temp.setAttribute("xmlns", "http://www.w3.org/2000/svg");
//   temp.style.position = "absolute";
//   temp.style.visibility = "hidden";
//   temp.appendChild(svg.cloneNode(true));
//   document.body.appendChild(temp);

//   const bbox = temp.getBBox();
//   document.body.removeChild(temp);

//   const cx = bbox.x + bbox.width / 2;
//   const cy = bbox.y + bbox.height / 2;

//   const html = `
//     <g transform="translate(${-cx}, ${-cy})">
//       ${svg.innerHTML}
//     </g>
//   `;

//   const meta = {
//     html,
//     w: bbox.width,
//     h: bbox.height,
//   };

//   svgCache.set(id, meta);
//   return meta;
// }

// src/utils/loadSvg.js
import { svgCache } from "./svgCache";

const IDB_DB = "bonkverse-svgs";
const IDB_STORE = "svgs";
const CACHE_VERSION = 1; // bump this if SVG files change

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, CACHE_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

let _db = null;
async function getDB() {
  if (!_db) _db = await openDB();
  return _db;
}

export async function loadAndNormalizeSvg(id) {
  // 1. In-memory cache hit
  if (svgCache.has(id)) return svgCache.get(id);

  // 2. IndexedDB cache hit
  const db = await getDB();
  const cached = await idbGet(db, `v${CACHE_VERSION}:${id}`);
  if (cached) {
    svgCache.set(id, cached);
    return cached;
  }

  // 3. Cold load: fetch + normalize + measure
  const raw = await fetch(`/output_shapes/${id}.svg`).then(r => r.text());
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.documentElement;

  const walk = el => {
    if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none")
      el.setAttribute("fill", "currentColor");
    if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none")
      el.setAttribute("stroke", "currentColor");
    for (const c of el.children) walk(c);
  };
  walk(svg);

  const temp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  temp.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.appendChild(svg.cloneNode(true));
  document.body.appendChild(temp);
  const bbox = temp.getBBox();
  document.body.removeChild(temp);

  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  const meta = {
    html: `<g transform="translate(${-cx}, ${-cy})">${svg.innerHTML}</g>`,
    w: bbox.width,
    h: bbox.height,
  };

  // Persist to both caches
  svgCache.set(id, meta);
  await idbSet(db, `v${CACHE_VERSION}:${id}`, meta);

  return meta;
}