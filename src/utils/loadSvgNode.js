// src/utils/loadSvgNode.js
import process from "process";
import fs from "fs";
import path from "path";
import { svgCache } from "./svgCache.js";

// Load shape centers manually (Node-safe, no import assertions)
const centersPath = path.resolve(
  process.cwd(),
  "src/utils/shapeCenters.json"
);

const centers = JSON.parse(
  fs.readFileSync(centersPath, "utf-8")
);

export function loadAndNormalizeSvgNode(id) {
  if (svgCache.has(id)) return;

  const filePath = path.resolve(
    process.cwd(),
    "public/output_shapes",
    `${id}.svg`
  );

  const raw = fs.readFileSync(filePath, "utf-8");

  // Force all fills & strokes to use currentColor
  const normalized = raw
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"');

  const { cx, cy } = centers[id] || { cx: 0, cy: 0 };

  const html = `
    <g transform="translate(${-cx}, ${-cy})">
      ${normalized}
    </g>
  `;

  svgCache.set(id, { html });
}
