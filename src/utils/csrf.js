// src/utils/csrf.js
// Reads Django's bv_csrftoken cookie (domain-scoped across *.bonkverse.io) to echo as a header.
export function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)bv_csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}