import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const DIRECTION_OPTIONS = [
  { value: "payable", label: "I borrowed (I owe)" },
  { value: "receivable", label: "I lent (owed to me)" },
];

function initialState(initial, wallets) {
  return {
    direction: initial?.direction ?? "payable",
    counterparty: initial?.counterparty ?? "",
    principal: initial?.principal ?? "",
    wallet: initial?.wallet ?? wallets[0]?.id ?? "",
    incurred_date: initial?.incurred_date ?? today(),
    note: initial?.note ?? "",
  };
}

export default function DebtForm({ onSubmit, wallets = [], initial = null }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => initialState(initial, wallets));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.counterparty.trim()) return setError("Please enter who it is with.");
    if (!(Number(form.principal) > 0)) return setError("Amount must be greater than 0.");
    if (!form.wallet) return setError("Please choose a wallet.");
    if (!form.incurred_date) return setError("Please choose a date.");

    setSubmitting(true);
    try {
      await onSubmit({
        direction: form.direction,
        counterparty: form.counterparty.trim(),
        principal: form.principal,
        wallet: form.wallet,
        incurred_date: form.incurred_date,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(extractError(err, "Could not save the debt."));
      setSubmitting(false);
    }
  };

  const walletOptions = wallets.map((w) => ({ value: w.id, label: w.name }));

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      <SelectComponent
        label="Type"
        options={DIRECTION_OPTIONS}
        value={form.direction}
        onChange={update("direction")}
      />

      <InputComponent
        label="Counterparty (who)"
        type="text"
        value={form.counterparty}
        onChange={update("counterparty")}
        maxLength={100}
        required
      />

      <div className="field-row">
        <InputComponent
          label="Amount (¥)"
          type="number"
          value={form.principal}
          onChange={update("principal")}
          min="0"
          step="0.01"
          required
        />
        <SelectComponent
          label="Wallet"
          options={walletOptions}
          value={form.wallet}
          onChange={update("wallet")}
        />
      </div>

      <InputComponent
        label="Date"
        type="date"
        value={form.incurred_date}
        onChange={update("incurred_date")}
        required
      />

      <InputComponent
        label="Note (optional)"
        multiline
        rows={2}
        value={form.note}
        onChange={update("note")}
      />

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Add debt"}
      </button>
    </form>
  );
}
