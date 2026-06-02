import { formatJPY } from "../../utils/format.js";

export default function IncomeList({ incomes, onEdit, onRequestDelete }) {
  if (!incomes.length) {
    return <p className="muted">No income yet.</p>;
  }

  return (
    <ul className="expense-list">
      {incomes.map((income) => (
        <li key={income.id} className="expense-item">
          <div className="expense-item__main">
            <span className="expense-item__title">{income.title}</span>
            {income.source_detail && (
              <span
                className="badge"
                style={{ background: income.source_detail.color }}
              >
                {income.source_detail.name}
              </span>
            )}
          </div>
          <div className="expense-item__meta">
            <span className="expense-item__date">{income.received_date}</span>
            {income.wallet_detail && (
              <span className="expense-item__wallet">
                {income.wallet_detail.name}
              </span>
            )}
            {income.note && (
              <span className="expense-item__note">{income.note}</span>
            )}
          </div>
          <div className="expense-item__right">
            <span className="expense-item__amount" style={{ color: "#6f6f4b" }}>
              +{formatJPY(income.amount)}
            </span>
            <div className="expense-item__actions">
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onEdit(income)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn--danger btn--small"
                onClick={() => onRequestDelete(income)}
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
