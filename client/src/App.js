import React, { useState } from "react";
import "./App.css";

import AccountManagement from "./components/AccountManagement";
import FundTransfer from "./components/FundTransfer";
import TransactionHistory from "./components/TransactionHistory";
import AdminDashboard from "./components/AdminDashboard";
import ToastHost from "./components/Toast";

const TABS = [
  { id: "accounts", label: "👤 Accounts" },
  { id: "transfer", label: "💸 Fund Transfer" },
  { id: "history", label: "📜 Transaction History" },
  { id: "admin", label: "🛡 Admin Dashboard" }
];

function App() {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <div className="app-shell">
      <ToastHost />

      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">🏦</div>
          <div>
            <h1>SecureBank</h1>
            <p>Digital Banking &amp; Fraud Detection System</p>
          </div>
        </div>
      </header>

      <nav className="app-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === "accounts" && <AccountManagement />}
        {activeTab === "transfer" && <FundTransfer />}
        {activeTab === "history" && <TransactionHistory />}
        {activeTab === "admin" && <AdminDashboard />}
      </main>

      <footer className="app-footer">
        SecureBank — JYESTA Internship Project · Rule-based fraud detection demo
      </footer>
    </div>
  );
}

export default App;
