// src/components/GroupManager.jsx
import React from "react";
import ColorPicker from "./ColorPicker";

export default function GroupManager({
  shapes,
  setShapes,
  selectedIndices,
  setSelectedIndices,
  groups,
  setGroups
}) {
  // Create a new group from currently selected shapes
  function createGroup() {
    if (selectedIndices.length < 2) return alert("Select 2+ shapes to group!");
    const groupId = Date.now();
    setGroups((prev) => [
      ...prev,
      { id: groupId, shapeIndices: [...selectedIndices], color: "#ffffff", scale: 1 }
    ]);
    setSelectedIndices([]); // clear selection
  }

  // Ungroup (remove the group, shapes remain)
  function ungroup(groupId) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  // Apply transformations to all shapes in the group
  function updateGroup(groupId, updates) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const updatedShapes = shapes.map((shape, i) => {
      if (group.shapeIndices.includes(i)) {
        return { ...shape, ...updates };
      }
      return shape;
    });
    setShapes(updatedShapes);
  }

  return (
    <div className="group-panel">
      <h3>Groups ({groups.length})</h3>

      <button className="editor-btn" onClick={createGroup}>
        ➕ Create Group
      </button>

      {groups.map((g) => (
        <div
          key={g.id}
          style={{
            background: "rgba(0,255,200,0.08)",
            borderRadius: "6px",
            padding: "6px",
            marginTop: "6px"
          }}
        >
          <h4>Group #{g.id.toString().slice(-4)}</h4>

          <ColorPicker
            color={g.color}
            onChange={(c) => {
              setGroups((prev) =>
                prev.map((x) => (x.id === g.id ? { ...x, color: c } : x))
              );
              updateGroup(g.id, { color: c });
            }}
          />

          <label>
            Scale:
            <input
              type="number"
              step="0.05"
              defaultValue={g.scale}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGroups((prev) =>
                  prev.map((x) => (x.id === g.id ? { ...x, scale: val } : x))
                );
                updateGroup(g.id, { scale: val });
              }}
            />
          </label>

          <button
            className="delete-btn"
            onClick={() => ungroup(g.id)}
            style={{ marginTop: "6px" }}
          >
            Ungroup
          </button>
        </div>
      ))}
    </div>
  );
}
