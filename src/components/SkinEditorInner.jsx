// src/components/SkinEditorInner.jsx
// Changes:
// - tabRef passed to MainPanel so TopBar's Overlay button can switch tabs
// - Keyboard shortcuts 1/2/3 switch panel tabs
// - O key: enters overlay mode AND switches to overlay tab at once
// - Overlay button in TopBar triggers same compound action

import { useState, useEffect, useRef } from "react";
import { loadAllSvgs } from "../utils/loadAllSvgs.js";
import { BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR } from "../bonk/constants.js";
import { decodeSkinCode } from "../bonk/decode/decodeSkinBrowser";
import { svgCache } from "../utils/svgCache.js";
import { warmRasterCache, getRasterized, clearRasterCache } from "../utils/rasterCache.js";

import TopBar from "../panels/TopBar";
import MainPanel from "../panels/MainPanel";
import ShapePickerModal from "../panels/ShapePickerModal";
import EditorCanvas from "../canvas/EditorCanvas";
import WelcomeModal from "../modals/WelcomeModal";
import ShortcutsModal from "../modals/ShortcutsModal";

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
  const [showPanel, setShowPanel] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Ref to the panel's setTab function — lets us imperatively switch tabs
  // from outside the panel (TopBar, keyboard shortcuts)
  const panelSetTab = useRef(null);

  const bonk = useBonkSerializer(shapes, baseColor, setBaseColor);

  // ── SVG load ───────────────────────────────────────────────────
  useEffect(() => { loadAllSvgs().then(() => setSvgsReady(true)); }, []);

  // ── Skin from URL ──────────────────────────────────────────────
  useEffect(() => {
    if (!svgsReady) return;
    const params = new URLSearchParams(window.location.search);
    const skinCode = params.get("skin");
    if (!skinCode) return;
    try {
      const decoded = decodeSkinCode(skinCode);
      setBaseColor(`#${decoded.bc.toString(16).padStart(6, "0")}`);
      const newShapes = decoded.layers.slice().reverse().map((l) => ({
        id: l.id, scale: l.scale * BONK_SCALE_FACTOR,
        angle: (l.angle * Math.PI) / 180,
        x: l.x * BONK_X_POS_FACTOR, y: l.y * BONK_Y_POS_FACTOR,
        flipX: !!l.flipX, flipY: !!l.flipY,
        color: `#${l.color.toString(16).padStart(6, "0")}`,
      }));
      shapes.commitShapes(newShapes); shapes.clearSelection();
      clearRasterCache(); warmRasterCache(newShapes, svgCache);
      requestAnimationFrame(() => camera.resetCamera());
    } catch (err) { console.error("❌ Failed to load skin from URL", err); }
  }, [svgsReady]);

  // ── Rasterize on shape add ────────────────────────────────────
  useEffect(() => {
    if (!svgsReady) return;
    const s = shapes.shapes[shapes.shapes.length - 1];
    if (!s) return;
    const meta = svgCache.get(s.id);
    if (meta) getRasterized(s.id, s.color, meta);
  }, [shapes.shapes.length, svgsReady]);

  // ── Re-rasterize on color change ──────────────────────────────
  useEffect(() => {
    if (!svgsReady) return;
    shapes.shapes.forEach((s) => { const meta = svgCache.get(s.id); if (meta) getRasterized(s.id, s.color, meta); });
  }, [shapes.shapes.map(s => `${s.id}-${s.color}`).join(","), svgsReady]);

  // ── Keyboard: panel tab switching + shape picker ───────────────
  useEffect(() => {
    function isTyping() {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    }

    function onKeyDown(e) {
      if (isTyping()) return;

      // Shift+Space → shape picker
      if (e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setShowPicker(v => !v);
        return;
      }

      // Number keys 1/2/3 → switch panel tabs
      // 1 = Properties (if shape selected) or Background
      // 2 = Layers
      // 3 = Overlay (if loaded)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          setShowPanel(true);
          const hasShape = shapes.selectedIndices.length > 0;
          panelSetTab.current?.(hasShape ? "props" : "bg");
          return;
        }
        if (e.key === "2") {
          setShowPanel(true);
          panelSetTab.current?.("layers");
          return;
        }
        if (e.key === "3" && overlay.overlay.src) {
          setShowPanel(true);
          panelSetTab.current?.("overlay");
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shapes.selectedIndices, overlay.overlay.src]);

  // ── Overlay activate: enter mode + switch to overlay tab ──────
  // Called when user clicks the Overlay button in TopBar or presses O,
  // and also after drag-drop or file upload loads an image.
  function activateOverlay() {
    if (!overlay.overlay.src) return;
    if (!overlay.overlayMode) overlay.toggleOverlayMode();
    setShowPanel(true);
    panelSetTab.current?.("overlay");
  }

  // Keep canvas._overlayMode in sync so the renderer can read it
  // synchronously each RAF frame without going through React state.
  useEffect(() => {
    const canvas = document.querySelector(".editor-canvas");
    if (canvas) canvas._overlayMode = overlay.overlayMode;
  }, [overlay.overlayMode]);

  return (
    <div className="editor-root">
      <TopBar
        camera={camera} bonk={bonk} shapes={shapes}
        ui={ui} overlay={overlay}
        onOpenPicker={() => setShowPicker(true)}
        onActivateOverlay={activateOverlay}
      />

      <div className="editor-workspace">
        <MainPanel
          shapes={shapes} bonk={bonk} overlay={overlay}
          showPanel={showPanel} setShowPanel={setShowPanel}
          onTabRef={panelSetTab}
        />

        <div className="canvas-area">
          <EditorCanvas
            shapes={shapes} camera={camera}
            overlay={overlay} baseColor={baseColor}
            onActivateOverlay={activateOverlay}
          />
        </div>
      </div>

      <ShapePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onAddShape={(id) => shapes.addShape(id)}
      />

      <WelcomeModal open={ui.showWelcome} onClose={() => ui.setShowWelcome(false)} />
      <ShortcutsModal open={ui.showShortcuts} onClose={() => ui.setShowShortcuts(false)} />
    </div>
  );
}
