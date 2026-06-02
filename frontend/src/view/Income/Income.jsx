import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Loading from "../../components/Loading/Loading.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import IncomeForm from "../../components/IncomeForm/IncomeForm.jsx";
import IncomeList from "../../components/IncomeList/IncomeList.jsx";
import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import SelectComponent from "../../components/SelectComponent/SelectComponent.jsx";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useIncome } from "./useIncome.js";

export default function Income() {
  const {
    incomes,
    sources,
    wallets,
    loading,
    error,
    addIncome,
    editIncome,
    removeIncome,
  } = useIncome();
  const showLoading = useMinLoading(loading);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const ready = sources.length > 0 && wallets.length > 0;

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All sources" },
      ...sources.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sources]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incomes.filter((income) => {
      const matchesSearch = income.title.toLowerCase().includes(query);
      const matchesSource =
        sourceFilter === "all" || String(income.source) === String(sourceFilter);
      return matchesSearch && matchesSource;
    });
  }, [incomes, search, sourceFilter]);

  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 10);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (income) => {
    setEditing(income);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) await editIncome(editing.id, payload);
    else await addIncome(payload);
    setModalOpen(false);
  };

  if (showLoading) {
    return <Loading fill label="Loading income..." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__bar">
          <h2 className="panel__title">Income</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreate}
            disabled={!ready}
          >
            + Add income
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {!ready && (
          <div className="alert alert--error">
            You need at least one wallet and one income source first.{" "}
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
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          />
        </div>

        <>
          <IncomeList
            incomes={pageItems}
            onEdit={openEdit}
            onRequestDelete={setDeleteTarget}
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      </section>

      <Modal
        open={modalOpen}
        title={editing ? "Edit income" : "Add income"}
        onClose={() => setModalOpen(false)}
      >
        <IncomeForm
          onSubmit={handleSubmit}
          sources={sources}
          wallets={wallets}
          initial={editing}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete income "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeIncome(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
