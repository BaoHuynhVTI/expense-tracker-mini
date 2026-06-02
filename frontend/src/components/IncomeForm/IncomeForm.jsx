import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialState(initial, sources, wallets) {
  return {
    title: initial?.title ?? "",
    amount: initial?.amount ?? "",
    source: initial?.source ?? sources[0]?.id ?? "",
    wallet: initial?.wallet ?? wallets[0]?.id ?? "",
    received_date: initial?.received_date ?? today(),
    note: initial?.note ?? "",
  };
}

export default function IncomeForm({
  onSubmit,
  sources = [],
  wallets = [],
  initial = null,
}) {
  const [form, setForm] = useState(() => initialState(initial, sources, wallets));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Please enter a title.");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than 0.");
    if (!form.source) return setError("Please choose an income source.");
    if (!form.wallet) return setError("Please choose a wallet.");
    if (!form.received_date) return setError("Please choose a date.");

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        amount: form.amount,
        source: form.source,
        wallet: form.wallet,
        received_date: form.received_date,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(extractError(err, "Could not save the income."));
      setSubmitting(false);
    }
  };

  const sourceOptions = sources.map((s) => ({ value: s.id, label: s.name }));
  const walletOptions = wallets.map((w) => ({ value: w.id, label: w.name }));

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      <InputComponent
        label="Title"
        type="text"
        value={form.title}
        onChange={update("title")}
        maxLength={100}
        required
      />

      <div className="field-row">
        <InputComponent
          label="Amount (¥)"
          type="number"
          value={form.amount}
          onChange={update("amount")}
          min="0"
          step="0.01"
          required
        />
        <SelectComponent
          label="Source"
          options={sourceOptions}
          value={form.source}
          onChange={update("source")}
        />
      </div>

      <div className="field-row">
        <SelectComponent
          label="Wallet"
          options={walletOptions}
          value={form.wallet}
          onChange={update("wallet")}
        />
        <InputComponent
          label="Date"
          type="date"
          value={form.received_date}
          onChange={update("received_date")}
          required
        />
      </div>

      <InputComponent
        label="Note (optional)"
        multiline
        rows={2}
        value={form.note}
        onChange={update("note")}
      />

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Saving..." : initial ? "Save changes" : "Add income"}
      </button>
    </form>
  );
}
