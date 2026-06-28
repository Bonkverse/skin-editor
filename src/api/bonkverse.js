// src/api/bonkverse.js
// One credentialed POST helper. Sends CSRF, includes cookies, and routes the
// two distinct 401s (auth="bonkverse" | "bonk") to a caller-supplied handler.
import { BONKVERSE_BASE_URL } from "../config/env";
import { getCsrfToken } from "../utils/csrf";

export async function apiPost(path, body, { onAuth } = {}) {
  const headers = { "X-CSRFToken": getCsrfToken() };
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/x-www-form-urlencoded";

  let res;
  try {
    res = await fetch(`${BONKVERSE_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });
  } catch {
    return { ok: false, networkError: true };
  }

  if (res.status === 401) {
    const d = await res.json().catch(() => ({}));
    // Only treat as an auth-gate failure when the server tagged it. A 401 with
    // no `auth` (e.g. wrong bonk password) flows back to the caller as data.
    if (d.auth) { onAuth?.(d.auth); return { ok: false, handled: true }; }
    return d;
  }

  return res.json().catch(() => ({ ok: false }));
}