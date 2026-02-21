import { renderSkinToSVG } from "../render/renderSkinToSVG";
import { encodeSkin } from "../utils/encodeSkin";

export async function publishSkin({
  shapes,
  baseColor,
  skinName,
  creator,
  exportSkinObject,
}) {
  // 1️⃣ Generate SVG
  const svgText = renderSkinToSVG(shapes, baseColor);

  // 2️⃣ Generate Bonk skin JSON
  const skinObject = exportSkinObject();

  // 3️⃣ Encode → skinCode
  // IMPORTANT: you already have encodeSkin on server,
  // but ideally you expose it to client too.
  // For now, assume encodeSkin is available client-side.
  const skinCode = encodeSkin(skinObject);

  // 4️⃣ Build form data
  const fd = new FormData();
  fd.append("skin_name", skinName);
  fd.append("creator", creator);
  fd.append("skin_code", skinCode);

  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  fd.append("svg", svgBlob, "skin.svg");

  // 5️⃣ POST to Bonkverse
  const res = await fetch("/api/publish-skin/", {
    method: "POST",
    credentials: "include", // 🔑 required for login session
    body: fd,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Publish failed");
  }

  return data.skin;
}
