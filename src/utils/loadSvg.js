import { svgCache } from "./svgCache";

export async function loadAndNormalizeSvg(id) {
  if (svgCache.has(id)) return svgCache.get(id);
  const raw = await fetch(`/output_shapes/${id}.svg`).then((r) => r.text());
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const root = doc.documentElement;

  const walk = (el) => {
    if (el.hasAttribute("fill")) {
      const f = el.getAttribute("fill");
      if (f && f.toLowerCase() !== "none")
        el.setAttribute("fill", "currentColor");
    }
    if (el.hasAttribute("stroke")) {
      const s = el.getAttribute("stroke");
      if (s && s.toLowerCase() !== "none")
        el.setAttribute("stroke", "currentColor");
    }
    if (el.hasAttribute("style")) {
      let style = el.getAttribute("style");
      style = style
        .replace(/fill\s*:\s*(?!none)[^;]+/gi, "fill:currentColor")
        .replace(/stroke\s*:\s*(?!none)[^;]+/gi, "stroke:currentColor");
      el.setAttribute("style", style);
    }
    for (const child of el.children || []) walk(child);
  };
  walk(root);

  let minX = 0,
    minY = 0,
    vbW = 0,
    vbH = 0;
  if (root.hasAttribute("viewBox")) {
    const parts = root
      .getAttribute("viewBox")
      .trim()
      .split(/[ ,]+/)
      .map(parseFloat);
    [minX, minY, vbW, vbH] = parts.length === 4 ? parts : [0, 0, 50, 50];
  } else {
    vbW = parseFloat(root.getAttribute("width")) || 50;
    vbH = parseFloat(root.getAttribute("height")) || 50;
  }

  const cx = minX + vbW / 2;
  const cy = minY + vbH / 2;
  const inner = root.innerHTML;
  const html = `<g transform="translate(${-cx},${-cy})">${inner}</g>`;
  const meta = { html, w: vbW, h: vbH };
  svgCache.set(id, meta);
  return meta;
}