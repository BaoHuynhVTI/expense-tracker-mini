import { formatJPY } from "../../utils/format.js";
import "./ExpenseList.scss";

export default function ExpenseList({ expenses, onEdit, onRequestDelete }) {
  if (!expenses.length) {
    return <p className="muted">No expenses yet.</p>;
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <li key={expense.id} className="expense-item">
          <div className="expense-item__main">
            <span className="expense-item__title">{expense.title}</span>
            {expense.category_detail && (
              <span
                className="badge"
                style={{ background: expense.category_detail.color }}
              >
                {expense.category_detail.name}
              </span>
            )}
          </div>
          <div className="expense-item__meta">
            <span className="expense-item__date">{expense.spent_date}</span>
            {expense.wallet_detail && (
              <span className="expense-item__wallet">
                {expense.wallet_detail.name}
              </span>
            )}
            {expense.note && (
              <span className="expense-item__note">{expense.note}</span>
            )}
          </div>
          <div className="expense-item__right">
            <span className="expense-item__amount">
              {formatJPY(expense.amount)}
            </span>
            <div className="expense-item__actions">
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onEdit(expense)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn--danger btn--small"
                onClick={() => onRequestDelete(expense)}
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
