import { io } from "socket.io-client";

const API_BASE = "http://localhost:5001/api";

export const socket = io("http://localhost:5001");

async function handle(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

const post = (url, body) =>
  fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(handle);

const put = (url, body) =>
  fetch(`${API_BASE}${url}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(handle);

const get = (url) => fetch(`${API_BASE}${url}`).then(handle);

// ---- Accounts ----
export const getAccounts = () => get("/accounts");
export const openAccount = (account) => post("/accounts", account);
export const updateAccount = (id, updates) => put(`/accounts/${id}`, updates);

// ---- OTP ----
export const generateOtp = (accountId) => post("/otp/generate", { accountId });
export const verifyOtp = (accountId, code) => post("/otp/verify", { accountId, code });

// ---- Transactions ----
export const transfer = (payload) => post("/transactions/transfer", payload);
export const getAllTransactions = () => get("/transactions");
export const getAccountHistory = (accountId) => get(`/transactions/account/${accountId}`);

// ---- Admin ----
export const getStats = () => get("/admin/stats");
export const getAlerts = () => get("/admin/alerts");
export const reviewAlert = (id) => put(`/admin/alerts/${id}`, {});
