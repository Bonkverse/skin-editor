// src/components/ColorPicker.jsx
// The editor's color picker, built on React Aria Components.
//
// bonk.io colors are always opaque, so there is deliberately no alpha slider
// and every value leaves this component as a 6-digit "#rrggbb" string.
//
// Props:
//   color      "#rrggbb" to show
//   onPreview  called (throttled) while dragging, for live feedback
//   onCommit   called once a change is final (drag end, typed value, swatch)
//   disabled   locks every control
//   showSaved  show the shared recent-colors row and add to it (default true)

import { useEffect, useRef, useState } from "react";
import {
  Button,
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  SliderTrack,
  parseColor,
} from "react-aria-components";
import { pushRecentColor, getRecentColors, subscribeRecentColors } from "../utils/recentColors";

const FORMATS = [
  { id: "hex", label: "Hex" },
  { id: "rgb", label: "RGB" },
  { id: "css", label: "CSS" },
  { id: "hsl", label: "HSL" },
  { id: "hsb", label: "HSB" },
];

// Formats edited one channel at a time.
const CHANNELS = {
  rgb: ["red", "green", "blue"],
  hsl: ["hue", "saturation", "lightness"],
  hsb: ["hue", "saturation", "brightness"],
};

const FORMAT_KEY = "bv-editor-color-format";

function readFormat() {
  try {
    const saved = localStorage.getItem(FORMAT_KEY);
    return FORMATS.some((f) => f.id === saved) ? saved : "hex";
  } catch {
    return "hex";
  }
}

function saveFormat(format) {
  try {
    localStorage.setItem(FORMAT_KEY, format);
  } catch {
    // Not saved; the choice still applies until reload.
  }
}

// Parse any color string to an opaque HSB color, or null if it isn't one.
function toColor(value) {
  try {
    return parseColor(value).withChannelValue("alpha", 1).toFormat("hsb");
  } catch {
    return null;
  }
}

function toHex(color) {
  return color.toString("hex").toLowerCase();
}

// The text copied for the current format. CSS is plain rgb(), since alpha is always 1.
function formatText(color, format) {
  if (format === "hex") return color.toString("hex");
  if (format === "css") return color.toString("rgb");
  return color.toString(format);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API unavailable (http, old browser): fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function ColorPicker({ color, onPreview, onCommit, disabled = false, showSaved = true }) {
  const [value, setValue] = useState(() => toColor(color) ?? toColor("#000000"));
  const [format, setFormat] = useState(readFormat);
  const [text, setText] = useState(() => formatText(value, format));
  const [copied, setCopied] = useState(false);
  const [recentColors, setRecentColors] = useState(getRecentColors);

  const latestRef = useRef(value);
  const rafRef = useRef(null);
  const copiedTimer = useRef(null);

  // Follow outside changes (undo, selecting another shape). A prop that is
  // just our own preview echoed back is ignored, so HSB keeps its hue on
  // grays instead of snapping to red.
  useEffect(() => {
    const next = toColor(color);
    if (!next || toHex(next) === toHex(latestRef.current)) return;
    latestRef.current = next;
    setValue(next);
  }, [color]);

  // Keep the Hex / CSS text box in step with the color, unless it's mid-edit.
  const editingText = useRef(false);
  useEffect(() => {
    if (!editingText.current) setText(formatText(value, format));
  }, [value, format]);

  useEffect(() => (showSaved ? subscribeRecentColors(setRecentColors) : undefined), [showSaved]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearTimeout(copiedTimer.current);
  }, []);

  function preview(next) {
    latestRef.current = next;
    setValue(next);
    if (disabled || !onPreview || rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onPreview(toHex(latestRef.current));
    });
  }

  function commit(next = latestRef.current) {
    if (disabled) return;
    // A preview still waiting for the next frame would land after this
    // commit and start a new live edit; drop it.
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    latestRef.current = next;
    setValue(next);
    const hex = toHex(next);
    if (showSaved) pushRecentColor(hex);
    onCommit?.(hex);
  }

  function commitText() {
    editingText.current = false;
    const next = toColor(text.trim().startsWith("#") || text.includes("(") ? text.trim() : `#${text.trim()}`);
    if (next) commit(next);
    else setText(formatText(latestRef.current, format));
  }

  function chooseFormat(next) {
    setFormat(next);
    saveFormat(next);
  }

  async function onCopy() {
    if (await copyText(formatText(latestRef.current, format))) {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1200);
    }
  }

  const channels = CHANNELS[format];

  return (
    <div
      className={`cpx ${disabled ? "is-disabled" : ""}`}
      // Keep typing and arrow keys inside the picker from reaching the
      // editor's shortcuts (switch tab, nudge or delete shapes, ...).
      onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); }}
    >
      <ColorArea
        className="cpx-area"
        value={value}
        colorSpace="hsb"
        xChannel="saturation"
        yChannel="brightness"
        isDisabled={disabled}
        onChange={preview}
        onChangeEnd={commit}
        aria-label="Color saturation and brightness"
      >
        <ColorThumb className="cpx-thumb" />
      </ColorArea>

      <ColorSlider
        className="cpx-hue"
        value={value}
        colorSpace="hsb"
        channel="hue"
        isDisabled={disabled}
        onChange={preview}
        onChangeEnd={commit}
        aria-label="Hue"
      >
        <SliderTrack className="cpx-hue-track">
          <ColorThumb className="cpx-thumb cpx-thumb-hue" />
        </SliderTrack>
      </ColorSlider>

      <div className="cpx-row">
        <Select
          className="cpx-format"
          selectedKey={format}
          onSelectionChange={chooseFormat}
          isDisabled={disabled}
          aria-label="Color format"
        >
          <Button className="cpx-format-btn">
            <SelectValue />
            <ChevronIcon />
          </Button>
          <Popover className="cpx-popover" placement="bottom start" offset={4}>
            <ListBox className="cpx-format-list" items={FORMATS}>
              {(f) => (
                <ListBoxItem id={f.id} className="cpx-format-item" textValue={f.label}>
                  {({ isSelected }) => (
                    <>
                      <span>{f.label}</span>
                      {isSelected && <CheckIcon />}
                    </>
                  )}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </Select>

        <div className="cpx-values">
          {channels ? (
            channels.map((channel) => (
              <ColorField
                key={`${format}-${channel}`}
                className="cpx-cell"
                value={value}
                colorSpace={format}
                channel={channel}
                isDisabled={disabled}
                onChange={(next) => { if (next) commit(toColor(next.toString("hex"))); }}
                aria-label={channel}
              >
                <Input className="cpx-input cpx-input-num" />
              </ColorField>
            ))
          ) : (
            <div className="cpx-cell cpx-cell-text">
              {format === "hex" && <ColorSwatch className="cpx-dot" color={value} />}
              <input
                className="cpx-input"
                value={text}
                spellCheck={false}
                disabled={disabled}
                aria-label={format === "hex" ? "Hex color" : "CSS color"}
                onFocus={() => { editingText.current = true; }}
                onChange={(e) => setText(e.target.value)}
                onBlur={commitText}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              />
            </div>
          )}

          <Button
            className={`cpx-copy ${copied ? "is-copied" : ""}`}
            onPress={onCopy}
            aria-label={copied ? "Copied" : `Copy ${FORMATS.find((f) => f.id === format).label} value`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
      </div>

      {showSaved && recentColors.length > 0 && (
        <div className="cpx-saved">
          <span className="cpx-label">Recent</span>
          <ColorSwatchPicker
            className="cpx-swatches"
            value={value}
            onChange={(next) => commit(toColor(next.toString("hex")))}
            aria-label="Recent colors"
          >
            {recentColors.map((hex) => (
              <ColorSwatchPickerItem key={hex} color={hex} className="cpx-swatch-item" isDisabled={disabled}>
                <ColorSwatch className="cpx-swatch" />
              </ColorSwatchPickerItem>
            ))}
          </ColorSwatchPicker>
        </div>
      )}
    </div>
  );
}
