// src/auth/requireAuth.js
import { BONKVERSE_BASE_URL } from "../config/env";

export async function requireBonkverseAuth() {
  const res = await fetch(`${BONKVERSE_BASE_URL}/api/me/`, {
    credentials: "include",
  });

  if (!res.ok) {
    window.location.href =
      `${BONKVERSE_BASE_URL}/login/?next=` +
      encodeURIComponent(window.location.href);
    return null;
  }

  return await res.json();
}
