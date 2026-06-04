import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { formatJPY } from "../../utils/format.js";
import { getWalletOverdraft } from "../../utils/walletOverdraft.js";

import Loading from "../../components/Loading/Loading.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import ExpenseForm from "../../components/ExpenseForm/ExpenseForm.jsx";
import ExpenseList from "../../components/ExpenseList/ExpenseList.jsx";
import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import SelectComponent from "../../components/SelectComponent/SelectComponent.jsx";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { filterExpenses, useExpenses } from "./useExpenses.js";

function buildDebtDraftFromExpense(payload, overdraft) {
  const shortfall =
    Math.round((overdraft.shortfall + Number.EPSILON) * 100) / 100;

  return {
    direction: "payable",
    principal: String(shortfall),
    wallet: payload.wallet,
    incurred_date: payload.spent_date,
    note: payload.title
      ? `Borrowed for expense: ${payload.title}`
      : "Borrowed to cover wallet overdraft",
  };
}

export default function Expenses() {
  const navigate = useNavigate();
  const {
    expenses,
    categories,
    wallets,
    credits,
    loading,
    error,
    addExpense,
    editExpense,
    removeExpense,
  } = useExpenses();
  const showLoading = useMinLoading(loading);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [overdraftPrompt, setOverdraftPrompt] = useState(null);

  const ready =
    categories.length > 0 && (wallets.length > 0 || credits.length > 0);

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  );

  const filtered = useMemo(
    () => filterExpenses(expenses, search, categoryFilter),
    [expenses, search, categoryFilter]
  );

  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 10);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setModalOpen(true);
  };

  const saveExpense = async (payload) => {
    if (editing) await editExpense(editing.id, payload);
    else await addExpense(payload);
    setModalOpen(false);
  };

  const handleSubmit = async (payload) => {
    if (!editing && payload.payType === "wallet") {
      const overdraft = getWalletOverdraft(wallets, payload.wallet, payload.amount);
      if (overdraft) {
        setOverdraftPrompt({ payload, overdraft });
        return;
      }
    }
    await saveExpense(payload);
  };

  const confirmOverdraft = async () => {
    if (!overdraftPrompt) return;
    const { payload, overdraft } = overdraftPrompt;
    await saveExpense(payload);
    setOverdraftPrompt(null);
    navigate("/debts", {
      state: {
        openDebtCreate: true,
        debtDraft: buildDebtDraftFromExpense(payload, overdraft),
      },
    });
  };

  if (showLoading) {
    return <Loading fill label="Loading expenses..." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__bar">
          <h2 className="panel__title">Expenses</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreate}
            disabled={!ready}
          >
            + Add expense
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {!error && !ready && (
          <div className="alert alert--error">
            You need at least one category and a wallet or credit card.{" "}
            <Link to="/settings">Go to Settings</Link>
          </div>
        )}

        <div className="filters">
          <InputComponent
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SelectComponent
            options={filterOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>

        <>
          <ExpenseList
            expenses={pageItems}
            onEdit={openEdit}
            onRequestDelete={setDeleteTarget}
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      </section>

      <Modal
        open={modalOpen}
        title={editing ? "Edit expense" : "Add expense"}
        onClose={() => setModalOpen(false)}
      >
        <ExpenseForm
          onSubmit={handleSubmit}
          categories={categories}
          wallets={wallets}
          credits={credits}
          initial={editing}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(overdraftPrompt)}
        title="Insufficient wallet balance"
        message={
          overdraftPrompt
            ? `Wallet "${overdraftPrompt.overdraft.wallet.name}" has ${formatJPY(
                overdraftPrompt.overdraft.balance
              )} left. Spending ${formatJPY(
                overdraftPrompt.overdraft.expenseAmount
              )} will leave it ${formatJPY(
                -overdraftPrompt.overdraft.shortfall
              )} — record a debt (money borrowed from someone). Save the expense and open Debts to add one?`
            : ""
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmVariant="primary"
        onCancel={() => setOverdraftPrompt(null)}
        onConfirm={confirmOverdraft}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete expense "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
