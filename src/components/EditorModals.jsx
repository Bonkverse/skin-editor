// src/components/EditorModals.jsx
import { useState } from "react";
import Modal from "./Modal";
import { BONKVERSE_BASE_URL } from "../config/env";

export function ConfirmModal({ open, title, body, confirmLabel = "Continue", danger, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} width={440}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#cfd6dd", margin: "0 0 22px" }}>{body}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="tb-btn" style={{ padding: "7px 16px" }} onClick={onCancel}>Cancel</button>
        <button className="close-btn" style={{ margin: 0, padding: "8px 20px", background: danger ? "#ff5a5a" : "var(--accent)" }}
          onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function BonkLoginModal({ open, busy, error, onSubmit, onClose }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} width={400}>
      <h2 style={{ marginBottom: 6 }}>Connect bonk.io</h2>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
        One-time sign-in so Bonkverse can apply skins to your account. Saved for 14 days.
      </p>
      <label className="cp-label" style={{ display: "block", marginBottom: 4 }}>Username</label>
      <input className="neon-input" style={{ marginBottom: 10 }} value={u}
        onChange={(e) => setU(e.target.value)} autoFocus disabled={busy} />
      <label className="cp-label" style={{ display: "block", marginBottom: 4 }}>Password</label>
      <input className="neon-input" type="password" style={{ marginBottom: 8 }} value={p}
        onChange={(e) => setP(e.target.value)} disabled={busy}
        onKeyDown={(e) => { if (e.key === "Enter" && u && p && !busy) onSubmit(u, p); }} />
      {error && <p style={{ color: "#ff7a7a", fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="tb-btn" style={{ padding: "7px 16px" }} onClick={onClose} disabled={busy}>Cancel</button>
        <button className="close-btn" style={{ margin: 0, padding: "8px 20px" }}
          onClick={() => onSubmit(u, p)} disabled={!u || !p || busy}>
          {busy ? "Connecting…" : "Connect & Wear"}
        </button>
      </div>
    </Modal>
  );
}

export function BonkverseAuthModal({ open, action, onClose }) {
  return (
    <Modal open={open} onClose={onClose} width={400}>
      <h2 style={{ marginBottom: 8 }}>Signed out</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: "0 0 18px" }}>
        You've been signed out of Bonkverse. Sign back in to {action || "continue"} — your skin stays right here.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="tb-btn" style={{ padding: "7px 16px" }} onClick={onClose}>Cancel</button>
        <button className="close-btn" style={{ margin: 0, padding: "8px 20px" }}
          onClick={() => window.open(`${BONKVERSE_BASE_URL}/login/`, "_blank", "noopener,noreferrer")}>
          Sign in
        </button>
      </div>
    </Modal>
  );
}

export function ShareSuccessModal({ open, url, onClose }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal open={open} onClose={onClose} width={460}>
      <h2 style={{ marginBottom: 10 }}>Skin published 🎉</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>Anyone with this link can view and use it:</p>
      <div className="cp-hex-wrap" style={{ marginBottom: 16 }}>
        <input className="cp-input" readOnly value={url || ""} style={{ padding: 8 }} onFocus={(e) => e.target.select()} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="tb-btn" style={{ padding: "7px 16px" }}
          onClick={() => { navigator.clipboard?.writeText(url || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <button className="close-btn" style={{ margin: 0, padding: "8px 20px" }}
          onClick={() => { window.open(url, "_blank", "noopener,noreferrer"); onClose(); }}>Open</button>
      </div>
    </Modal>
  );
}