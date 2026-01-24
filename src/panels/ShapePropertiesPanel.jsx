import ShapeProperties from "../components/ShapeProperties";

export default function ShapePropertiesPanel({ shapes }) {
  const { selectedIndices, shapes: shapeList } = shapes;

  // Only show when exactly one shape is selected
  if (selectedIndices.length !== 1) return null;

  const index = selectedIndices[0];
  const shape = shapeList[index];

  if (!shape) return null;

  return (
    <div className="shape-props-panel open">
      <h3>Shape Properties</h3>
      <ShapeProperties
        shape={shape}
        index={index}
        shapes={shapeList}
        updateShape={shapes.updateShape}
        moveShapeUp={shapes.moveShapeUp}
        moveShapeDown={shapes.moveShapeDown}
        setShapes={shapes.setShapes}
        setSelectedIndices={shapes.setSelectedIndices}
      />
    </div>
  );
}
