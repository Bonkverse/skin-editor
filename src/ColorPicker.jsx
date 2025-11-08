// src/ColorPicker.jsx
import React, { useRef, useEffect, useState } from "react";

const width = 200;
const height = 150;
const outerRadius = Math.min(height, width) / 2 - 3;
const innerRadius = outerRadius * 3 / 4;
const shapeRadius = innerRadius - 8;
const mode = { HSV: 0, HSL: 1, OKLCH: 2 };

export default function ColorPicker({ color, setColor }) {
  const [pickerMode, setPickerMode] = useState(mode.HSV);
  let initPos = hexToSliderPos(color, pickerMode);

  const canvasRef = useRef(null);
  const [hueSliderAngle, setHueSliderAngle] = useState(initPos.angle);
  const [innerSliderPos, setInnerSliderPos] = useState({x: initPos.x, y: initPos.y});
  const [hexInput, setHexInput] = useState(color);
  const [innerDown, setInnerDown] = useState(false);
  const [outerDown, setOuterDown] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for(let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);

      //Outer ring
      let mask = ringMask(x, y, width / 2, height / 2, innerRadius, outerRadius);
      if(mask > 0) {
        const hue = (Math.atan2(y - height / 2, x - width / 2) / Math.PI / 2 + 2 + 0.25) % 1 * 360;
        const color = hsvToRgb(hue, 1, 1);
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = mask;
        continue;
      }

      let hue = (hueSliderAngle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
      if(pickerMode === mode.HSV) {
        mask = triangleMask(x, y, width / 2, height / 2, shapeRadius);
        if(mask > 0) {
          let rgb = triangleColor(x, y, width / 2, height / 2, shapeRadius, hue);
          data[i] = rgb.r;
          data[i + 1] = rgb.g;
          data[i + 2] = rgb.b;
          data[i + 3] = mask;
        }
      } else if(pickerMode === mode.HSL) {
        mask = hslMask(x, y, width / 2, height / 2, shapeRadius);
        if(mask > 0) {
          let rgb = hslColor(x, y, width / 2, height / 2, shapeRadius, hue);
          data[i] = rgb.r;
          data[i + 1] = rgb.g;
          data[i + 2] = rgb.b;
          data[i + 3] = mask;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    let hueSliderX = width / 2 + Math.cos(hueSliderAngle) * (outerRadius + innerRadius) / 2;
    let hueSliderY = height / 2 + Math.sin(hueSliderAngle) * (outerRadius + innerRadius) / 2;
    ctx.beginPath()
    ctx.arc(hueSliderX, hueSliderY, 9, 0, Math.PI * 2, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#608188";
    ctx.stroke();
    ctx.beginPath()
    ctx.arc(hueSliderX, hueSliderY, 6, 0, Math.PI * 2, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#2f4f55";
    ctx.stroke();

    ctx.beginPath()
    ctx.arc(innerSliderPos.x, innerSliderPos.y, 9, 0, Math.PI * 2, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#608188";
    ctx.stroke();
    ctx.beginPath()
    ctx.arc(innerSliderPos.x, innerSliderPos.y, 6, 0, Math.PI * 2, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#2f4f55";
    ctx.stroke();

    let onMouseDown = (e) => {
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if(Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)) < innerRadius) {
        setInnerDown(true);
        mouseUpdate(x, y, true, false);
      }
      else {
        setOuterDown(true);
        mouseUpdate(x, y, false, true);
      }
    }

    let onMouseMove = (e) => {
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      mouseUpdate(x, y, innerDown, outerDown);
    }

    let onMouseUp = (e) => {
      setInnerDown(false);
      setOuterDown(false);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  function mouseUpdate(x, y, inner, outer) {
    if(outer) {
      let angle = Math.atan2(y - height / 2, x - width / 2);
      let hue = (angle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
      setHueSliderAngle(angle);
      updateColor(innerSliderPos.x, innerSliderPos.y, angle);
    } else if(inner) {
      let bounded = pickerMode === mode.HSV ? triangleBounds(x, y, width / 2, height / 2, shapeRadius)
        : pickerMode === mode.HSL ? hslBounds(x, y, width / 2, height / 2, shapeRadius)
        : {x, y};
      setInnerSliderPos({x: bounded.x, y: bounded.y});
      updateColor(bounded.x, bounded.y, hueSliderAngle);
    }
  }

  function onHexChange(e) {
    let hex = e.target.value;
    setHexInput(hex);

    let match = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if(match === null) return;
    setColor(match[0])

    let r = parseInt(match[1], 16);
    let g = parseInt(match[2], 16);
    let b = parseInt(match[3], 16);

    let {angle, x, y} = rgbToSliderPos(r, g, b, pickerMode);
    setHueSliderAngle(angle);
    setInnerSliderPos({x: x, y: y});
  }

  function rgbToSliderPos(r, g, b, pickerMode) {
    if(pickerMode === mode.HSV) {
      let hsv = rgbToHsv(r, g, b);

      let angle = (hsv.h / 360 - 0.25) * Math.PI * 2;

      let min = -shapeRadius;
      let max = shapeRadius * Math.cos(Math.PI / 3)
      let proj = min + hsv.v * (max - min);
      let range = hsv.v * 2 * shapeRadius * Math.sin(Math.PI / 3)
      let perp = hsv.s * range - range / 2;

      let x = width / 2 + proj * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6);
      let y = height / 2 - proj * Math.sin(Math.PI / 3) + perp * Math.sin(Math.PI / 6);

      return {angle, x, y};
    } else if(pickerMode === mode.HSL) {
      let hsl = rgbToHsl(r, g, b);
      
      let angle = (hsl.h / 360 - 0.25) * Math.PI * 2;
      let range = 2 * shapeRadius * (1 - Math.abs(2 * hsl.l - 1));
      let x = width / 2 - range / 2 + hsl.s * range;
      let y = height / 2 + shapeRadius - hsl.l * shapeRadius * 2;

      return {angle, x, y};
    }
  }

  function hexToSliderPos(hex, pickerMode) {
    let match = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if(match === null) match = ["#000000", "00", "00", "00"];

    let r = parseInt(match[1], 16);
    let g = parseInt(match[2], 16);
    let b = parseInt(match[3], 16);
    return rgbToSliderPos(r, g, b, pickerMode);
  }

  function updateColor(x, y, angle) {
    let hue = (angle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
    let rgb = pickerMode === mode.HSV ? triangleColor(x, y, width / 2, height / 2, shapeRadius, hue)
      : pickerMode === mode.HSL ? hslColor(x, y, width / 2, height / 2, shapeRadius, hue)
      : {r: 0, g: 0, b: 0};
    let hex = rgbToHex(rgb);
    setColor(hex);
    setHexInput(hex);
  }

  return (
    <div style={{display: "flex", "flexDirection": "column", width: "100%", height: "100%"}}>
      <div style={{display: "flex"}}>
        <button
          className="color-picker-mode"
          onClick={() => {
            setPickerMode(mode.HSV);
            let newPos = hexToSliderPos(color, mode.HSV);
            setHueSliderAngle(newPos.angle);
            setInnerSliderPos({x: newPos.x, y: newPos.y});
          }}
          aria-pressed={pickerMode == mode.HSV ? "true" : "false"}
        >
          HSV
        </button>
        <button
          className="color-picker-mode"
          onClick={() => {
            setPickerMode(mode.HSL);
            let newPos = hexToSliderPos(color, mode.HSL);
            setHueSliderAngle(newPos.angle);
            setInnerSliderPos({x: newPos.x, y: newPos.y});
          }}
          aria-pressed={pickerMode == mode.HSL ? "true" : "false"}
        >
          HSL
        </button>
        <button
          className="color-picker-mode"
          onClick={() => {
            setPickerMode(mode.OKLCH);
            let newPos = hexToSliderPos(color, mode.OKLCH);
            setHueSliderAngle(newPos.angle);
            setInnerSliderPos({x: newPos.x, y: newPos.y});
          }}
          aria-pressed={pickerMode == mode.OKLCH ? "true" : "false"}
        >
          OKLCH
        </button>
      </div>
      <canvas ref={canvasRef}></canvas>
      <label style={{"margin": "auto auto 0 auto"}}>
        <input
          className="neon-input"
          type="text"
          style={{width: "80px"}}
          value={hexInput}
          onChange={onHexChange}
        />
      </label>
    </div>
  );
}

function ringMask(x, y, xPos, yPos, innerR, outerR) {
  let xOffset = x + 0.5 - xPos;
  let yOffset = y + 0.5 - yPos;
  
  return (255 *
    Math.min(1, Math.max(0,
      outerR - Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2))
    )) * 
    Math.min(1, Math.max(0,
      -innerR + Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2))
    ))
  );
}

function triangleMask(x, y, xPos, yPos, r) {
  let xOffset = x + 0.5 - xPos;
  let yOffset = y + 0.5 - yPos;
  let innerR = r * Math.cos(Math.PI / 3);
  
  return (255 *
    Math.min(1, Math.max(0,
      innerR - xOffset * Math.cos(Math.PI / 3) - yOffset * Math.sin(Math.PI / 3)
    )) *
    Math.min(1, Math.max(0,
      innerR - xOffset * Math.cos(Math.PI / 3) + yOffset * Math.sin(Math.PI / 3)
    )) *
    Math.min(1, Math.max(0,
      innerR + xOffset
    ))
  );
}

function hslMask(x, y, xPos, yPos, r) {
  let xOffset = x + 0.5 - xPos;
  let yOffset = y + 0.5 - yPos;
  let innerR = r * Math.cos(Math.PI / 4);

  return (255 *
    Math.min(1, Math.max(0,
      innerR - xOffset * Math.cos(Math.PI / 4) + yOffset * Math.cos(Math.PI / 4)
    )) *
    Math.min(1, Math.max(0,
      innerR - xOffset * Math.cos(Math.PI / 4) - yOffset * Math.cos(Math.PI / 4)
    )) *
    Math.min(1, Math.max(0,
      innerR + xOffset * Math.cos(Math.PI / 4) + yOffset * Math.cos(Math.PI / 4)
    )) *
    Math.min(1, Math.max(0,
      innerR + xOffset * Math.cos(Math.PI / 4) - yOffset * Math.cos(Math.PI / 4)
    ))
  );
}

function triangleColor(x, y, xPos, yPos, r, hue) {
  let min = -r;
  let max = r * Math.cos(Math.PI / 3)
  let proj = (x - xPos) * Math.cos(Math.PI / 3) - (y - yPos) * Math.sin(Math.PI / 3);
  let range = (proj - min) / (max - min) * 2 * r * Math.sin(Math.PI / 3)
  let perp = (x - xPos) * Math.cos(Math.PI / 6) + (y - yPos) * Math.sin(Math.PI / 6);
  return hsvToRgb(hue, (perp + range / 2) / range, (proj - min) / (max - min));
}

function hslColor(x, y, xPos, yPos, r, hue) {
  let range = 2 * (r - Math.abs(y - yPos));
  return hslToRgb(
    hue,
    range === 0 ? 0 : (x - xPos + range / 2) / range,
    1 - (y - yPos + r) / r / 2
  );
}

function triangleBounds(x, y, xPos, yPos, r) {
  let ri = r * Math.cos(Math.PI / 3);
  if(x - xPos < -ri) {
    x = xPos - ri;

    if(y - yPos < -r * Math.sin(Math.PI / 3))
      y = yPos - r * Math.sin(Math.PI / 3);
    else if(y - yPos > r * Math.sin(Math.PI / 3))
      y = yPos + r * Math.sin(Math.PI / 3);
  } else if((x - xPos) * Math.cos(Math.PI / 3) + (y - yPos) * Math.sin(Math.PI / 3) > ri) {
    if((x - xPos) * Math.cos(Math.PI / 6) - (y - yPos) * Math.sin(Math.PI / 6) > r * Math.sin(Math.PI / 3)) {
      x = xPos + r;
      y = yPos;
    } else if((x - xPos) * Math.cos(Math.PI / 6) - (y - yPos) * Math.sin(Math.PI / 6) < -r * Math.sin(Math.PI / 3)) {
      x = xPos - ri;
      y = yPos + r * Math.sin(Math.PI / 3);
    } else {
      let perp = (x - xPos) * Math.cos(Math.PI / 6) - (y - yPos) * Math.sin(Math.PI / 6);
      x = xPos + ri * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6);
      y = yPos + ri * Math.sin(Math.PI / 3) - perp * Math.sin(Math.PI / 6);
    }
  } else if((x - xPos) * Math.cos(Math.PI / 3) - (y - yPos) * Math.sin(Math.PI / 3) > ri) {
    if((x - xPos) * Math.cos(Math.PI / 6) + (y - yPos) * Math.sin(Math.PI / 6) > r * Math.sin(Math.PI / 3)) {
      x = xPos + r;
      y = yPos;
    } else if((x - xPos) * Math.cos(Math.PI / 6) + (y - yPos) * Math.sin(Math.PI / 6) < -r * Math.sin(Math.PI / 3)) {
      x = xPos - ri;
      y = yPos - r * Math.sin(Math.PI / 3);
    }
    else {
      let perp = (x - xPos) * Math.cos(Math.PI / 6) + (y - yPos) * Math.sin(Math.PI / 6);
      x = xPos + ri * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6);
      y = yPos - ri * Math.sin(Math.PI / 3) + perp * Math.sin(Math.PI / 6);
    }
  }

  return {x, y};
}

function hslBounds(x, y, xPos, yPos, r) {
  let cos4 = Math.cos(Math.PI / 4);

  //Rotating coordinates such that the square is axis aligned.
  let x2 = (x - xPos) * cos4 - (y - yPos) * cos4;
  let y2 = (x - xPos) * cos4 + (y - yPos) * cos4;

  let ri = r * cos4;
  if(x2 < -ri) x2 = -ri;
  else if(x2 > ri) x2 = ri;
  if(y2 < -ri) y2 = -ri;
  else if(y2 > ri) y2 = ri;

  return {x: xPos + x2 * cos4 + y2 * cos4, y: yPos - x2 * cos4 + y2 * cos4};
}

function rgbToHex(color) {
  let r = Math.max(0, Math.min(255, Math.round(color.r)));
  let g = Math.max(0, Math.min(255, Math.round(color.g)));
  let b = Math.max(0, Math.min(255, Math.round(color.b)));

  return "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0");
}

function rgbToHsv(r, g, b) {
  let v = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let c = v - min;
  let s = v === 0 ? 0 : c / v;
  
  let h;
  if(s === 0) h = 0;
  else if(v === r) h = (g - b) / c * 60 % 360;
  else if(v === g) h = (b - r) / c * 60 + 120;
  else if(v === b) h = (r - g) / c * 60 + 240;
  else h = 0;

  return {h: h, s: s, v: v / 255};
}

function rgbToHsl(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let delta = max - min;
  let l = (max + min) / 2;
  let s = delta === 0 ? 0 : delta / (255 - Math.abs(2 * l - 255));

  let h;
  if(s === 0) h = 0;
  else if(max === r) h = (g - b) / delta * 60 % 360;
  else if(max === g) h = (b - r) / delta * 60 + 120;
  else if(max === b) h = (r - g) / delta * 60 + 240;
  else h = 0;

  return {h: h, s: s, l: l / 255};
}

function hsvToRgb(h, s, v) {
  if(h < 0) return {r: 0, g: 0, b: 0};

  let c = v * s;
  let x = c * (1 - Math.abs(h / 60 % 2 - 1))
  let m = v - c;
  if(h < 60) return {
    r: (m + c) * 255,
    g: (m + x) * 255,
    b: m * 255
  };
  else if(h < 120) return  {
    r: (m + x) * 255,
    g: (m + c) * 255,
    b: m * 255
  };
  else if(h < 180) return {
    r: m * 255,
    g: (m + c) * 255,
    b: (m + x) * 255
  };
  else if(h < 240) return {
    r: m * 255,
    g: (m + x) * 255,
    b: (m + c) * 255
  };
  else if(h < 300) return {
    r: (m + x) * 255,
    g: m * 255,
    b: (m + c) * 255
  };
  else return {
    r: (m + c) * 255,
    g: m * 255,
    b: (m + x) * 255
  };
}

function hslToRgb(h, s, l) {
  if(h < 0) return {r: 0, g: 0, b: 0};

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(h / 60 % 2 - 1));
  let m = l - c / 2;

  if(h < 60) return {
    r: (m + c) * 255,
    g: (m + x) * 255,
    b: m * 255
  };
  else if(h < 120) return  {
    r: (m + x) * 255,
    g: (m + c) * 255,
    b: m * 255
  };
  else if(h < 180) return {
    r: m * 255,
    g: (m + c) * 255,
    b: (m + x) * 255
  };
  else if(h < 240) return {
    r: m * 255,
    g: (m + x) * 255,
    b: (m + c) * 255
  };
  else if(h < 300) return {
    r: (m + x) * 255,
    g: m * 255,
    b: (m + c) * 255
  };
  else return {
    r: (m + c) * 255,
    g: m * 255,
    b: (m + x) * 255
  };
}
