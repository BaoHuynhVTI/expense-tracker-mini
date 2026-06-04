import { formatBillingClose, formatJPY } from "../../utils/format.js";
import "./CreditList.scss";

export default function CreditList({
  credits,
  onEditCharge,
  onRequestDeleteCharge,
  onPay,
  onRequestDeletePayment,
}) {
  if (!credits.length) {
    return <p className="muted">No credit cards yet. Create one in Settings.</p>;
  }

  return (
    <ul className="credit-list">
      {credits.map((credit) => {
        const owed = Number(credit.balance) > 0;
        return (
          <li key={credit.id} className="credit-card">
            <div className="credit-card__top">
              <span
                className="credit-card__dot"
                style={{ background: credit.color }}
                aria-hidden="true"
              />
              <span className="credit-card__name">{credit.name}</span>
              <span className="credit-card__available muted">
                {formatJPY(credit.available)} available
              </span>
            </div>

            <div className="credit-card__amounts">
              <span className="credit-card__balance">
                {formatJPY(credit.balance)}
                <span className="credit-card__of"> / {formatJPY(credit.credit_limit)}</span>
              </span>
              <span className="credit-card__cycle muted">
                This cycle {formatJPY(credit.cycle_charges)}
                {credit.cycle_end && (
                  <> · closes {formatBillingClose(credit.cycle_end)}</>
                )}
                {credit.cycle_start && credit.cycle_end && (
                  <>
                    {" "}
                    ({credit.cycle_start} – {credit.cycle_end})
                  </>
                )}
              </span>
            </div>

            {credit.charges?.length > 0 && (
              <ul className="credit-card__entries">
                {credit.charges.map((charge) => (
                  <li key={charge.id} className="credit-entry">
                    <span>
                      {charge.charged_date} · {charge.title} ·{" "}
                      {formatJPY(charge.amount)}
                      {charge.category_detail && (
                        <span className="credit-entry__cat">
                          {" "}
                          · {charge.category_detail.name}
                        </span>
                      )}
                    </span>
                    <div className="credit-entry__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => onEditCharge(charge)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => onRequestDeleteCharge(charge)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {credit.payments?.length > 0 && (
              <ul className="credit-card__entries credit-card__entries--payments">
                {credit.payments.map((payment) => (
                  <li key={payment.id} className="credit-entry">
                    <span>
                      Paid {payment.paid_date} · {formatJPY(payment.amount)} ·{" "}
                      {payment.wallet_detail?.name}
                    </span>
                    <button
                      type="button"
                      className="credit-entry__delete"
                      onClick={() => onRequestDeletePayment(payment)}
                      aria-label="Delete payment"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {owed && (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onPay(credit)}
              >
                Pay bill
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
