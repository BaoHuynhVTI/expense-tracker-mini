import { useMemo, useState } from "react";

import { extractError } from "../../utils/errors.js";
import { formatJPY } from "../../utils/format.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialState(initial, wallets) {
  const fromId = initial?.from_wallet ?? wallets[0]?.id ?? "";
  const toDefault = wallets.find((w) => String(w.id) !== String(fromId));

  return {
    from_wallet: fromId,
    to_wallet: initial?.to_wallet ?? toDefault?.id ?? "",
    amount: initial?.amount ?? "",
    transfer_date: initial?.transfer_date ?? today(),
    note: initial?.note ?? "",
  };
}

export default function TransferForm({ onSubmit, wallets = [], initial = null }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => initialState(initial, wallets));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fromWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(form.from_wallet)),
    [wallets, form.from_wallet]
  );

  const availableBalance = useMemo(() => {
    let balance = Number(fromWallet?.balance ?? 0);
    if (
      isEdit &&
      initial &&
      String(initial.from_wallet) === String(form.from_wallet)
    ) {
      balance += Number(initial.amount);
    }
    return balance;
  }, [fromWallet, isEdit, initial, form.from_wallet]);

  const toOptions = useMemo(
    () =>
      wallets
        .filter((w) => String(w.id) !== String(form.from_wallet))
        .map((w) => ({ value: w.id, label: w.name })),
    [wallets, form.from_wallet]
  );

  const fromOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} · ${formatJPY(w.balance)}`,
  }));

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "from_wallet" && String(value) === String(prev.to_wallet)) {
        const fallback = wallets.find((w) => String(w.id) !== String(value));
        next.to_wallet = fallback?.id ?? "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.from_wallet) return setError("Please choose a source wallet.");
    if (!form.to_wallet) return setError("Please choose a destination wallet.");
    if (String(form.from_wallet) === String(form.to_wallet)) {
      return setError("Source and destination must be different.");
    }
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than 0.");
    if (!form.transfer_date) return setError("Please choose a date.");

    if (Number(form.amount) > availableBalance) {
      return setError(
        `Insufficient balance. ${fromWallet?.name ?? "Wallet"} has ${formatJPY(availableBalance)} available.`
      );
    }

    setSubmitting(true);
    try {
      await onSubmit({
        from_wallet: form.from_wallet,
        to_wallet: form.to_wallet,
        amount: form.amount,
        transfer_date: form.transfer_date,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(extractError(err, "Could not save the transfer."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      <div className="field-row">
        <SelectComponent
          label="From wallet"
          options={fromOptions}
          value={form.from_wallet}
          onChange={update("from_wallet")}
        />
        <SelectComponent
          label="To wallet"
          options={toOptions}
          value={form.to_wallet}
          onChange={update("to_wallet")}
          disabled={!toOptions.length}
        />
      </div>

      {fromWallet && (
        <p className="muted expense-form__hint">
          Available in <strong>{fromWallet.name}</strong>:{" "}
          {formatJPY(availableBalance)}
        </p>
      )}

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
        <InputComponent
          label="Date"
          type="date"
          value={form.transfer_date}
          onChange={update("transfer_date")}
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
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Transfer"}
      </button>
    </form>
  );
}
