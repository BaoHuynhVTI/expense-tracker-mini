import { formatJPY } from "../../utils/format.js";

export default function TransferList({ transfers, onEdit, onRequestDelete }) {
  if (!transfers.length) {
    return <p className="muted">No transfers yet.</p>;
  }

  return (
    <ul className="expense-list">
      {transfers.map((transfer) => (
        <li key={transfer.id} className="expense-item">
          <div className="expense-item__main">
            <span className="expense-item__title">
              {transfer.from_wallet_detail?.name ?? "Wallet"} →{" "}
              {transfer.to_wallet_detail?.name ?? "Wallet"}
            </span>
          </div>
          <div className="expense-item__meta">
            <span className="expense-item__date">{transfer.transfer_date}</span>
            {transfer.note && (
              <span className="expense-item__note">{transfer.note}</span>
            )}
          </div>
          <div className="expense-item__right">
            <span className="expense-item__amount">{formatJPY(transfer.amount)}</span>
            <div className="expense-item__actions">
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onEdit(transfer)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn--danger btn--small"
                onClick={() => onRequestDelete(transfer)}
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
