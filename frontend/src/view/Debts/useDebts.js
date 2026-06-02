// Debts page data: debts + wallets, with create/delete + repayments.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createDebt,
  createDebtPayment,
  deleteDebt,
  deleteDebtPayment,
  fetchDebts,
  fetchWallets,
  updateDebt,
} from "../../utils/api.js";

export function useDebts() {
  const { logout } = useAuth();
  const [debts, setDebts] = useState([]);
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
    const [debtList, walletList] = await Promise.all([fetchDebts(), fetchWallets()]);
    setDebts(debtList);
    setWallets(walletList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load debts.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const addDebt = useCallback(
    async (payload) => {
      await createDebt(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const editDebt = useCallback(
    async (id, payload) => {
      await updateDebt(id, payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removeDebt = useCallback(
    async (id) => {
      await deleteDebt(id);
      await fetchAll();
    },
    [fetchAll]
  );

  const addPayment = useCallback(
    async (payload) => {
      await createDebtPayment(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removePayment = useCallback(
    async (id) => {
      await deleteDebtPayment(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    debts,
    wallets,
    loading,
    error,
    addDebt,
    editDebt,
    removeDebt,
    addPayment,
    removePayment,
  };
}
