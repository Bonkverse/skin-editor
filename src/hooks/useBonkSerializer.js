// src/bonk/useBonkSerializer.js
import {
  CANVAS_SIZE,
  BONK_SCALE_FACTOR,
  BONK_X_POS_FACTOR,
  BONK_Y_POS_FACTOR,
} from "../bonk/constants";

/**
 * Bonk skin import / export system
 * Depends on:
 *  - shapes system
 *  - baseColor state
 */
export function useBonkSerializer(shapes, baseColor, setBaseColor) {
  /**
   * EXPORT
   */
  function exportJSON() {
    const out = {
      bc: parseInt(baseColor.replace("#", ""), 16),
      layers: [...shapes.shapes]
        .reverse()
        .map((s) => ({
          id: s.id,
          scale: +(s.scale / BONK_SCALE_FACTOR).toFixed(6),
          angle: +s.angle.toFixed(6),
          x: +((s.x - CANVAS_SIZE / 2) / BONK_X_POS_FACTOR).toFixed(6),
          y: +((s.y - CANVAS_SIZE / 2) / BONK_Y_POS_FACTOR).toFixed(6),
          flipX: !!s.flipX,
          flipY: !!s.flipY,
          color: parseInt(s.color.replace("#", ""), 16),
        })),
    };

    const blob = new Blob([JSON.stringify(out, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bonk-skin.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * IMPORT
   */
  function importJSON(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = JSON.parse(evt.target.result);

      // base color
      setBaseColor(
        `#${parsed.bc.toString(16).padStart(6, "0")}`
      );

      const newShapes = parsed.layers
        .slice()
        .reverse()
        .map((l) => ({
          id: l.id,
          scale: parseFloat(l.scale) * BONK_SCALE_FACTOR,
          angle: parseFloat(l.angle),
          x: parseFloat(l.x) * BONK_X_POS_FACTOR + CANVAS_SIZE / 2,
          y: parseFloat(l.y) * BONK_Y_POS_FACTOR + CANVAS_SIZE / 2,
          flipX: !!l.flipX,
          flipY: !!l.flipY,
          color: `#${l.color.toString(16).padStart(6, "0")}`,
        }));

      shapes.commitShapes(newShapes);
      shapes.clearSelection();
    };

    reader.readAsText(file);
  }

  return {
    exportJSON,
    importJSON,
  };
}
