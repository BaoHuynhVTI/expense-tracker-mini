import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import { formatJPY } from "../../utils/format.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function RepayForm({ debt, wallets = [], onSubmit }) {
  const isPayable = debt.direction === "payable";
  const [amount, setAmount] = useState(debt.remaining);
  const [wallet, setWallet] = useState(debt.wallet ?? wallets[0]?.id ?? "");
  const [paidDate, setPaidDate] = useState(today());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!(Number(amount) > 0)) return setError("Amount must be greater than 0.");
    if (!wallet) return setError("Please choose a wallet.");
    setBusy(true);
    try {
      await onSubmit({ debt: debt.id, amount, wallet, paid_date: paidDate });
    } catch (err) {
      setError(extractError(err, "Could not record the payment."));
      setBusy(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <p className="muted">
        {isPayable ? "Repay to" : "Collect from"} <strong>{debt.counterparty}</strong> ·
        remaining {formatJPY(debt.remaining)}
      </p>
      <div className="field-row">
        <InputComponent
          label="Amount (¥)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <SelectComponent
          label="Wallet"
          options={wallets.map((w) => ({ value: w.id, label: w.name }))}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />
      </div>
      <InputComponent
        label="Date"
        type="date"
        value={paidDate}
        onChange={(e) => setPaidDate(e.target.value)}
      />
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Saving..." : isPayable ? "Record repayment" : "Record collection"}
      </button>
    </form>
  );
}
