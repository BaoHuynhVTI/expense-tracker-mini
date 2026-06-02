import { VINTAGE_SWATCHES } from "../../utils/format.js";
import "./ColorPicker.scss";

export default function ColorPicker({ label = "Color", value, onChange }) {
  return (
    <div className="color-picker">
      {label && <span className="input-field__label">{label}</span>}
      <div className="color-picker__swatches">
        {VINTAGE_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-picker__swatch${
              value?.toLowerCase() === color.toLowerCase()
                ? " color-picker__swatch--active"
                : ""
            }`}
            style={{ background: color }}
            onClick={() => onChange(color)}
            aria-label={color}
          />
        ))}
        <label className="color-picker__custom" title="Custom color">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
          <span aria-hidden="true">+</span>
        </label>
      </div>
    </div>
  );
}
