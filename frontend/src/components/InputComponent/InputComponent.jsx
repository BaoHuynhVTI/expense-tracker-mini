// Reusable labeled input. Supports single-line, multiline (textarea), and a
// show/hide toggle (eye button) for password fields.
import { useState } from "react";

import "./InputComponent.scss";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function InputComponent({
  label,
  hint,
  error,
  multiline = false,
  rows = 2,
  wrapperClassName = "",
  type = "text",
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className={`input-field ${wrapperClassName}`.trim()}>
      {label && <span className="input-field__label">{label}</span>}

      {multiline ? (
        <textarea className="input-field__control" rows={rows} {...rest} />
      ) : isPassword ? (
        <span className="input-field__password">
          <input
            className="input-field__control input-field__control--password"
            type={inputType}
            {...rest}
          />
          <button
            type="button"
            className="input-field__toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </span>
      ) : (
        <input className="input-field__control" type={type} {...rest} />
      )}

      {hint && <span className="input-field__hint">{hint}</span>}
      {error && <span className="input-field__error">{error}</span>}
    </label>
  );
}
