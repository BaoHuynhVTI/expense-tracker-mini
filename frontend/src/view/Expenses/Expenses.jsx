import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

export default function Expenses() {
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

  const handleSubmit = async (payload) => {
    if (editing) await editExpense(editing.id, payload);
    else await addExpense(payload);
    setModalOpen(false);
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
