// src/utils/csrf.js
// Reads Django's csrftoken cookie (shared across *.bonkverse.io) to echo as a header.
export function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}