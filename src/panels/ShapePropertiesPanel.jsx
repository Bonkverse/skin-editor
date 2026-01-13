import ShapeProperties from "./components/ShapeProperties";

export default function ShapePropertiesPanel({
  selectedIndices,
  shapes,
  updateShape,
  moveShapeUp,
  moveShapeDown,
  setShapes,
  setSelectedIndices,
}) {
  if (selectedIndices.length !== 1) return null;
  return ( 
    selectedIndices.length === 1 && (
            <div className="shape-props-panel open">
              <h3>Shape Properties</h3>
              <ShapeProperties
                shape={shapes[selectedIndices[0]]}
                index={selectedIndices[0]}
                shapes={shapes}
                updateShape={updateShape}
                moveShapeUp={moveShapeUp}
                moveShapeDown={moveShapeDown}
                setShapes={setShapes}
                setSelectedIndices={setSelectedIndices}
              />
            </div>
          )
   );
}
