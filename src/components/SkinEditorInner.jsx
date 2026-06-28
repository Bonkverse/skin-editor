// src/components/SkinEditorInner.jsx
import { useState, useEffect, useRef } from "react";
import { loadAllSvgs } from "../utils/loadAllSvgs.js";
import { BONK_SCALE_FACTOR, BONK_X_POS_FACTOR, BONK_Y_POS_FACTOR } from "../bonk/constants.js";
import { decodeSkinCode } from "../bonk/decode/decodeSkinBrowser";
import { svgCache } from "../utils/svgCache.js";
import { warmRasterCache, getRasterized, clearRasterCache } from "../utils/rasterCache.js";
import { validateSkin, emitLiveToasts } from "../bonk/validateForBonk.js";
import { renderSkinToSVG } from "../render/renderSkinToSVG.js";
import { apiPost } from "../api/bonkverse";

import TopBar from "../panels/TopBar";
import MainPanel from "../panels/MainPanel";
import ShapePickerModal from "../panels/ShapePickerModal";
import EditorCanvas from "../canvas/EditorCanvas";
import WelcomeModal from "../modals/WelcomeModal";
import ToastContainer from "../components/ToastContainer";
import ShortcutsModal from "../modals/ShortcutsModal";
import { ConfirmModal, BonkLoginModal, BonkverseAuthModal, ShareSuccessModal } from "../components/EditorModals";
import { toast } from "../utils/toast";

import { useCamera } from "../hooks/useCamera";
import { useOverlay } from "../hooks/useOverlay";
import { useEditorUI } from "../hooks/useEditorUI";
import { useBonkSerializer } from "../hooks/useBonkSerializer";
import { useShapesEditor } from "../hooks/useShapesEditor";
import { useSkinName } from "../hooks/useSkinName";

export default function SkinEditorInner() {
  const shapes = useShapesEditor();
  const camera = useCamera();
  const overlay = useOverlay();
  const ui = useEditorUI();
  const skinName = useSkinName();

  const [baseColor, setBaseColor] = useState("#ffffff");
  const [svgsReady, setSvgsReady] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const [confirm, setConfirm] = useState(null);        // { title, body, danger, onConfirm }
  const [bonkLogin, setBonkLogin] = useState(null);    // { busy, error } | null
  const [bonkverseAuth, setBonkverseAuth] = useState(null); // "wear" | "publish" | null
  const [shareUrl, setShareUrl] = useState(null);

  const panelSetTab = useRef(null);
  const prevValidation = useRef({ atLimit: false, overLimit: false, tooMany: false, large: 0, off: 0, small: 0 });

  const bonk = useBonkSerializer(shapes, baseColor, setBaseColor);

  useEffect(() => { loadAllSvgs().then(() => setSvgsReady(true)); }, []);

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
      const { counts } = validateSkin(newShapes, svgCache);
      Object.assign(prevValidation.current, counts, {
        atLimit: newShapes.length === 16, overLimit: newShapes.length > 16,
      });
      shapes.commitShapes(newShapes); shapes.clearSelection();
      clearRasterCache(); warmRasterCache(newShapes, svgCache);
      requestAnimationFrame(() => camera.resetCamera());
    } catch (err) { console.error("❌ Failed to load skin from URL", err); }
  }, [svgsReady]);

  useEffect(() => {
    if (!svgsReady) return;
    const s = shapes.shapes[shapes.shapes.length - 1];
    if (!s) return;
    const meta = svgCache.get(s.id);
    if (meta) getRasterized(s.id, s.color, meta);
  }, [shapes.shapes.length, svgsReady]);

  useEffect(() => {
    if (!svgsReady) return;
    shapes.shapes.forEach((s) => { const meta = svgCache.get(s.id); if (meta) getRasterized(s.id, s.color, meta); });
  }, [shapes.shapes.map(s => `${s.id}-${s.color}`).join(","), svgsReady]);

  useEffect(() => {
    if (!svgsReady) return;
    const t = setTimeout(() => {
      const { counts } = validateSkin(shapes.shapes, svgCache);
      emitLiveToasts(shapes.shapes, counts, prevValidation.current);
    }, 400);
    return () => clearTimeout(t);
  }, [shapes.shapes, svgsReady]);

  useEffect(() => {
    function isTyping() {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    }
    function onKeyDown(e) {
      if (isTyping()) return;
      if (e.shiftKey && e.code === "Space") { e.preventDefault(); setShowPicker(v => !v); return; }
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.key === "1") { setShowPanel(true); panelSetTab.current?.(shapes.selectedIndices.length > 0 ? "props" : "bg"); return; }
        if (e.key === "2") { setShowPanel(true); panelSetTab.current?.("layers"); return; }
        if (e.key === "3" && overlay.overlay.src) { setShowPanel(true); panelSetTab.current?.("overlay"); return; }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shapes.selectedIndices, overlay.overlay.src]);

  function activateOverlay() {
    if (!overlay.overlay.src) return;
    if (!overlay.overlayMode) { overlay.toggleOverlayMode(); toast("Overlay mode on", { type: "info", duration: 1400 }); }
    setShowPanel(true);
    panelSetTab.current?.("overlay");
  }

  useEffect(() => {
    const canvas = document.querySelector(".editor-canvas");
    if (canvas) canvas._overlayMode = overlay.overlayMode;
  }, [overlay.overlayMode]);

  // ── Wear / Publish ────────────────────────────────────────────
  const ISSUE_BODY =
    "Some shapes will break in bonk (reset to 0.25, moved to origin, or the whole skin dropped if over 16 layers).";

  async function doWear() {
    const body = new URLSearchParams({ skin_code: bonk.buildSkinCode() });
    const data = await apiPost("/api/skins/wear-code/", body, {
      onAuth: (kind) => { kind === "bonk" ? setBonkLogin({ busy: false, error: null }) : setBonkverseAuth("wear"); },
    });
    if (data.handled) return;
    if (data.networkError) { toast("Network error — try again", { type: "error", duration: 3500 }); return; }
    if (data.ok) toast(`Skin applied to slot ${data.slot}`, { type: "success", duration: 2600 });
    else toast(`Couldn't wear skin: ${data.error || "unknown"}`, { type: "error", duration: 3500 });
  }

  async function submitBonkLogin(u, p) {
    setBonkLogin({ busy: true, error: null });
    const body = new URLSearchParams({ bonk_username: u, bonk_password: p });
    const data = await apiPost("/api/bonk/login/", body, {
      onAuth: () => { setBonkLogin(null); setBonkverseAuth("wear"); },
    });
    if (data.handled) return;
    if (data.ok) { setBonkLogin(null); doWear(); }
    else setBonkLogin({ busy: false, error: data.error === "login_failed" ? "Wrong username or password." : (data.error || "Login failed.") });
  }

  function onWearClick() {
    const { ok } = bonk.validate();
    if (!ok) { setConfirm({ title: "Wear anyway?", body: ISSUE_BODY, danger: true, onConfirm: () => { setConfirm(null); doWear(); } }); return; }
    doWear();
  }

  async function doPublish() {
    const fd = new FormData();
    fd.append("skin_name", skinName.resolved());
    fd.append("skin_code", bonk.buildSkinCode());
    fd.append("svg", new Blob([renderSkinToSVG(shapes.shapes, bonk.baseColor)], { type: "image/svg+xml" }), "skin.svg");
    const data = await apiPost("/api/publish-skin/", fd, { onAuth: () => setBonkverseAuth("publish") });
    if (data.handled) return;
    if (data.networkError) { toast("Network error — try again", { type: "error", duration: 3500 }); return; }
    if (!data.success) { toast(data.error || "Publish failed", { type: "error", duration: 3500 }); return; }
    setShareUrl(data.skin.share_url);
    toast("Skin published", { type: "success", duration: 2600 });
  }

  function onPublishClick() {
    if (!skinName.isValid()) {
      toast("Skin name can only use letters, numbers, spaces, and underscores", { type: "warn", duration: 3500 });
      return;
    }
    const { ok } = bonk.validate();
    if (!ok) { setConfirm({ title: "Publish anyway?", body: ISSUE_BODY, danger: true, onConfirm: () => { setConfirm(null); doPublish(); } }); return; }
    doPublish();
  }

  return (
    <div className="editor-root">
      <TopBar
        camera={camera} bonk={bonk} shapes={shapes} ui={ui} overlay={overlay}
        skinName={skinName}
        onOpenPicker={() => setShowPicker(true)}
        onActivateOverlay={activateOverlay}
        onWearClick={onWearClick}
        onPublishClick={onPublishClick}
      />

      <div className="editor-workspace">
        <MainPanel shapes={shapes} bonk={bonk} overlay={overlay}
          showPanel={showPanel} setShowPanel={setShowPanel} onTabRef={panelSetTab} />
        <div className="canvas-area">
          <EditorCanvas shapes={shapes} camera={camera} overlay={overlay} baseColor={baseColor} onActivateOverlay={activateOverlay} />
        </div>
      </div>

      <ShapePickerModal open={showPicker} onClose={() => setShowPicker(false)} onAddShape={(id) => shapes.addShape(id)} />
      <WelcomeModal open={ui.showWelcome} onClose={() => ui.setShowWelcome(false)} />
      <ShortcutsModal open={ui.showShortcuts} onClose={() => ui.setShowShortcuts(false)} />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title} body={confirm?.body} danger={confirm?.danger}
        confirmLabel={confirm?.title?.startsWith("Publish") ? "Publish" : "Wear"}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}
      />
      <BonkLoginModal open={!!bonkLogin} busy={bonkLogin?.busy} error={bonkLogin?.error}
        onSubmit={submitBonkLogin} onClose={() => setBonkLogin(null)} />
      <BonkverseAuthModal open={!!bonkverseAuth} action={bonkverseAuth} onClose={() => setBonkverseAuth(null)} />
      <ShareSuccessModal open={!!shareUrl} url={shareUrl} onClose={() => setShareUrl(null)} />

      <ToastContainer />
    </div>
  );
}