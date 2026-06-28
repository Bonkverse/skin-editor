// src/hooks/useSkinName.js
import { useState } from "react";

const SKIN_NAME_RE = /^[A-Za-z0-9 _]+$/; // mirrors server SKIN_NAME_PATTERN

export function useSkinName(initial = "Untitled Skin") {
  const [name, setName] = useState(initial);
  const [editing, setEditing] = useState(false);
  const resolved = () => (name.trim() || "Untitled Skin");
  const isValid = () => SKIN_NAME_RE.test(resolved());
  return { name, setName, editing, setEditing, resolved, isValid };
}