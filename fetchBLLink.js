/**
 * fetchBLLink.js
 *
 * Usage:
 *   node fetchBLLink.js https://bonkleagues.io/s/xoFvjrS
 *
 * Output:
 *   Skin name
 *   Author
 *   Decoded skinCode
 */

import fetch from "node-fetch";
import process from "process";

/* -----------------------------
   Helpers
----------------------------- */

function extractSkinDataFromURL(url) {
  const hash = new URL(url).hash; // "#Skin|Author|ENCODED_SKINCODE"
  if (!hash) return null;

  const fragment = hash.slice(1); // remove "#"
  const parts = fragment.split("|");

  if (parts.length < 3) return null;

  return {
    name: parts[0],
    author: parts[1],
    skinCode:parts[2],
  };
}

function extractRedirectURL(html) {
  const match = html.match(/window\.location\s*=\s*'([^']+)'/);
  return match ? match[1] : null;
}

/* -----------------------------
   Main
----------------------------- */

async function fetchBonkLeaguesSkin(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const html = await res.text();
  const redirectURL = extractRedirectURL(html);

  if (!redirectURL) {
    throw new Error("Could not find redirect URL");
  }

  const skinData = extractSkinDataFromURL(redirectURL);

  if (!skinData) {
    throw new Error("Could not extract skin data");
  }

  return skinData;
}

/* -----------------------------
   CLI entry
----------------------------- */

const inputURL = process.argv[2];

if (!inputURL) {
  console.error("Usage: node fetchBLLink.js <bonkleagues link>");
  process.exit(1);
}

fetchBonkLeaguesSkin(inputURL)
  .then(({ name, author, skinCode }) => {
    console.log("✅ Skin extracted\n");
    console.log("Name:   ", name);
    console.log("Author: ", author);
    console.log("SkinCode:\n", skinCode);
  })
  .catch(err => {
    console.error("❌ Error:", err.message);
  });
