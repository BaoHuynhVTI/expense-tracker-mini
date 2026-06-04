// Dashboard overview data: summary + wallets + monthly income/expense series.
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchCategories,
  fetchCredits,
  fetchMonthlyStats,
  fetchSummary,
  fetchWallets,
} from "../../utils/api.js";

export function useDashboardData() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [credits, setCredits] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, walletList, creditList, monthlyData, categoryList] =
        await Promise.all([
          fetchSummary(),
          fetchWallets(),
          fetchCredits(),
          fetchMonthlyStats(),
          fetchCategories(),
        ]);
      setSummary(summaryData);
      setWallets(walletList);
      setCredits(creditList);
      setMonthly(monthlyData);
      setCategories(categoryList);
    } catch (err) {
      if (err.status === 401) logout();
      else setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, wallets, credits, monthly, categories, loading, error };
}
