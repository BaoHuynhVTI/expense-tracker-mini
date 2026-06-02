import { useState } from "react";
import { Link } from "react-router-dom";

import Loading from "../../components/Loading/Loading.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import DebtForm from "../../components/DebtForm/DebtForm.jsx";
import DebtList from "../../components/DebtList/DebtList.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import RepayForm from "../../components/RepayForm/RepayForm.jsx";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useDebts } from "./useDebts.js";

export default function Debts() {
  const {
    debts,
    wallets,
    loading,
    error,
    addDebt,
    editDebt,
    removeDebt,
    addPayment,
    removePayment,
  } = useDebts();
  const showLoading = useMinLoading(loading);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [repayDebt, setRepayDebt] = useState(null);
  const [deleteDebtTarget, setDeleteDebtTarget] = useState(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);

  const ready = wallets.length > 0;
  const { page, setPage, pageCount, pageItems } = usePagination(debts, 8);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (debt) => {
    setEditing(debt);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) await editDebt(editing.id, payload);
    else await addDebt(payload);
    setModalOpen(false);
  };

  const handleRepay = async (payload) => {
    await addPayment(payload);
    setRepayDebt(null);
  };

  if (showLoading) {
    return <Loading fill label="Loading debts..." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__bar">
          <h2 className="panel__title">Debts</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreate}
            disabled={!ready}
          >
            + Add debt
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {!ready && (
          <div className="alert alert--error">
            You need at least one wallet first. <Link to="/settings">Go to Settings</Link>
          </div>
        )}

        <>
          <DebtList
            debts={pageItems}
            onEdit={openEdit}
            onRequestDelete={setDeleteDebtTarget}
            onRepay={setRepayDebt}
            onRequestDeletePayment={setDeletePaymentTarget}
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      </section>

      <Modal
        open={modalOpen}
        title={editing ? "Edit debt" : "Add debt"}
        onClose={() => setModalOpen(false)}
      >
        <DebtForm onSubmit={handleSubmit} wallets={wallets} initial={editing} />
      </Modal>

      <Modal
        open={Boolean(repayDebt)}
        title={repayDebt?.direction === "payable" ? "Repay" : "Collect"}
        onClose={() => setRepayDebt(null)}
      >
        {repayDebt && (
          <RepayForm debt={repayDebt} wallets={wallets} onSubmit={handleRepay} />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteDebtTarget)}
        message={`Delete the debt with "${deleteDebtTarget?.counterparty}"? All related payments will also be deleted.`}
        onCancel={() => setDeleteDebtTarget(null)}
        onConfirm={async () => {
          await removeDebt(deleteDebtTarget.id);
          setDeleteDebtTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletePaymentTarget)}
        message="Delete this payment?"
        onCancel={() => setDeletePaymentTarget(null)}
        onConfirm={async () => {
          await removePayment(deletePaymentTarget.id);
          setDeletePaymentTarget(null);
        }}
      />
    </div>
  );
}
