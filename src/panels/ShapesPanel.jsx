import { TOTAL_BONK_SHAPES } from "../bonk/constants";
import ShapeThumbnail from "../components/ShapeThumbnail";

export default function ShapesPanel({ shapes, ui }) {
  return (
    <>
      <button
        className="dock-btn left"
        onClick={() => ui.setShowShapes(v => !v)}
      >
        Shapes
      </button>

      <div className={`panel panel-left ${ui.showShapes ? "open" : ""}`}>
        <h3>Shapes</h3>

        <div className="shape-grid">
          {Array.from({ length: TOTAL_BONK_SHAPES }, (_, idx) => {
            const id = idx + 1;
            return (
              <div
                key={id}
                className="shape-item"
                onClick={() => shapes.addShape(id)}
              >
                <ShapeThumbnail id={id} />
                <small>{id}</small>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
