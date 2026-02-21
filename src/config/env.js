// src/config/env.js

export const BONKVERSE_BASE_URL =
  import.meta.env.VITE_BONKVERSE_BASE_URL ??
  window.location.origin;
