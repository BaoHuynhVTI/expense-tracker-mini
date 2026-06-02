import { formatJPY } from "../../utils/format.js";
import "./SummaryCards.scss";

export default function SummaryCards({ summary }) {
  const net = Number(summary?.net || 0);
  const spentWallet = summary?.spent_wallet;
  const spentOnCard = summary?.spent_on_card;
  const spendingHint =
    spentWallet != null && spentOnCard != null
      ? `Wallet ${formatJPY(spentWallet)} · Card ${formatJPY(spentOnCard)}`
      : null;

  const cards = [
    { label: "Income", value: formatJPY(summary?.total_income), tone: "income" },
    {
      label: "Spending",
      value: formatJPY(summary?.total_spent),
      tone: "expense",
      hint: spendingHint,
    },
    {
      label: "Net (income − spending)",
      value: formatJPY(summary?.net),
      tone: net < 0 ? "expense" : "income",
    },
    { label: "Top category", value: summary?.top_category || "—" },
    { label: "I owe", value: formatJPY(summary?.debt_payable_remaining) },
    { label: "Owed to me", value: formatJPY(summary?.debt_receivable_remaining) },
    { label: "Credit owed", value: formatJPY(summary?.credit_owed), tone: "expense" },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.label} className="card summary-card">
          <span className="summary-card__label">{card.label}</span>
          <span
            className={`summary-card__value${
              card.tone ? ` summary-card__value--${card.tone}` : ""
            }`}
          >
            {card.value}
          </span>
          {card.hint ? <span className="summary-card__hint">{card.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
