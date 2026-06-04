import { formatJPY } from "../../utils/format.js";
import "./DebtList.scss";

export default function DebtList({
  debts,
  onEdit,
  onRequestDelete,
  onRepay,
  onRequestDeletePayment,
}) {
  if (!debts.length) {
    return <p className="muted">No debts yet.</p>;
  }

  return (
    <ul className="debt-list">
      {debts.map((debt) => {
        const isPayable = debt.direction === "payable";
        const settled = debt.settled;
        return (
          <li key={debt.id} className="debt-card">
            <div className="debt-card__top">
              <span
                className={`badge ${
                  isPayable ? "badge--payable" : "badge--receivable"
                }`}
              >
                {isPayable ? "I owe" : "Owed to me"}
              </span>
              <span className="debt-card__counterparty">
                {debt.counterparty_detail?.name ?? "—"}
              </span>
              {settled && <span className="badge badge--settled">Settled</span>}
              <div className="debt-card__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onEdit(debt)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => onRequestDelete(debt)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="debt-card__amounts">
              <span className="debt-card__remaining">
                {formatJPY(debt.remaining)}
                <span className="debt-card__of"> / {formatJPY(debt.principal)}</span>
              </span>
              <span className="muted">
                {debt.affects_wallet && debt.wallet_detail
                  ? `via ${debt.wallet_detail.name} · `
                  : "tracking only · "}
                {debt.incurred_date}
              </span>
            </div>

            {debt.payments?.length > 0 && (
              <ul className="debt-card__payments">
                {debt.payments.map((p) => (
                  <li key={p.id} className="debt-payment">
                    <span>
                      {p.paid_date} · {formatJPY(p.amount)}
                      {p.wallet_detail ? ` · ${p.wallet_detail.name}` : ""}
                    </span>
                    <button
                      type="button"
                      className="debt-payment__delete"
                      onClick={() => onRequestDeletePayment(p)}
                      aria-label="Delete payment"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!settled && (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onRepay(debt)}
              >
                {isPayable ? "Repay" : "Collect"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
