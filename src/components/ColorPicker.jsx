// import React, { useState, useEffect, useRef } from "react";
// import { HexColorPicker } from "react-colorful";
// import "./ColorPicker.css";

// export default function ColorPicker({ color, onChange, disabled }) {
//   const [hex, setHex] = useState(color);
//   const [rgb, setRgb] = useState(hexToRgb(color));

//   // Track last prop color to avoid loops
//   const lastColorRef = useRef(color);

//   useEffect(() => {
//     if (color !== lastColorRef.current) {
//       lastColorRef.current = color;
//       setHex(color);
//       setRgb(hexToRgb(color));
//     }
//   }, [color]);

//   function hexToRgb(hex) {
//     const bigint = parseInt(hex.replace("#", ""), 16);
//     return {
//       r: (bigint >> 16) & 255,
//       g: (bigint >> 8) & 255,
//       b: bigint & 255,
//     };
//   }

//   function rgbToHex(r, g, b) {
//     return (
//       "#" +
//       [r, g, b]
//         .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
//         .join("")
//     );
//   }

//   function commitColor(newHex) {
//     if (newHex !== lastColorRef.current) {
//       lastColorRef.current = newHex;
//       onChange(newHex);
//     }
//   }

//   function handleRgbChange(component, value) {
//     const newRgb = { ...rgb, [component]: parseInt(value) || 0 };
//     setRgb(newRgb);
//     const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
//     setHex(newHex);
//     commitColor(newHex);
//   }

//   function handleHexChange(value) {
//     const formatted = value.startsWith("#") ? value : "#" + value;
//     setHex(formatted);
//     if (formatted.length === 7) commitColor(formatted);
//   }

//   return (
//     <div className="color-picker-wrapper">
//       <HexColorPicker
//         color={hex}
//         onChange={(val) => {
//           setHex(val);
//           setRgb(hexToRgb(val));
//           commitColor(val);
//         }}
//         disabled={disabled}
//       />

//       <div className="color-inputs">
//         <div className="color-row">
//           <div>
//             <label>Hex</label>
//             <input
//               value={hex.replace("#", "").toUpperCase()}
//               maxLength={6}
//               disabled={disabled}
//               onChange={(e) => handleHexChange(e.target.value)}
//             />
//           </div>
//           {["r", "g", "b"].map((c) => (
//             <div key={c}>
//               <label>{c.toUpperCase()}</label>
//               <input
//                 type="number"
//                 min={0}
//                 max={255}
//                 value={rgb[c]}
//                 disabled={disabled}
//                 onChange={(e) => handleRgbChange(c, e.target.value)}
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import "./ColorPicker.css";

export default function ColorPicker({
  color,
  onPreview, // 🔥 throttled preview (commit:false)
  onCommit,  // ✅ final commit (commit:true)
  disabled,
}) {
  const [hex, setHex] = useState(color);
  const [rgb, setRgb] = useState(hexToRgb(color));

  const lastPropRef = useRef(color);
  const latestHexRef = useRef(color);
  const rafRef = useRef(null);

  useEffect(() => {
    if (color !== lastPropRef.current) {
      lastPropRef.current = color;
      latestHexRef.current = color;
      setHex(color);
      setRgb(hexToRgb(color));
    }
  }, [color]);

  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) =>
          Math.max(0, Math.min(255, x))
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
    );
  }

  // 🔥 Throttled preview using rAF
  function schedulePreview() {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!disabled && onPreview) {
        onPreview(latestHexRef.current);
      }
    });
  }

  function commitFinal() {
    if (disabled || !onCommit) return;
    onCommit(latestHexRef.current);
  }

  return (
    <div
      className="color-picker-wrapper"
      onPointerUp={commitFinal}
      onMouseUp={commitFinal}
      onTouchEnd={commitFinal}
    >
      <HexColorPicker
        color={hex}
        disabled={disabled}
        onChange={(val) => {
          // ✅ local UI update (always)
          setHex(val);
          setRgb(hexToRgb(val));

          // store latest color
          latestHexRef.current = val;

          // 🔥 throttled shape preview
          schedulePreview();
        }}
      />

      <div className="color-inputs">
        <div className="color-row">
          <div>
            <label>Hex</label>
            <input
              value={hex.replace("#", "").toUpperCase()}
              maxLength={6}
              disabled={disabled}
              onChange={(e) => {
                const formatted = e.target.value.startsWith("#")
                  ? e.target.value
                  : "#" + e.target.value;

                setHex(formatted);
                if (formatted.length === 7) {
                  const rgbVal = hexToRgb(formatted);
                  setRgb(rgbVal);
                  latestHexRef.current = formatted;
                  schedulePreview();
                  commitFinal(); // typed hex = immediate commit
                }
              }}
            />
          </div>

          {["r", "g", "b"].map((c) => (
            <div key={c}>
              <label>{c.toUpperCase()}</label>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[c]}
                disabled={disabled}
                onChange={(e) => {
                  const newRgb = { ...rgb, [c]: parseInt(e.target.value) || 0 };
                  setRgb(newRgb);
                  const newHex = rgbToHex(
                    newRgb.r,
                    newRgb.g,
                    newRgb.b
                  );
                  setHex(newHex);
                  latestHexRef.current = newHex;
                  schedulePreview();
                  commitFinal(); // typed RGB = immediate commit
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
