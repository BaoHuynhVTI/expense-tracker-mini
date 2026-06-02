import { formatJPY } from "../../utils/format.js";
import "./CreditCardList.scss";

export default function CreditCardList({ credits = [] }) {
  if (!credits.length) {
    return <p className="muted">No credit cards yet. Create one in Settings.</p>;
  }

  return (
    <div className="credit-card-list">
      {credits.map((credit) => {
        const owed = Number(credit.balance) > 0;
        return (
          <div key={credit.id} className="credit-card-mini">
            <span
              className="credit-card-mini__dot"
              style={{ background: credit.color }}
              aria-hidden="true"
            />
            <div className="credit-card-mini__body">
              <span className="credit-card-mini__name">{credit.name}</span>
              <span
                className={`credit-card-mini__balance${
                  owed ? " credit-card-mini__balance--owed" : ""
                }`}
              >
                {formatJPY(credit.balance)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
