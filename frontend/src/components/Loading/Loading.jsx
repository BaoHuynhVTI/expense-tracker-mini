import "./Loading.scss";

export default function Loading({
  label = "Loading...",
  inline = false,
  fullPage = false,
  fill = false,
}) {
  const className = [
    "loading",
    inline && "loading--inline",
    fullPage && "loading--page",
    fill && "loading--fill",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-label={label}>
      <span className="loading__spinner" aria-hidden="true" />
      {label && <span className="loading__label">{label}</span>}
    </div>
  );
}
