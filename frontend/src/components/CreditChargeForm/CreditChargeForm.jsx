import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialState(initial, credits, categories) {
  return {
    title: initial?.title ?? "",
    amount: initial?.amount ?? "",
    credit: initial?.credit ?? credits[0]?.id ?? "",
    category: initial?.category ?? categories[0]?.id ?? "",
    charged_date: initial?.charged_date ?? today(),
    note: initial?.note ?? "",
  };
}

export default function CreditChargeForm({
  onSubmit,
  credits = [],
  categories = [],
  initial = null,
  fixedCredit = null,
}) {
  const [form, setForm] = useState(() => {
    const base = initialState(initial, credits, categories);
    if (fixedCredit) base.credit = fixedCredit;
    return base;
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Please enter a title.");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than 0.");
    if (!form.credit) return setError("Please choose a credit card.");
    if (!form.category) return setError("Please choose a category.");
    if (!form.charged_date) return setError("Please choose a date.");

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        amount: form.amount,
        credit: form.credit,
        category: form.category,
        charged_date: form.charged_date,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(extractError(err, "Could not save the charge."));
      setSubmitting(false);
    }
  };

  const creditOptions = credits.map((c) => ({ value: c.id, label: c.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      {!fixedCredit && (
        <SelectComponent
          label="Credit card"
          options={creditOptions}
          value={form.credit}
          onChange={update("credit")}
        />
      )}

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
          label="Category"
          options={categoryOptions}
          value={form.category}
          onChange={update("category")}
        />
      </div>

      <InputComponent
        label="Date"
        type="date"
        value={form.charged_date}
        onChange={update("charged_date")}
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
        {submitting ? "Saving..." : initial ? "Save changes" : "Add charge"}
      </button>
    </form>
  );
}
