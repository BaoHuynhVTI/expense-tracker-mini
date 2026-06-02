import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createCreditCharge,
  createCreditPayment,
  deleteCreditCharge,
  deleteCreditPayment,
  fetchCategories,
  fetchCreditsActivity,
  fetchWallets,
  updateCreditCharge,
} from "../../utils/api.js";

export function useCredit() {
  const { logout } = useAuth();
  const [credits, setCredits] = useState([]);
  const [categories, setCategories] = useState([]);
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
    const [creditList, categoryList, walletList] = await Promise.all([
      fetchCreditsActivity(),
      fetchCategories(),
      fetchWallets(),
    ]);
    setCredits(creditList);
    setCategories(categoryList);
    setWallets(walletList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load credit data.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const addCharge = useCallback(
    async (payload) => {
      await createCreditCharge(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const editCharge = useCallback(
    async (id, payload) => {
      await updateCreditCharge(id, payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removeCharge = useCallback(
    async (id) => {
      await deleteCreditCharge(id);
      await fetchAll();
    },
    [fetchAll]
  );

  const addPayment = useCallback(
    async (payload) => {
      await createCreditPayment(payload);
      await fetchAll();
    },
    [fetchAll]
  );

  const removePayment = useCallback(
    async (id) => {
      await deleteCreditPayment(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
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
  };
}
