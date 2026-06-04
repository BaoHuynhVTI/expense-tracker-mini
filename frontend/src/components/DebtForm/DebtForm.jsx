import { useMemo, useState } from "react";

import { extractError } from "../../utils/errors.js";
import { formatJPY } from "../../utils/format.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import SelectComponent from "../SelectComponent/SelectComponent.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const DIRECTION_OPTIONS = [
  { value: "payable", label: "I borrowed (I owe)" },
  { value: "receivable", label: "I lent (owed to me)" },
];

function resolveCounterpartyId(initial, counterparties) {
  if (initial?.counterparty != null) return String(initial.counterparty);
  if (initial?.counterparty_detail?.id != null) {
    return String(initial.counterparty_detail.id);
  }
  return counterparties[0]?.id != null ? String(counterparties[0].id) : "";
}

function initialState(initial, wallets, counterparties) {
  const affectsWallet = initial?.affects_wallet ?? true;
  return {
    direction: initial?.direction ?? "payable",
    counterparty: resolveCounterpartyId(initial, counterparties),
    principal: initial?.principal ?? "",
    affects_wallet: affectsWallet,
    wallet: initial?.wallet ?? (affectsWallet ? wallets[0]?.id ?? "" : ""),
    incurred_date: initial?.incurred_date ?? today(),
    note: initial?.note ?? "",
  };
}

function walletImpactHint(direction, principal, affectsWallet) {
  const amount = formatJPY(principal || 0);
  if (!affectsWallet) {
    return "Track who owes what only — wallet balances will not change.";
  }
  if (direction === "payable") {
    return `Adds ${amount} to the selected wallet (money you received).`;
  }
  return `Subtracts ${amount} from the selected wallet (money you lent out).`;
}

export default function DebtForm({
  onSubmit,
  wallets = [],
  counterparties = [],
  initial = null,
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() =>
    initialState(initial, wallets, counterparties)
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const counterpartyOptions = useMemo(
    () => counterparties.map((cp) => ({ value: cp.id, label: cp.name })),
    [counterparties]
  );

  const impactHint = useMemo(
    () => walletImpactHint(form.direction, form.principal, form.affects_wallet),
    [form.direction, form.principal, form.affects_wallet]
  );

  const update = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "affects_wallet" && !value) {
        next.wallet = "";
      }
      if (field === "affects_wallet" && value && !next.wallet) {
        next.wallet = wallets[0]?.id ?? "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.counterparty) return setError("Please choose a counterparty.");
    if (!(Number(form.principal) > 0)) return setError("Amount must be greater than 0.");
    if (!form.incurred_date) return setError("Please choose a date.");
    if (form.affects_wallet && !form.wallet) {
      return setError("Please choose a wallet.");
    }

    setSubmitting(true);
    try {
      await onSubmit({
        direction: form.direction,
        counterparty: form.counterparty,
        principal: form.principal,
        affects_wallet: form.affects_wallet,
        wallet: form.affects_wallet ? form.wallet : null,
        incurred_date: form.incurred_date,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(extractError(err, "Could not save the debt."));
    } finally {
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

      <SelectComponent
        label="Counterparty"
        options={counterpartyOptions}
        value={form.counterparty}
        onChange={update("counterparty")}
        disabled={!counterpartyOptions.length}
      />

      {!counterpartyOptions.length && (
        <p className="muted expense-form__hint">
          Turn on Counterparties on the right and add someone first.
        </p>
      )}

      <InputComponent
        label="Amount (¥)"
        type="number"
        value={form.principal}
        onChange={update("principal")}
        min="0"
        step="0.01"
        required
      />

      <label className="debt-form__check">
        <input
          type="checkbox"
          checked={form.affects_wallet}
          onChange={update("affects_wallet")}
        />
        <span>Affects wallet balance</span>
      </label>

      <p className="muted expense-form__hint">{impactHint}</p>

      {form.affects_wallet && (
        <SelectComponent
          label="Wallet"
          options={walletOptions}
          value={form.wallet}
          onChange={update("wallet")}
        />
      )}

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

      <button
        type="submit"
        className="btn btn--primary"
        disabled={submitting || !counterpartyOptions.length}
      >
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Add debt"}
      </button>
    </form>
  );
}
