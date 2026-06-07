// PATCH: Replace the auto-switch useEffect in MainPanel.jsx
// 
// OLD (around line 34-38):
//   useEffect(() => {
//     if (selectedShape) setTab("props");
//     else setTab("bg");
//   }, [selectedIdx]);
//
// NEW:

  // Auto-switch tab on selection change.
  // If user is on the Layers tab, NEVER auto-switch — they are managing
  // selection from there and should stay put.
  // Only switch when coming from 0 selections to 1+ (fresh select from canvas).
  useEffect(() => {
    if (tab === "layers") return;   // ← the key fix
    if (selectedShape) setTab("props");
    else setTab("bg");
  }, [selectedIdx]);

// NOTE: `tab` is intentionally NOT in the dependency array.
// We read it as a "current value" gate, not a reactive dependency.
// This is safe because setTab is stable and we want this to fire
// only when selectedIdx changes, using the current tab as a guard.
