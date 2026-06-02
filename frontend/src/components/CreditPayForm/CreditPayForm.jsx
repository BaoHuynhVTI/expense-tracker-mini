import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import { formatJPY } from "../../utils/format.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreditPayForm({ credit, wallets = [], onSubmit }) {
  const [amount, setAmount] = useState(credit.balance);
  const [wallet, setWallet] = useState(wallets[0]?.id ?? "");
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
      await onSubmit({
        credit: credit.id,
        amount,
        wallet,
        paid_date: paidDate,
      });
    } catch (err) {
      setError(extractError(err, "Could not record the payment."));
      setBusy(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <p className="muted">
        Pay <strong>{credit.name}</strong> · outstanding {formatJPY(credit.balance)}
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
          label="From wallet"
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
        {busy ? "Saving..." : "Record payment"}
      </button>
    </form>
  );
}
