// Thin fetch wrapper around the backend API.
import { getAccessToken } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to frontend/.env (local) or frontend/.env.docker (Docker build)."
  );
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth
export const register = (payload) =>
  request("/auth/register/", { method: "POST", body: payload, auth: false });

export const login = (payload) =>
  request("/auth/login/", { method: "POST", body: payload, auth: false });

export const fetchMe = () => request("/auth/me/");

// Categories
export const fetchCategories = () => request("/categories/");

export const createCategory = (payload) =>
  request("/categories/", { method: "POST", body: payload });

export const updateCategory = (id, payload) =>
  request(`/categories/${id}/`, { method: "PATCH", body: payload });

export const deleteCategory = (id) =>
  request(`/categories/${id}/`, { method: "DELETE" });

// Wallets
export const fetchWallets = () => request("/wallets/");

export const createWallet = (payload) =>
  request("/wallets/", { method: "POST", body: payload });

export const updateWallet = (id, payload) =>
  request(`/wallets/${id}/`, { method: "PATCH", body: payload });

export const deleteWallet = (id) =>
  request(`/wallets/${id}/`, { method: "DELETE" });

// Credit cards
export const fetchCredits = () => request("/credits/");

export const fetchCreditsActivity = () => request("/credits/activity/");

export const createCredit = (payload) =>
  request("/credits/", { method: "POST", body: payload });

export const updateCredit = (id, payload) =>
  request(`/credits/${id}/`, { method: "PATCH", body: payload });

export const deleteCredit = (id) =>
  request(`/credits/${id}/`, { method: "DELETE" });

export const createCreditCharge = (payload) =>
  request("/credit-charges/", { method: "POST", body: payload });

export const updateCreditCharge = (id, payload) =>
  request(`/credit-charges/${id}/`, { method: "PATCH", body: payload });

export const deleteCreditCharge = (id) =>
  request(`/credit-charges/${id}/`, { method: "DELETE" });

export const createCreditPayment = (payload) =>
  request("/credit-payments/", { method: "POST", body: payload });

export const deleteCreditPayment = (id) =>
  request(`/credit-payments/${id}/`, { method: "DELETE" });

// Income sources
export const fetchIncomeSources = () => request("/income-sources/");

export const createIncomeSource = (payload) =>
  request("/income-sources/", { method: "POST", body: payload });

export const updateIncomeSource = (id, payload) =>
  request(`/income-sources/${id}/`, { method: "PATCH", body: payload });

export const deleteIncomeSource = (id) =>
  request(`/income-sources/${id}/`, { method: "DELETE" });

// Expenses
export const fetchExpenses = () => request("/expenses/");

export const createExpense = (payload) =>
  request("/expenses/", { method: "POST", body: payload });

export const updateExpense = (id, payload) =>
  request(`/expenses/${id}/`, { method: "PATCH", body: payload });

export const deleteExpense = (id) =>
  request(`/expenses/${id}/`, { method: "DELETE" });

// Income
export const fetchIncomes = () => request("/incomes/");

export const createIncome = (payload) =>
  request("/incomes/", { method: "POST", body: payload });

export const updateIncome = (id, payload) =>
  request(`/incomes/${id}/`, { method: "PATCH", body: payload });

export const deleteIncome = (id) =>
  request(`/incomes/${id}/`, { method: "DELETE" });

// Debts
export const fetchDebts = () => request("/debts/");

export const createDebt = (payload) =>
  request("/debts/", { method: "POST", body: payload });

export const updateDebt = (id, payload) =>
  request(`/debts/${id}/`, { method: "PATCH", body: payload });

export const deleteDebt = (id) =>
  request(`/debts/${id}/`, { method: "DELETE" });

export const createDebtPayment = (payload) =>
  request("/debt-payments/", { method: "POST", body: payload });

export const deleteDebtPayment = (id) =>
  request(`/debt-payments/${id}/`, { method: "DELETE" });

// Stats
export const fetchSummary = () => request("/summary/");

export const fetchMonthlyStats = () => request("/stats/monthly/");
