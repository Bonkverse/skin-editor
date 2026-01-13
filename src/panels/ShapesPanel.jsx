import {TOTAL_BONK_SHAPES} from "../bonk/constants.js";

export default function ShapesPanel({ showShapes, addShape }) {
  return ( 
    <div className={`panel panel-left ${showShapes ? "open" : ""}`}>
        <h3>Shapes</h3>
        <div className="shape-grid">
          {Array.from({ length: TOTAL_BONK_SHAPES }, (_, idx) => {
            const id = idx + 1;
            return (
              <div key={id} className="shape-item" onClick={() => addShape(id)}>
                <img src={`/output_shapes/${id}.svg`} alt={`Shape ${id}`} />
                <small>{id}</small>
              </div>
            );
          })}
        </div>
      </div>
   );
}