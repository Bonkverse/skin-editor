import { useState, useEffect } from "react";
import { loadAndNormalizeSvg } from "./utils/loadSvg";
import { TOTAL_BONK_SHAPES } from "./bonk/constants";


// Layout components
import EditorShell from "./layout/EditorShell";
import EditorCanvas from "./canvas/EditorCanvas";
import ShapesPanel from "./panels/ShapesPanel";
import LayersPanel from "./panels/LayersPanel";
import ToolsBar from "./panels/ToolsBar";
import WelcomeModal from "./modals/WelcomeModal";

// Custom hooks
import { useCamera } from "./hooks/useCamera";
import { useOverlay } from "./hooks/useOverlay";
import { useEditorUI } from "./hooks/useEditorUI";
import { useBonkSerializer } from "./hooks/useBonkSerializer";
import { useShapesEditor } from "./hooks/useShapesEditor";
import ShapePropertiesPanel from "./panels/ShapePropertiesPanel";


export default function SkinEditor() {

  const shapes = useShapesEditor();
  const camera = useCamera();
  const overlay = useOverlay();
  const ui = useEditorUI();
  const [baseColor, setBaseColor] = useState("#ffffff");

  const bonk = useBonkSerializer(
    shapes,
    baseColor,
    setBaseColor
  );

  useEffect(() => {
    (async () => {
      for (let i = 1; i <= TOTAL_BONK_SHAPES; i++) {
        await loadAndNormalizeSvg(i);
      }
      console.log("✅ SVG cache loaded");
    })();
  }, []);

  // 4. RENDER
  return (
    <EditorShell showShapes={ui.showShapes} showLayers={ui.showLayers}>
      <EditorCanvas
        shapes={shapes}
        camera={camera}
        overlay={overlay}
        baseColor={baseColor}
      />
      <ToolsBar ui={ui} shapes={shapes} bonk={bonk} camera={camera} />
      <ShapesPanel shapes={shapes} ui={ui}/>
      <LayersPanel shapes={shapes} ui={ui} />
      <ShapePropertiesPanel shapes={shapes}/>
      <WelcomeModal ui={ui} />
    </EditorShell>
  );
}
