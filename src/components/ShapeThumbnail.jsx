import { svgCache } from "../utils/svgCache";

export default function ShapeThumbnail({ id, size = 50, color = "#fff" }) {
  const meta = svgCache.get(id);
  if (!meta) return null;

  const { html, w, h } = meta;
  const scale = (size * 0.85) / Math.max(w, h);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
    >
      <g
        transform={`scale(${scale})`}
        fill="currentColor"
        stroke="currentColor"
        style={{ color }}
      >
        <g dangerouslySetInnerHTML={{ __html: html }} />
      </g>
    </svg>
  );
}
