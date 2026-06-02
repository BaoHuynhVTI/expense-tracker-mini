import "./Pagination.scss";

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn--ghost btn--small"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        ‹ Prev
      </button>
      <span className="pagination__info">
        Page {page} / {pageCount}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--small"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next ›
      </button>
    </div>
  );
}
