import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import CreditChargeForm from "../../components/CreditChargeForm/CreditChargeForm.jsx";
import CreditList from "../../components/CreditList/CreditList.jsx";
import CreditPayForm from "../../components/CreditPayForm/CreditPayForm.jsx";
import Loading from "../../components/Loading/Loading.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { usePagination } from "../../utils/usePagination.js";
import { useCredit } from "./useCredit.js";

const PAGE_SIZE = 6;

export default function Credit() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    credits,
    categories,
    wallets,
    loading,
    error,
    addCharge,
    editCharge,
    removeCharge,
    addPayment,
    removePayment,
  } = useCredit();
  const showLoading = useMinLoading(loading);

  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [payCredit, setPayCredit] = useState(null);
  const [deleteChargeTarget, setDeleteChargeTarget] = useState(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);

  const ready = credits.length > 0 && categories.length > 0;
  const { page, setPage, pageCount, pageItems } = usePagination(credits, PAGE_SIZE);

  useEffect(() => {
    const focusId = location.state?.focusCreditId;
    if (!focusId || !credits.length) return;

    const index = credits.findIndex((c) => String(c.id) === String(focusId));
    if (index >= 0) {
      setPage(Math.floor(index / PAGE_SIZE) + 1);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, credits, navigate, setPage]);

  const openCreateCharge = () => {
    setEditingCharge(null);
    setChargeModalOpen(true);
  };

  const openEditCharge = (charge) => {
    setEditingCharge(charge);
    setChargeModalOpen(true);
  };

  const handleChargeSubmit = async (payload) => {
    if (editingCharge) await editCharge(editingCharge.id, payload);
    else await addCharge(payload);
    setChargeModalOpen(false);
  };

  const handlePay = async (payload) => {
    await addPayment(payload);
    setPayCredit(null);
  };

  if (showLoading) {
    return <Loading fill label="Loading credit..." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__bar">
          <h2 className="panel__title">Credit</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreateCharge}
            disabled={!ready}
          >
            + Add charge
          </button>
        </div>

        <p className="muted credit-page__note">
          Card charges count as spending. Paying your bill moves money from a wallet and
          does not add to spending totals.
        </p>

        {error && <div className="alert alert--error">{error}</div>}
        {!credits.length && (
          <div className="alert alert--error">
            You need at least one credit card.{" "}
            <Link to="/settings">Go to Settings</Link>
          </div>
        )}
        {credits.length > 0 && !categories.length && (
          <div className="alert alert--error">
            You need at least one category.{" "}
            <Link to="/settings">Go to Settings</Link>
          </div>
        )}

        <CreditList
          credits={pageItems}
          onEditCharge={openEditCharge}
          onRequestDeleteCharge={setDeleteChargeTarget}
          onPay={setPayCredit}
          onRequestDeletePayment={setDeletePaymentTarget}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </section>

      <Modal
        open={chargeModalOpen}
        title={editingCharge ? "Edit charge" : "Add charge"}
        onClose={() => setChargeModalOpen(false)}
      >
        <CreditChargeForm
          onSubmit={handleChargeSubmit}
          credits={credits}
          categories={categories}
          initial={editingCharge}
        />
      </Modal>

      <Modal
        open={Boolean(payCredit)}
        title="Pay credit bill"
        onClose={() => setPayCredit(null)}
      >
        {payCredit && (
          <CreditPayForm
            credit={payCredit}
            wallets={wallets}
            onSubmit={handlePay}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteChargeTarget)}
        message={`Delete charge "${deleteChargeTarget?.title}"?`}
        onCancel={() => setDeleteChargeTarget(null)}
        onConfirm={async () => {
          await removeCharge(deleteChargeTarget.id);
          setDeleteChargeTarget(null);
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
