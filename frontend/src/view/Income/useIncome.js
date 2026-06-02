// Income page data: incomes + income sources + wallets, with create/delete.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createIncome,
  deleteIncome,
  fetchIncomeSources,
  fetchIncomes,
  fetchWallets,
  updateIncome,
} from "../../utils/api.js";

export function useIncome() {
  const { logout } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [sources, setSources] = useState([]);
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
    const [incomeList, sourceList, walletList] = await Promise.all([
      fetchIncomes(),
      fetchIncomeSources(),
      fetchWallets(),
    ]);
    setIncomes(incomeList);
    setSources(sourceList);
    setWallets(walletList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load income.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const addIncome = useCallback(
    async (payload) => {
      await createIncome(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const editIncome = useCallback(
    async (id, payload) => {
      await updateIncome(id, payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removeIncome = useCallback(
    async (id) => {
      await deleteIncome(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    incomes,
    sources,
    wallets,
    loading,
    error,
    addIncome,
    editIncome,
    removeIncome,
  };
}
