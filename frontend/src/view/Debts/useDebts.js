// Debts page data: debts, wallets, counterparties, with CRUD + repayments.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createCounterparty,
  createDebt,
  createDebtPayment,
  deleteCounterparty,
  deleteDebt,
  deleteDebtPayment,
  fetchCounterparties,
  fetchDebts,
  fetchWallets,
  updateDebt,
} from "../../utils/api.js";

export function useDebts() {
  const { logout } = useAuth();
  const [debts, setDebts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
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
    const [debtList, walletList, counterpartyList] = await Promise.all([
      fetchDebts(),
      fetchWallets(),
      fetchCounterparties(),
    ]);
    setDebts(debtList);
    setWallets(walletList);
    setCounterparties(counterpartyList);
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

  const addCounterparty = useCallback(
    async (payload) => {
      await createCounterparty(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removeCounterparty = useCallback(
    async (id) => {
      await deleteCounterparty(id);
      await fetchAll();
    },
    [fetchAll]
  );

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
  };
}
