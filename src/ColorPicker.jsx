// src/ColorPicker.jsx
import React, { useRef, useEffect, useState } from "react";

const width = 200;
const height = 150;
const outerRadius = Math.min(height, width) / 2 - 3;
const innerRadius = outerRadius * 3 / 4;
const triangleRadius = innerRadius - 8;

export default function ColorPicker({ color, setColor }) {
  const canvasRef = useRef(null);
  const mode = { HSV: 0, HSL: 1, OKLCH: 2 };
  const [pickerMode, setPickerMode] = useState(mode.HSV);
  const [hueSliderAngle, setHueSliderAngle] = useState(-Math.PI / 2);
  const [innerSliderPos, setInnerSliderPos] = useState({x: width / 2 + triangleRadius, y: height / 2});
  const [hexInput, setHexInput] = useState(color);

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

      //Triangle
      mask = triangleMask(x, y, width / 2, height / 2, triangleRadius);
      if(mask > 0) {
        let hue = (hueSliderAngle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
        let rgb = triangleColor(x, y, width / 2, height / 2, triangleRadius, hue);

        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        data[i + 3] = mask;
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
    
    let outerDown = false;
    let innerDown = false;
    canvas.addEventListener("mousedown", (e) => {
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if(Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)) < innerRadius)
        innerDown = true;
      else
        outerDown = true;
    });
    document.addEventListener("mousemove", (e) => {
      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if(outerDown) {
        let angle = Math.atan2(y - height / 2, x - width / 2);
        let hue = (angle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
        setHueSliderAngle(angle);
        updateColor(innerSliderPos.x, innerSliderPos.y, angle);
      } else if(innerDown) {
        let xOffset = x - width / 2;
        let yOffset = y - height / 2;
        let r = triangleRadius * Math.cos(Math.PI / 3);

        if(xOffset < -r) {
          x = width / 2 - r;

          if(yOffset < -triangleRadius * Math.sin(Math.PI / 3))
            y = height / 2 - triangleRadius * Math.sin(Math.PI / 3);
          else if(yOffset > triangleRadius * Math.sin(Math.PI / 3))
            y = height / 2 + triangleRadius * Math.sin(Math.PI / 3);
        } else if(xOffset * Math.cos(Math.PI / 3) + yOffset * Math.sin(Math.PI / 3) > r) {
          if(xOffset * Math.cos(Math.PI / 6) - yOffset * Math.sin(Math.PI / 6) > (triangleRadius + r) / 2) {
            x = width / 2 + triangleRadius;
            y = height / 2;
          } else if(xOffset * Math.cos(Math.PI / 6) - yOffset * Math.sin(Math.PI / 6) < -(triangleRadius + r) / 2) {
            x = width / 2 - r;
            y = height / 2 + triangleRadius * Math.sin(Math.PI / 3);
          } else {
            let perp = xOffset * Math.cos(Math.PI / 6) - yOffset * Math.sin(Math.PI / 6);
            x = width / 2 + r * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6);
            y = height / 2 + r * Math.sin(Math.PI / 3) - perp * Math.sin(Math.PI / 6);
          }
        } else if(xOffset * Math.cos(Math.PI / 3) - yOffset * Math.sin(Math.PI / 3) > r) {
          if(xOffset * Math.cos(Math.PI / 6) + yOffset * Math.sin(Math.PI / 6) > (triangleRadius + r) / 2) {
            x = width / 2 + triangleRadius;
            y = height / 2;
          } else if(xOffset * Math.cos(Math.PI / 6) + yOffset * Math.sin(Math.PI / 6) < -(triangleRadius + r) / 2) {
            x = width / 2 - r;
            y = height / 2 - triangleRadius * Math.sin(Math.PI / 3);
          }
          else {
            let perp = xOffset * Math.cos(Math.PI / 6) + yOffset * Math.sin(Math.PI / 6);
            x = width / 2 + r * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6);
            y = height / 2 - r * Math.sin(Math.PI / 3) + perp * Math.sin(Math.PI / 6);
          }
        }

        setInnerSliderPos({x: x, y: y});
        updateColor(x, y, hueSliderAngle);
      }
    });
    document.addEventListener("mouseup", () => {
      innerDown = false;
      outerDown = false;
    });
  });

  function onHexChange(e) {
    let hex = e.target.value;
    setHexInput(hex);

    let match = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if(match === null) return;
    setColor(match[0])

    let r = parseInt(match[1], 16);
    let g = parseInt(match[2], 16);
    let b = parseInt(match[3], 16);
    let hsv = rgbToHsv(r, g, b);
    
    let angle = (hsv.h / 360 - 0.25) * Math.PI * 2;
    setHueSliderAngle(angle);

    let min = -triangleRadius;
    let max = triangleRadius * Math.cos(Math.PI / 3)
    let proj = min + hsv.v * (max - min);
    let range = hsv.v * 2 * triangleRadius * Math.sin(Math.PI / 3)
    let perp = hsv.s * range - range / 2;

    setInnerSliderPos({
      x: width / 2 + proj * Math.cos(Math.PI / 3) + perp * Math.cos(Math.PI / 6),
      y: height / 2 - proj * Math.sin(Math.PI / 3) + perp * Math.sin(Math.PI / 6)
    });
  }

  function updateColor(x, y, angle) {
    let hue = (angle / Math.PI / 2 + 1 + 0.25) % 1 * 360;
    let rgb = triangleColor(x, y, width / 2, height / 2, triangleRadius, hue);
    let hex = rgbToHex(rgb);
    setColor(hex);
    setHexInput(hex);
  }

  return (
    <div style={{display: "flex", "flexDirection": "column", width: "100%", height: "100%"}}>
      <div style={{display: "flex"}}>
        <button
          className="color-picker-mode"
          onClick={() => setPickerMode(mode.HSV)}
          aria-pressed={pickerMode == mode.HSV ? "true" : "false"}
        >
          HSV
        </button>
        <button
          className="color-picker-mode"
          onClick={() => setPickerMode(mode.HSL)}
          aria-pressed={pickerMode == mode.HSL ? "true" : "false"}
        >
          HSL
        </button>
        <button
          className="color-picker-mode"
          onClick={() => setPickerMode(mode.OKLCH)}
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

function triangleColor(x, y, xPos, yPos, r, hue) {
  let min = -r;
  let max = r * Math.cos(Math.PI / 3)
  let proj = (x - xPos) * Math.cos(Math.PI / 3) - (y - yPos) * Math.sin(Math.PI / 3);
  let range = (proj - min) / (max - min) * 2 * r * Math.sin(Math.PI / 3)
  let perp = (x - xPos) * Math.cos(Math.PI / 6) + (y - yPos) * Math.sin(Math.PI / 6);
  return hsvToRgb(hue, (perp + range / 2) / range, (proj - min) / (max - min));
}

function rgbToHex(color) {
  let r = Math.max(0, Math.min(255, Math.floor(color.r)));
  let g = Math.max(0, Math.min(255, Math.floor(color.g)));
  let b = Math.max(0, Math.min(255, Math.floor(color.b)));

  return "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0");
}

function rgbToHsv(r, g, b) {
  let v = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let delta = v - min;
  let s = v === 0 ? 0 : delta / v * 255;
  
  let h;
  if(s === 0) h = 0;
  else if(v === r) h = (g - b) / delta * 60 % 360;
  else if(v === g) h = (b - r) / delta * 60 + 120;
  else if(v === b) h = (r - g) / delta * 60 + 240;
  else h = 0;

  return {h: h, s: s / 255, v: v / 255};
}

function hsvToRgb(h, s, v) {
  if(s < 0) s = 0;
  if(s > 1) s = 1;
  if(v < 0) v = 0;
  if(v > 1) v = 1;
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
    r: m * 256,
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
