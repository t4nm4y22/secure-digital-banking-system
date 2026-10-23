import React, { useEffect, useState } from "react";
import { getAccounts, getAccountHistory } from "../api";

function TransactionHistory() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    if (accountId) {
      getAccountHistory(accountId).then((h) =>
        setHistory([...h].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
      );
    } else {
      setHistory([]);
    }
  }, [accountId]);

  return (
    <div className="panel fade-in">
      <h2>Transaction History</h2>

      <div className="field">
        <label>View history for</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Select account</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.holderName} — {a.id}</option>)}
        </select>
      </div>

      {accountId && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Txn ID</th><th>Direction</th><th>Counterparty</th><th>Amount</th><th>Flagged</th><th>Date</th></tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan="6" className="empty-row">No transactions yet.</td></tr>}
              {history.map((t) => {
                const isOutgoing = t.fromAccountId === accountId;
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td>
                      <span className={isOutgoing ? "direction-out" : "direction-in"}>
                        {isOutgoing ? "↑ Sent" : "↓ Received"}
                      </span>
                    </td>
                    <td>{isOutgoing ? t.toName : t.fromName}</td>
                    <td className={`amount ${isOutgoing ? "amount-out" : "amount-in"}`}>
                      {isOutgoing ? "-" : "+"}₹{t.amount.toLocaleString("en-IN")}
                    </td>
                    <td>{t.flagged ? <span className="flag-badge">🚩 Flagged</span> : "—"}</td>
                    <td className="muted">{new Date(t.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
