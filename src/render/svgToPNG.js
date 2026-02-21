// svgToPNG.js
export async function svgToPNG(svg, size = 512) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  canvas.getContext("2d").drawImage(img, 0, 0, size, size);

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}
