import { svgCache } from "../utils/svgCache";
import { startShapeDrag } from "./shapeDrag";

export default function Shape({ s, i, shapes, camera }) {
  const meta = svgCache.get(s.id);
  if (!meta || s.hidden) return null;

  const { html, w, h} = meta;

  return (
    <g
      data-shape
      transform={`
        translate(${s.x}, ${s.y})
        rotate(${(s.angle * 180) / Math.PI})
        scale(${s.scale})
        scale(${s.flipX ? -1 : 1}, ${s.flipY ? -1 : 1})
      `}
    >
      {/* 🔹 INVISIBLE HIT AREA */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill="transparent"
        pointerEvents="all"
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (s.locked) return;
          shapes.setSelectedIndices([i]);
          startShapeDrag(e, s, i, shapes, camera);
        }}
      />

      {/* 🎨 Visual SVG (non-interactive) */}
      <g
        // transform={`translate(${-cx}, ${-cy})`}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          pointerEvents: "none",
          color: s.color,
          opacity: s.hidden ? 0.4 : 1,
        }}
      />
    </g>
  );
}
