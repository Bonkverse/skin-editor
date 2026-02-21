import { useState, useEffect } from "react";
import { loadAndNormalizeSvg } from "../utils/loadSvg";
import { TOTAL_BONK_SHAPES } from "../bonk/constants";
import { BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR } from "../bonk/constants.js";
import { decodeSkinCode } from "../bonk/decode/decodeSkinBrowser";

// Layout components
import EditorShell from "../layout/EditorShell";
import ShapesPanel from "../panels/ShapesPanel";
import EditorCanvas from "../canvas/EditorCanvas";
import LayersPanel from "../panels/LayersPanel";
import ToolsBar from "../panels/ToolsBar";
import WelcomeModal from "../modals/WelcomeModal";
import ShapePropertiesPanel from "../panels/ShapePropertiesPanel";

// Hooks
import { useCamera } from "../hooks/useCamera";
import { useOverlay } from "../hooks/useOverlay";
import { useEditorUI } from "../hooks/useEditorUI";
import { useBonkSerializer } from "../hooks/useBonkSerializer";
import { useShapesEditor } from "../hooks/useShapesEditor";

export default function SkinEditorInner() {

  const shapes = useShapesEditor();
  const camera = useCamera();
  const overlay = useOverlay();
  const ui = useEditorUI();

  const [baseColor, setBaseColor] = useState("#ffffff");
  const [svgsReady, setSvgsReady] = useState(false);

  const bonk = useBonkSerializer(shapes, baseColor, setBaseColor);

  /* --------------------------------------------
   * 1️⃣ Load SVGs FIRST
   * ------------------------------------------ */
  useEffect(() => {
    (async () => {
      for (let i = 1; i <= TOTAL_BONK_SHAPES; i++) {
        await loadAndNormalizeSvg(i);
      }
      console.log("✅ SVG cache loaded");
      setSvgsReady(true);
    })();
  }, []);

  /* --------------------------------------------
   * 2️⃣ Load skin from URL AFTER SVGs are ready
   * ------------------------------------------ */
  useEffect(() => {
    if (!svgsReady) return;

    const params = new URLSearchParams(window.location.search);
    const skinCode = params.get("skin");
    if (!skinCode) return;

    try {
      const decoded = decodeSkinCode(skinCode);

      setBaseColor(`#${decoded.bc.toString(16).padStart(6, "0")}`);

      const newShapes = decoded.layers
        .slice()
        .reverse()
        .map((l) => ({
          id: l.id,
          scale: l.scale * BONK_SCALE_FACTOR,
          angle: (l.angle * Math.PI) / 180,
          x: l.x * BONK_X_POS_FACTOR,
          y: l.y * BONK_Y_POS_FACTOR,
          flipX: !!l.flipX,
          flipY: !!l.flipY,
          color: `#${l.color.toString(16).padStart(6, "0")}`,
        }));

      shapes.commitShapes(newShapes);
      shapes.clearSelection();

      // 🔑 Force canvas redraw once everything exists
      requestAnimationFrame(() => {
        camera.resetCamera();
      });

    } catch (err) {
      console.error("❌ Failed to load skin from URL", err);
    }
  }, [svgsReady]);

  /* --------------------------------------------
   * 3️⃣ Render
   * ------------------------------------------ */
  return (
    <EditorShell showShapes={ui.showShapes} showLayers={ui.showLayers}>
      <EditorCanvas
        shapes={shapes}
        camera={camera}
        overlay={overlay}
        baseColor={baseColor}
      />
      <ToolsBar ui={ui} shapes={shapes} bonk={bonk} camera={camera} />
      <ShapesPanel shapes={shapes} ui={ui} />
      <LayersPanel shapes={shapes} ui={ui} />
      <ShapePropertiesPanel shapes={shapes} />
      <WelcomeModal ui={ui} />
    </EditorShell>
  );
}
