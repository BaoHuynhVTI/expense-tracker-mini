import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Loading from "../../components/Loading/Loading.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import TransferForm from "../../components/TransferForm/TransferForm.jsx";
import TransferList from "../../components/TransferList/TransferList.jsx";
import InputComponent from "../../components/InputComponent/InputComponent.jsx";
import { usePagination } from "../../utils/usePagination.js";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useTransfers } from "./useTransfers.js";

export default function Transfers() {
  const {
    transfers,
    wallets,
    loading,
    error,
    addTransfer,
    editTransfer,
    removeTransfer,
  } = useTransfers();
  const showLoading = useMinLoading(loading);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const ready = wallets.length >= 2;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transfers;
    return transfers.filter((transfer) => {
      const from = transfer.from_wallet_detail?.name?.toLowerCase() ?? "";
      const to = transfer.to_wallet_detail?.name?.toLowerCase() ?? "";
      const note = transfer.note?.toLowerCase() ?? "";
      return from.includes(query) || to.includes(query) || note.includes(query);
    });
  }, [transfers, search]);

  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 10);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (transfer) => {
    setEditing(transfer);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) await editTransfer(editing.id, payload);
    else await addTransfer(payload);
    setModalOpen(false);
  };

  if (showLoading) {
    return <Loading fill label="Loading transfers..." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__bar">
          <h2 className="panel__title">Transfers</h2>
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreate}
            disabled={!ready}
          >
            + Transfer
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {!error && !ready && (
          <div className="alert alert--error">
            You need at least two wallets. <Link to="/settings">Go to Settings</Link>
          </div>
        )}

        <div className="filters">
          <InputComponent
            type="text"
            placeholder="Search by wallet or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <TransferList
          transfers={pageItems}
          onEdit={openEdit}
          onRequestDelete={setDeleteTarget}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </section>

      <Modal
        open={modalOpen}
        title={editing ? "Edit transfer" : "Transfer between wallets"}
        onClose={() => setModalOpen(false)}
      >
        <TransferForm
          key={editing?.id ?? "new"}
          onSubmit={handleSubmit}
          wallets={wallets}
          initial={editing}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete transfer from "${deleteTarget?.from_wallet_detail?.name}" to "${deleteTarget?.to_wallet_detail?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeTransfer(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
