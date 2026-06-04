import { formatJPY } from "../../utils/format.js";
import "./SummaryCards.scss";

function sumWalletBalances(wallets = []) {
  return wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);
}

export default function SummaryCards({ summary, wallets = [] }) {
  const spentWallet = summary?.spent_wallet;
  const spentOnCard = summary?.spent_on_card;
  const spendingHint =
    spentWallet != null && spentOnCard != null
      ? `Wallet ${formatJPY(spentWallet)} · Card ${formatJPY(spentOnCard)}`
      : null;

  const onHand = sumWalletBalances(wallets);
  const creditOwed = Number(summary?.credit_owed || 0);
  const afterCredit = onHand - creditOwed;
  const afterCreditHint =
    creditOwed > 0 ? `After credit: ${formatJPY(afterCredit)}` : null;

  const cards = [
    {
      label: "On hand",
      value: formatJPY(onHand),
      tone: "income",
      hint: afterCreditHint,
      hintWarning: afterCredit < 0,
      primary: true,
    },
    { label: "Income", value: formatJPY(summary?.total_income), tone: "income" },
    {
      label: "Spending",
      value: formatJPY(summary?.total_spent),
      tone: "expense",
      hint: spendingHint,
    },
    { label: "I owe", value: formatJPY(summary?.debt_payable_remaining) },
    { label: "Owed to me", value: formatJPY(summary?.debt_receivable_remaining) },
    { label: "Credit owed", value: formatJPY(summary?.credit_owed), tone: "expense" },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`card summary-card${card.primary ? " summary-card--primary" : ""}`}
        >
          <span className="summary-card__label">{card.label}</span>
          <span
            className={`summary-card__value${
              card.tone ? ` summary-card__value--${card.tone}` : ""
            }`}
          >
            {card.value}
          </span>
          {card.hint ? (
            <span
              className={`summary-card__hint${
                card.hintWarning ? " summary-card__hint--warning" : ""
              }`}
            >
              {card.hint}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
