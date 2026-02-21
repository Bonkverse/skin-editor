import { useState } from "react";

export default function SkinRenderTest() {
  const [skinCode, setSkinCode] = useState("");
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function renderSkin() {
    setLoading(true);
    setImgUrl(null);

    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skinCode, size: 512 }),
    });

    if (!res.ok) {
      alert("Render failed");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setImgUrl(url);
    setLoading(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Skin Code → Image Test</h2>

      <textarea
        rows={4}
        style={{ width: "100%" }}
        placeholder="Paste Bonk skin code here"
        value={skinCode}
        onChange={(e) => setSkinCode(e.target.value)}
      />

      <button onClick={renderSkin} disabled={loading}>
        {loading ? "Rendering..." : "Render"}
      </button>

      {imgUrl && (
        <div style={{ marginTop: 16 }}>
          <img src={imgUrl} width={256} height={256} />
          <br />
          <a href={imgUrl} download="bonk-skin.png">
            Download PNG
          </a>
        </div>
      )}
    </div>
  );
}
