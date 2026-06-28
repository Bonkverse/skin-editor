// src/components/Modal.jsx
import { useEffect } from "react";

export default function Modal({ open, onClose, children, width = 420, closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => closeOnBackdrop && onClose?.()}>
      <div className="modal-content" style={{ width, padding: 22 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}