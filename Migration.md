# Canvas Migration Guide

## What Changed and Why

### The Core Problem
The old editor used an `<svg>` tag as the canvas. Every shape was a `<g>` DOM element
inside it. On every `mousemove` during a drag, React re-rendered → SVG DOM updated →
browser recalculated layout/style for every shape. This caused the lag you felt.

### The Fix
A single `<canvas>` element with a `requestAnimationFrame` draw loop.
React still owns all state (shapes, camera, selection) — it just no longer drives
the visual output directly. The RAF loop reads from refs and redraws each frame.

---

## Files to ADD (new files)

```
src/utils/rasterCache.js          ← SVG → OffscreenCanvas bitmap cache
src/canvas/drawShape.js           ← draws one shape onto ctx
src/canvas/drawSelectionOverlay.js ← draws bounding box + handle onto ctx
src/canvas/hitTest.js             ← manual click detection (replaces DOM events)
src/hooks/useCanvasRenderer.js    ← the RAF draw loop
src/hooks/useCanvasInteraction.js ← mouse event handling
```

## Files to REPLACE

| Old file | New file | What changed |
|---|---|---|
| `src/canvas/EditorCanvas.jsx` | new `EditorCanvas.jsx` | `<svg>` → `<canvas>`, wires new hooks |
| `src/hooks/useCanvasCameraControls.js` | new version | `svgRef` → `canvasRef` (zoom math unchanged) |
| `src/components/SkinEditorInner.jsx` | new version | warms raster cache after SVG load + skin import |

## Files to DELETE (no longer needed)

```
src/canvas/Shape.jsx              ← replaced by drawShape.js
src/canvas/SelectionOverlay.jsx   ← replaced by drawSelectionOverlay.js
src/canvas/shapeDrag.js           ← replaced by useCanvasInteraction.js
```

---

## Step-by-Step

### Step 1 — Add the new utility files
Copy these into your project:
- `src/utils/rasterCache.js`
- `src/canvas/drawShape.js`
- `src/canvas/drawSelectionOverlay.js`
- `src/canvas/hitTest.js`

### Step 2 — Add the new hooks
Copy these into your project:
- `src/hooks/useCanvasRenderer.js`
- `src/hooks/useCanvasInteraction.js`

### Step 3 — Replace the camera controls hook
Replace `src/hooks/useCanvasCameraControls.js` with the new version.
The only change is `svgRef` → `canvasRef` in the parameter name and
`svg.addEventListener` → `canvas.addEventListener`. Zoom math is identical.

### Step 4 — Replace EditorCanvas
Replace `src/canvas/EditorCanvas.jsx` with the new version.
The `<svg>` tag is now a `<canvas>` tag. The three new hooks are wired up here.

### Step 5 — Replace SkinEditorInner
Replace `src/components/SkinEditorInner.jsx` with the new version.
The additions are:
- Import `warmRasterCache`, `getRasterized`, `clearRasterCache` from rasterCache
- `useEffect` to warm cache after URL skin load
- `useEffect` to rasterize newly added shapes
- `useEffect` to re-rasterize on color change

### Step 6 — Update CSS
In `index.css`, if you have any styles targeting `.editor-canvas` as an SVG,
update them. The canvas element uses the same class name so most styles carry over.
One thing to check: SVG-specific properties like `overflow: visible` don't apply
to canvas. Remove those.

### Step 7 — Delete old files
Once everything works, delete:
- `src/canvas/Shape.jsx`
- `src/canvas/SelectionOverlay.jsx`
- `src/canvas/shapeDrag.js`

---

## How Color Changes Work Now

In the old system, color was a CSS `currentColor` on an SVG element —
instant, free. In the new system, each unique (shapeId, color) combo needs
its own pre-rasterized bitmap.

**The flow:**
1. User picks a new color in ColorPicker
2. `updateShape(index, { color: newColor })` is called (unchanged)
3. The `useEffect` in SkinEditorInner watches shape colors and calls
   `getRasterized(id, newColor, meta)` — this is async but fast (~1-5ms)
4. Until the new bitmap is ready, `getRasterizedSync()` returns null
   and the shape is simply not drawn for that frame (invisible for <1 frame)
5. Once cached, every subsequent frame uses `drawImage()` from the bitmap

This means color changes feel instant in practice. The brief "blink" during
the async rasterization is imperceptible.

**For live color picker dragging** (onPreview), the same thing happens on
each preview update. Since the picker fires events at ~60fps and rasterization
takes ~1-5ms, you may occasionally see the shape flicker between the previous
color and the new one. This is acceptable and matches how Canva behaves.

If you want smoother live color previews, you can add a small debounce
(~50ms) to the rasterize call during preview, and only commit + rasterize
on the final onCommit event.

---

## What Did NOT Change

- `useShapesEditor.js` — completely unchanged
- `useCamera.js` — completely unchanged
- `useEditorUI.js` — completely unchanged
- `useBonkSerializer.js` — completely unchanged
- `useOverlay.js` — completely unchanged
- All panels: `ShapesPanel`, `LayersPanel`, `ShapePropertiesPanel`, `ToolsBar`
- All modals: `WelcomeModal`, `ShortcutsModal`
- `EditorShell.jsx`
- `screenToWorld.js`
- `svgCache.js`

The state architecture is identical. Only the rendering layer changed.

---

## Troubleshooting

**Shapes not appearing:**
- Check that `loadAllSvgs()` completes before any shapes are drawn
- Check that `warmRasterCache()` was called after skin import
- Open DevTools console — rasterization errors will show there

**Shapes appear in wrong position:**
- The coordinate system is identical to the SVG version (centered at 0,0)
- Check `screenToWorld.js` is unchanged

**Handle not responding to clicks:**
- `isOnHandle()` in `drawSelectionOverlay.js` uses `HANDLE_RADIUS / zoom`
  as the hit radius. If zoom is very high, the hit area may be tiny.
  Increase `HANDLE_RADIUS` constant if needed.

**Canvas looks blurry:**
- The `resizeCanvas()` function in `useCanvasRenderer.js` multiplies by
  `window.devicePixelRatio`. If this isn't working, the canvas pixel size
  won't match the CSS display size. Check that `canvas.offsetWidth` returns
  the correct value (it should, since the canvas is `width: 100vw`).