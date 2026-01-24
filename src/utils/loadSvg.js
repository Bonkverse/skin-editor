// src/utils/loadSvg.js
import { svgCache } from "./svgCache";

export async function loadAndNormalizeSvg(id) {
  if (svgCache.has(id)) return svgCache.get(id);

  const raw = await fetch(`/output_shapes/${id}.svg`).then(r => r.text());
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.documentElement;

  // Force currentColor
  const walk = el => {
    if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none")
      el.setAttribute("fill", "currentColor");
    if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none")
      el.setAttribute("stroke", "currentColor");
    for (const c of el.children) walk(c);
  };
  walk(svg);

  // 🔥 Measure real bounds
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

  const html = `
    <g transform="translate(${-cx}, ${-cy})">
      ${svg.innerHTML}
    </g>
  `;

  const meta = {
    html,
    w: bbox.width,
    h: bbox.height,
  };

  svgCache.set(id, meta);
  return meta;
}
