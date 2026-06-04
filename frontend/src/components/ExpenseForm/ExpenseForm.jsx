import { useMemo, useState } from "react";

import { extractError } from "../../utils/errors.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";
import "./ExpenseForm.scss";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildPaymentOptions(wallets, credits) {
  const options = wallets.map((w) => ({
    value: `wallet:${w.id}`,
    label: `Wallet · ${w.name}`,
  }));
  credits.forEach((c) => {
    options.push({ value: `credit:${c.id}`, label: `Credit · ${c.name}` });
  });
  return options;
}

function initialPaymentSource(initial, wallets, credits) {
  if (initial?.wallet) return `wallet:${initial.wallet}`;
  if (wallets[0]) return `wallet:${wallets[0].id}`;
  if (credits[0]) return `credit:${credits[0].id}`;
  return "";
}

function initialState(initial, categories, wallets, credits) {
  return {
    title: initial?.title ?? "",
    amount: initial?.amount ?? "",
    category: initial?.category ?? categories[0]?.id ?? "",
    paymentSource: initialPaymentSource(initial, wallets, credits),
    spent_date: initial?.spent_date ?? initial?.charged_date ?? today(),
    note: initial?.note ?? "",
  };
}

export default function ExpenseForm({
  onSubmit,
  categories = [],
  wallets = [],
  credits = [],
  initial = null,
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() =>
    initialState(initial, categories, wallets, credits)
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const paymentOptions = useMemo(() => {
    if (isEdit) {
      return wallets.map((w) => ({
        value: `wallet:${w.id}`,
        label: `Wallet · ${w.name}`,
      }));
    }
    return buildPaymentOptions(wallets, credits);
  }, [isEdit, wallets, credits]);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Please enter a title.");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than 0.");
    if (!form.category) return setError("Please choose a category.");
    if (!form.paymentSource) return setError("Please choose how you paid.");
    if (!form.spent_date) return setError("Please choose a date.");

    const [payType, payId] = form.paymentSource.split(":");
    if (payType !== "wallet" && payType !== "credit") {
      return setError("Please choose how you paid.");
    }

    setSubmitting(true);
    try {
      const base = {
        title: form.title.trim(),
        amount: form.amount,
        category: form.category,
        note: form.note.trim(),
      };

      if (payType === "credit") {
        await onSubmit({
          ...base,
          payType: "credit",
          credit: payId,
          charged_date: form.spent_date,
        });
      } else {
        await onSubmit({
          ...base,
          payType: "wallet",
          wallet: payId,
          spent_date: form.spent_date,
        });
      }
    } catch (err) {
      setError(extractError(err, "Could not save."));
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

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
          label="Category"
          options={categoryOptions}
          value={form.category}
          onChange={update("category")}
        />
      </div>

      <div className="field-row">
        <SelectComponent
          label="Paid with"
          options={paymentOptions}
          value={form.paymentSource}
          onChange={update("paymentSource")}
        />
        <InputComponent
          label="Date"
          type="date"
          value={form.spent_date}
          onChange={update("spent_date")}
          required
        />
      </div>

      {!isEdit && credits.length > 0 && (
        <p className="expense-form__hint muted">
          Choose a credit card to record the charge on your card balance (not from a
          wallet).
        </p>
      )}

      <InputComponent
        label="Note (optional)"
        multiline
        rows={2}
        value={form.note}
        onChange={update("note")}
      />

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Saving..." : initial ? "Save changes" : "Add expense"}
      </button>
    </form>
  );
}
