import { svgCache } from "./svgCache";

export function getShapePath(id) {
  return svgCache.get(id); // raw <path> or <g>
}
