// Settings logic: load + create + edit + delete wallets, categories, income sources.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createCategory,
  createCredit,
  createIncomeSource,
  createWallet,
  deleteCategory,
  deleteCredit,
  deleteIncomeSource,
  deleteWallet,
  fetchCategories,
  fetchCredits,
  fetchIncomeSources,
  fetchWallets,
  updateCategory,
  updateCredit,
  updateIncomeSource,
  updateWallet,
} from "../../utils/api.js";

export function useSettings() {
  const { logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [incomeSources, setIncomeSources] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [credits, setCredits] = useState([]);
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
    const [categoryList, sourceList, walletList, creditList] = await Promise.all([
      fetchCategories(),
      fetchIncomeSources(),
      fetchWallets(),
      fetchCredits(),
    ]);
    setCategories(categoryList);
    setIncomeSources(sourceList);
    setWallets(walletList);
    setCredits(creditList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  // Build a {add, edit, remove} action set bound to fetchAll-refresh.
  const actions = useCallback(
    (create, update, remove) => ({
      add: async (payload) => {
        await create(payload);
        await fetchAll();
      },
      edit: async (id, payload) => {
        await update(id, payload);
        await fetchAll();
      },
      remove: async (id) => {
        await remove(id);
        await fetchAll();
      },
    }),
    [fetchAll]
  );

  return {
    categories,
    incomeSources,
    wallets,
    credits,
    loading,
    error,
    categoryActions: actions(createCategory, updateCategory, deleteCategory),
    incomeSourceActions: actions(
      createIncomeSource,
      updateIncomeSource,
      deleteIncomeSource
    ),
    walletActions: actions(createWallet, updateWallet, deleteWallet),
    creditActions: actions(createCredit, updateCredit, deleteCredit),
  };
}
