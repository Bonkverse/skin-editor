// src/components/ToastContainer.jsx
// Renders active toasts. Mount once inside SkinEditorInner.
// Toasts stack bottom-right, newest on top, auto-dismiss.

import { useState, useEffect } from "react";
import { subscribeToasts } from "../utils/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToasts((t) => {
      setToasts((prev) => [t, ...prev].slice(0, 5)); // max 5 visible
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration + 300); // +300 for fade-out
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 999,
      display: "flex",
      flexDirection: "column-reverse",
      gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

function Toast({ toast: t }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => setVisible(true));
    const leaveTimer = setTimeout(() => setLeaving(true), t.duration - 200);
    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(leaveTimer);
    };
  }, [t.duration]);

  const icons = {
    default: "✦",
    info:    "ℹ",
    success: "✓",
    warn:    "⚠",
    error:   "⛔",
  };

  const colors = {
    default: { bg: "rgba(14,22,32,0.95)", border: "rgba(0,255,204,0.3)",  icon: "#00ffcc" },
    info:    { bg: "rgba(14,22,32,0.95)", border: "rgba(100,180,255,0.4)", icon: "#64b4ff" },
    success: { bg: "rgba(14,32,22,0.95)", border: "rgba(0,220,120,0.4)",  icon: "#00dc78" },
    warn:    { bg: "rgba(32,22,14,0.95)", border: "rgba(255,180,50,0.4)",  icon: "#ffb432" },
    error:   { bg: "rgba(32,14,14,0.95)", border: "rgba(255,70,70,0.45)",  icon: "#ff5a5a" },
  };

  const c = colors[t.type] || colors.default;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",       // icon pins to first line on multi-line toasts
      gap: 8,
      padding: "9px 14px",
      borderRadius: 8,
      background: c.bg,
      border: `1px solid ${c.border}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      color: "#ddd",
      fontSize: 13,
      fontFamily: "Arial, sans-serif",
      maxWidth: 340,                  // fixed ceiling — long text wraps instead of widening
      whiteSpace: "normal",          // allow wrapping
      lineHeight: 1.35,              // breathing room between wrapped lines
      overflowWrap: "break-word",    // never overflow on long unbroken tokens
      backdropFilter: "blur(8px)",
      opacity: visible && !leaving ? 1 : 0,
      transform: visible && !leaving ? "translateX(0)" : "translateX(16px)",
      transition: leaving
        ? "opacity 0.25s ease, transform 0.25s ease"
        : "opacity 0.18s ease, transform 0.18s ease",
    }}>
      <span style={{ color: c.icon, fontSize: 12, fontWeight: "bold", flexShrink: 0, marginTop: 1 }}>
        {icons[t.type] || icons.default}
      </span>
      <span style={{ flex: 1 }}>{t.message}</span>
    </div>
  );
}