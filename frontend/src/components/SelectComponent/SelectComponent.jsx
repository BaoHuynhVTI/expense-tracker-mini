// Reusable labeled select. Pass `options` as [{ value, label }].
import "./SelectComponent.scss";

export default function SelectComponent({
  label,
  options = [],
  error,
  wrapperClassName = "",
  ...rest
}) {
  return (
    <label className={`input-field ${wrapperClassName}`.trim()}>
      {label && <span className="input-field__label">{label}</span>}
      <select className="input-field__control input-field__control--select" {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="input-field__error">{error}</span>}
    </label>
  );
}
