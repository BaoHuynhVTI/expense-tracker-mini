import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createWalletTransfer,
  deleteWalletTransfer,
  fetchWalletTransfers,
  fetchWallets,
  updateWalletTransfer,
} from "../../utils/api.js";

export function useTransfers() {
  const { logout } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401) {
        logout();
        return true;
      }
      return false;
    },
    [logout]
  );

  const fetchAll = useCallback(async () => {
    const [transferList, walletList] = await Promise.all([
      fetchWalletTransfers(),
      fetchWallets(),
    ]);
    setTransfers(transferList);
    setWallets(walletList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load transfers.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const addTransfer = useCallback(
    async (payload) => {
      await createWalletTransfer(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const editTransfer = useCallback(
    async (id, payload) => {
      await updateWalletTransfer(id, payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removeTransfer = useCallback(
    async (id) => {
      await deleteWalletTransfer(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    transfers,
    wallets,
    loading,
    error,
    addTransfer,
    editTransfer,
    removeTransfer,
  };
}
