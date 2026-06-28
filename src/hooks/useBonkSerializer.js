// src/hooks/useBonkSerializer.js
import {
  BONK_SCALE_FACTOR,
  BONK_X_POS_FACTOR,
  BONK_Y_POS_FACTOR,
} from "../bonk/constants";
import { svgCache } from "../utils/svgCache";
import { validateSkin, warnBeforeBonk } from "../bonk/validateForBonk";
import { encodeSkin } from "../utils/encodeSkin";
import { toast } from "../utils/toast";

/**
 * Bonk skin import / export system
 * Depends on: shapes system, baseColor state
 */
export function useBonkSerializer(shapes, baseColor, setBaseColor) {
  // Editor shapes (top→bottom) → bonk layers (bottom→top).
  // Single source of truth so export / JSON / validation never diverge.
  function buildBonkLayers() {
    return [...shapes.shapes].reverse().map((s) => ({
      id: s.id,
      scale: +(s.scale / BONK_SCALE_FACTOR).toFixed(6),
      angle: +((s.angle * 180) / Math.PI).toFixed(6), // radians → degrees
      x: +(s.x / BONK_X_POS_FACTOR).toFixed(6),
      y: +(s.y / BONK_Y_POS_FACTOR).toFixed(6),
      flipX: !!s.flipX,
      flipY: !!s.flipY,
      color: parseInt(s.color.replace("#", ""), 16),
    }));
  }

  function buildSkinObject() {
    return {
      bc: parseInt(baseColor.replace("#", ""), 16),
      layers: buildBonkLayers(),
    };
  }

  /** Pure — safe to call anywhere, no side effects. */
  function exportSkinObject() {
    return buildSkinObject();
  }

  /**
   * Bonk skin code (percent-encoded base64) — the string bonk's avatar
   * endpoint and your publish endpoint both expect. Shared by Wear + Publish
   * so they never encode differently.
   */
  function buildSkinCode() {
    return encodeSkin(buildSkinObject());
  }

  /** Pure validation report (no toast) — editor shapes + svgCache. */
  function validate() {
    return validateSkin(shapes.shapes, svgCache);
  }

  /**
   * Validates + fires ONE summary toast. Call from Wear / Publish handlers.
   * Returns `ok` (false only on destructive issues: errors or >16 layers).
   */
  function checkBeforeBonk() {
    return warnBeforeBonk(shapes.shapes, svgCache);
  }

  /** EXPORT to a downloaded .json file. */
  function exportJSON() {
    const out = buildSkinObject();
    const blob = new Blob([JSON.stringify(out, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bonk-skin.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Skin exported", { type: "success", duration: 2200 });
  }

  /** IMPORT from a .json file (bonk-space → editor-space). */
  function importJSON(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);

        setBaseColor(`#${parsed.bc.toString(16).padStart(6, "0")}`);

        const newShapes = parsed.layers
          .slice()
          .reverse()
          .map((l) => ({
            id: l.id,
            scale: parseFloat(l.scale) * BONK_SCALE_FACTOR,
            angle: (parseFloat(l.angle) * Math.PI) / 180,
            x: parseFloat(l.x) * BONK_X_POS_FACTOR,
            y: parseFloat(l.y) * BONK_Y_POS_FACTOR,
            flipX: !!l.flipX,
            flipY: !!l.flipY,
            color: `#${l.color.toString(16).padStart(6, "0")}`,
          }));

        shapes.commitShapes(newShapes);
        shapes.clearSelection();
        toast("Skin imported", { type: "success", duration: 2200 });
      } catch (err) {
        console.error("Import failed", err);
        toast("Couldn't read that file — is it a valid skin JSON?", { type: "error", duration: 3500 });
      }
    };

    reader.readAsText(file);
  }

  return {
    baseColor,
    setBaseColor,
    exportJSON,
    importJSON,
    exportSkinObject, // pure
    buildSkinCode,    // bonk skin code → Wear/Publish
    validate,         // pure report → for custom UI
    checkBeforeBonk,  // validates + toasts → for Wear/Publish
  };
}