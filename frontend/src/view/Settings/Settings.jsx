import { useState } from "react";

import Loading from "../../components/Loading/Loading.jsx";
import ColorPicker from "../../components/ColorPicker/ColorPicker.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import { extractError } from "../../utils/errors.js";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CREDIT_COLOR,
  DEFAULT_INCOME_COLOR,
  DEFAULT_WALLET_COLOR,
  formatJPY,
} from "../../utils/format.js";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useSettings } from "./useSettings.js";
import "./Settings.scss";

const PAGE_SIZE = 6;

function NamedColorForm({ initial, defaultColor, submitLabel, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? defaultColor);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter a name.");
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color });
    } catch (err) {
      setError(extractError(err, "Could not save."));
      setBusy(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <InputComponent
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
      />
      <ColorPicker value={color} onChange={setColor} />
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function WalletForm({ initial, submitLabel, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_WALLET_COLOR);
  const [balance, setBalance] = useState(
    initial ? String(initial.initial_balance) : "0"
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter a name.");
    if (Number(balance) < 0) return setError("Balance cannot be negative.");
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color, initial_balance: balance || "0" });
    } catch (err) {
      setError(extractError(err, "Could not save the wallet."));
      setBusy(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <InputComponent
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
      />
      <InputComponent
        label="Initial balance (¥)"
        type="number"
        min="0"
        step="0.01"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
      />
      <ColorPicker value={color} onChange={setColor} />
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function CreditForm({ initial, submitLabel, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_CREDIT_COLOR);
  const [limit, setLimit] = useState(
    initial ? String(initial.credit_limit) : ""
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter a name.");
    if (!(Number(limit) > 0)) return setError("Credit limit must be greater than 0.");
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color, credit_limit: limit });
    } catch (err) {
      setError(extractError(err, "Could not save the credit card."));
      setBusy(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <InputComponent
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
      />
      <InputComponent
        label="Credit limit (¥)"
        type="number"
        min="0"
        step="0.01"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
      />
      <ColorPicker value={color} onChange={setColor} />
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Panel({
  title,
  addLabel,
  items,
  actions,
  FormComponent,
  formProps,
  renderMeta,
  describe,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { page, setPage, pageCount, pageItems } = usePagination(items, PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) await actions.edit(editing.id, payload);
    else await actions.add(payload);
    setModalOpen(false);
  };

  return (
    <section className={`settings-panel${open ? " settings-panel--open" : ""}`}>
      <div className="settings-panel__header">
        <button
          type="button"
          className="settings-panel__toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="settings-panel__chevron" aria-hidden="true" />
          <h2 className="settings-panel__title">{title}</h2>
          <span className="settings-panel__count">{items.length}</span>
        </button>
        <button
          type="button"
          className="btn btn--primary btn--small"
          onClick={openCreate}
        >
          + Add
        </button>
      </div>

      {open && (
        <div className="settings-panel__body">
          {items.length ? (
            <>
              <ul className="settings-items">
                {pageItems.map((item) => (
                  <li key={item.id} className="settings-item">
                    <span
                      className="settings-item__dot"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                    <span className="settings-item__name">{item.name}</span>
                    {renderMeta && (
                      <span className="settings-item__meta">{renderMeta(item)}</span>
                    )}
                    <div className="settings-item__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => {
                          setEditing(item);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          ) : (
            <p className="muted">No items yet.</p>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit ${title.toLowerCase()}` : addLabel}
        onClose={() => setModalOpen(false)}
        size="sm"
      >
        <FormComponent
          {...formProps}
          initial={editing}
          submitLabel={editing ? "Save changes" : "Add"}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={describe(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await actions.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}

export default function Settings() {
  const {
    categories,
    incomeSources,
    wallets,
    credits,
    loading,
    error,
    categoryActions,
    incomeSourceActions,
    walletActions,
    creditActions,
  } = useSettings();
  const showLoading = useMinLoading(loading);

  if (showLoading) {
    return <Loading fill label="Loading settings..." />;
  }

  return (
    <div className="settings">
      {error && <div className="alert alert--error">{error}</div>}
      <div className="settings__stack">
        <Panel
          title="Wallets"
          addLabel="Add wallet"
          items={wallets}
          actions={walletActions}
          FormComponent={WalletForm}
          formProps={{}}
          defaultOpen
          renderMeta={(w) => formatJPY(w.balance)}
          describe={(w) => `Delete wallet "${w?.name}"? It can't be deleted while it has transactions.`}
        />
        <Panel
          title="Credit cards"
          addLabel="Add credit card"
          items={credits}
          actions={creditActions}
          FormComponent={CreditForm}
          formProps={{}}
          renderMeta={(c) => `${formatJPY(c.balance)} / ${formatJPY(c.credit_limit)}`}
          describe={(c) => `Delete credit card "${c?.name}"? It can't be deleted while it has charges.`}
        />
        <Panel
          title="Categories"
          addLabel="Add category"
          items={categories}
          actions={categoryActions}
          FormComponent={NamedColorForm}
          formProps={{ defaultColor: DEFAULT_CATEGORY_COLOR }}
          describe={(c) => `Delete category "${c?.name}"? It can't be deleted while it has expenses.`}
        />
        <Panel
          title="Income sources"
          addLabel="Add income source"
          items={incomeSources}
          actions={incomeSourceActions}
          FormComponent={NamedColorForm}
          formProps={{ defaultColor: DEFAULT_INCOME_COLOR }}
          describe={(s) => `Delete income source "${s?.name}"? It can't be deleted while it has income.`}
        />
      </div>
    </div>
  );
}
