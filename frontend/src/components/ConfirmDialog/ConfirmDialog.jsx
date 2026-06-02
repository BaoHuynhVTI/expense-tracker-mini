import { useState } from "react";

import Modal from "../Modal/Modal.jsx";
import "./ConfirmDialog.scss";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
