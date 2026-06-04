import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Loading from "../../components/Loading/Loading.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import CounterpartyManage from "../../components/CounterpartyManage/CounterpartyManage.jsx";
import DebtForm from "../../components/DebtForm/DebtForm.jsx";
import DebtList from "../../components/DebtList/DebtList.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import RepayForm from "../../components/RepayForm/RepayForm.jsx";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useDebts } from "./useDebts.js";
import "./Debts.scss";

export default function Debts() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    debts,
    wallets,
    counterparties,
    loading,
    error,
    addCounterparty,
    removeCounterparty,
    addDebt,
    editDebt,
    removeDebt,
    addPayment,
    removePayment,
  } = useDebts();
  const showLoading = useMinLoading(loading);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [debtDraft, setDebtDraft] = useState(null);
  const [repayDebt, setRepayDebt] = useState(null);
  const [deleteDebtTarget, setDeleteDebtTarget] = useState(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [showCounterparties, setShowCounterparties] = useState(false);

  const hasWallets = wallets.length > 0;
  const hasCounterparties = counterparties.length > 0;
  const canAddDebt = hasWallets && hasCounterparties;

  const { page, setPage, pageCount, pageItems } = usePagination(debts, 8);

  useEffect(() => {
    const state = location.state;
    if (!state?.openDebtCreate || !state?.debtDraft) return;

    setEditing(null);
    setDebtDraft(state.debtDraft);
    setModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const openCreate = () => {
    setEditing(null);
    setDebtDraft(null);
    setModalOpen(true);
  };

  const openEdit = (debt) => {
    setEditing(debt);
    setDebtDraft(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDebtDraft(null);
  };

  const handleSubmit = async (payload) => {
    if (editing) await editDebt(editing.id, payload);
    else await addDebt(payload);
    closeModal();
  };

  const handleRepay = async (payload) => {
    await addPayment(payload);
    setRepayDebt(null);
  };

  if (showLoading) {
    return <Loading fill label="Loading debts..." />;
  }

  return (
    <div className="page debts-page">
      <div className="debts-page__alerts">
        {error && <div className="alert alert--error">{error}</div>}
        {!hasWallets && (
          <div className="alert alert--error">
            You need at least one wallet first. <Link to="/settings">Go to Settings</Link>
          </div>
        )}
        {hasWallets && !hasCounterparties && (
          <div className="alert alert--error">
            Turn on Counterparties (top right) and add someone before creating a debt.
          </div>
        )}
      </div>

      <div
        className={`debts-page__split${
          showCounterparties ? " debts-page__split--with-sidebar" : ""
        }`}
      >
        <section className="panel debts-page__records">
          <div className="panel__bar">
            <h2 className="panel__title">Debt records</h2>
            <div className="panel__actions">
              <button
                type="button"
                className={`btn btn--ghost${
                  showCounterparties ? " btn--active" : ""
                }`}
                onClick={() => setShowCounterparties((open) => !open)}
                aria-pressed={showCounterparties}
              >
                {showCounterparties ? "Hide counterparties" : "Counterparties"}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={openCreate}
                disabled={!canAddDebt}
              >
                + Add debt
              </button>
            </div>
          </div>

          <DebtList
            debts={pageItems}
            onEdit={openEdit}
            onRequestDelete={setDeleteDebtTarget}
            onRepay={setRepayDebt}
            onRequestDeletePayment={setDeletePaymentTarget}
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </section>

        <div
          className={`debts-page__counterparties-wrap${
            showCounterparties ? " is-open" : ""
          }`}
        >
          {showCounterparties && (
          <aside className="debts-page__counterparties">
            <div className="debts-page__counterparties-head">
              <h3 className="debts-page__counterparties-title">Counterparties</h3>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => setShowCounterparties(false)}
                aria-label="Hide counterparties"
              >
                ×
              </button>
            </div>
            <CounterpartyManage
              counterparties={counterparties}
              onAdd={addCounterparty}
              onRemove={removeCounterparty}
            />
          </aside>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit debt" : "Add debt"}
        onClose={closeModal}
      >
        <DebtForm
          key={`${editing?.id ?? "new"}-${counterparties.length}`}
          onSubmit={handleSubmit}
          wallets={wallets}
          counterparties={counterparties}
          initial={editing ?? debtDraft}
        />
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
        message={`Delete the debt with "${deleteDebtTarget?.counterparty_detail?.name}"? All related payments will also be deleted.`}
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
