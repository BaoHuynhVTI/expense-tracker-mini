// Expenses page data: expenses + categories + wallets, with create/delete.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  createCreditCharge,
  createExpense,
  deleteExpense,
  fetchCategories,
  fetchCredits,
  fetchExpenses,
  fetchWallets,
  updateExpense,
} from "../../utils/api.js";

export function filterExpenses(expenses, search, categoryId) {
  const query = search.trim().toLowerCase();
  return expenses.filter((expense) => {
    const matchesSearch = expense.title.toLowerCase().includes(query);
    const matchesCategory =
      categoryId === "all" || String(expense.category) === String(categoryId);
    return matchesSearch && matchesCategory;
  });
}

export function useExpenses() {
  const { logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
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
    const [expenseList, categoryList, walletList, creditList] = await Promise.all([
      fetchExpenses(),
      fetchCategories(),
      fetchWallets(),
      fetchCredits(),
    ]);
    setExpenses(expenseList);
    setCategories(categoryList);
    setWallets(walletList);
    setCredits(creditList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      if (!handleAuthError(err)) setError("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [fetchAll, handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const addExpense = useCallback(
    async (payload) => {
      if (payload.payType === "credit") {
        await createCreditCharge({
          title: payload.title,
          amount: payload.amount,
          category: payload.category,
          credit: payload.credit,
          charged_date: payload.charged_date,
          note: payload.note,
        });
      } else {
        await createExpense({
          title: payload.title,
          amount: payload.amount,
          category: payload.category,
          wallet: payload.wallet,
          spent_date: payload.spent_date,
          note: payload.note,
        });
      }
      await fetchAll();
    },
    [fetchAll]
  );

  const editExpense = useCallback(
    async (id, payload) => {
      await updateExpense(id, {
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        wallet: payload.wallet,
        spent_date: payload.spent_date,
        note: payload.note,
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const removeExpense = useCallback(
    async (id) => {
      await deleteExpense(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    expenses,
    categories,
    wallets,
    credits,
    loading,
    error,
    addExpense,
    editExpense,
    removeExpense,
  };
}
