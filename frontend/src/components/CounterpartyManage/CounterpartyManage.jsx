import { useState } from "react";

import { extractError } from "../../utils/errors.js";
import { formatJPY } from "../../utils/format.js";
import InputComponent from "../InputComponent/InputComponent.jsx";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog.jsx";
import "./CounterpartyManage.scss";

export default function CounterpartyManage({
  counterparties,
  onAdd,
  onRemove,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const submitAdd = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter a name.");
    setBusy(true);
    try {
      await onAdd({ name: trimmed });
      setName("");
    } catch (err) {
      setError(extractError(err, "Could not add counterparty."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="counterparty-manage">
      <form className="counterparty-manage__add" onSubmit={submitAdd}>
        {error && <div className="alert alert--error">{error}</div>}
        <InputComponent
          label="New counterparty"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Name"
        />
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Adding..." : "Add"}
        </button>
      </form>

      {!counterparties.length ? (
        <p className="muted">No counterparties yet. Add someone above.</p>
      ) : (
        <ul className="counterparty-manage__list">
          {counterparties.map((cp) => (
            <li key={cp.id} className="counterparty-manage__row">
              <div className="counterparty-manage__name">{cp.name}</div>
              <div className="counterparty-manage__totals">
                <span className="counterparty-manage__owe">
                  I owe <strong>{formatJPY(cp.payable_remaining)}</strong>
                </span>
                <span className="counterparty-manage__owed">
                  Owed to me <strong>{formatJPY(cp.receivable_remaining)}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn--danger btn--small"
                onClick={() => setDeleteTarget(cp)}
                disabled={Number(cp.debt_count) > 0}
                title={
                  Number(cp.debt_count) > 0
                    ? "Remove linked debts first"
                    : "Delete counterparty"
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete counterparty "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await onRemove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
