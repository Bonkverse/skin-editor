// src/utils/loadAllSvgs.js
import { loadAndNormalizeSvg } from "./loadSvg";
import { TOTAL_BONK_SHAPES } from "../bonk/constants";

export async function loadAllSvgs() {
  await Promise.all(
    Array.from({ length: TOTAL_BONK_SHAPES }, (_, i) =>
      loadAndNormalizeSvg(i + 1)
    )
  );
}
