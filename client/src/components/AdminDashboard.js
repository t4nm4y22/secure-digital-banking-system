import React, { useEffect, useState } from "react";
import { getStats, getAlerts, reviewAlert, socket } from "../api";
import { useCountUp } from "../hooks/useCountUp";
import { pushToast } from "./Toast";

function StatCard({ label, value, prefix = "", highlight }) {
  const animated = useCountUp(value);
  return (
    <div className={`stat-card ${highlight ? "stat-card-alert" : ""}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{prefix}{animated.toLocaleString("en-IN")}</p>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAccounts: 0, totalTransactions: 0, totalVolume: 0, totalFlagged: 0, unreviewedFlagged: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [feed, setFeed] = useState([]);
  const [pulse, setPulse] = useState(false);

  const refreshAll = () => {
    getStats().then(setStats);
    getAlerts().then(setAlerts);
  };

  useEffect(() => {
    refreshAll();

    const onTxn = (txn) => {
      setFeed((prev) => [txn, ...prev].slice(0, 15));
      refreshAll();
    };

    const onAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
      pushToast(`🚩 Fraud alert: ${alert.reason}`, "danger");
      refreshAll();
    };

    socket.on("transaction-feed", onTxn);
    socket.on("fraud-alert", onAlert);

    return () => {
      socket.off("transaction-feed", onTxn);
      socket.off("fraud-alert", onAlert);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markReviewed = async (id) => {
    await reviewAlert(id);
    refreshAll();
  };

  return (
    <div className="panel fade-in">
      <h2>Admin Monitoring Dashboard</h2>
      <p className="subtitle">Live transaction feed and fraud alerts, updating in real time.</p>

      <div className="stats-grid">
        <StatCard label="Total Accounts" value={stats.totalAccounts} />
        <StatCard label="Total Transactions" value={stats.totalTransactions} />
        <StatCard label="Total Volume" value={stats.totalVolume} prefix="₹" />
        <StatCard label="Flagged Transactions" value={stats.totalFlagged} highlight={stats.unreviewedFlagged > 0} />
      </div>

      <div className="dashboard-columns">
        <div>
          <h3 className="section-heading">
            Fraud Alerts <span className={`live-dot ${pulse ? "pulse" : ""}`}></span>
          </h3>
          <div className="alert-list">
            {alerts.length === 0 && <p className="empty-row">No fraud alerts yet. 🎉</p>}
            {alerts.map((a) => (
              <div key={a.id} className={`alert-card severity-${a.severity} ${a.reviewed ? "reviewed" : ""}`}>
                <div className="alert-card-top">
                  <strong>{a.accountName}</strong>
                  <span className="muted">{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
                <p>{a.reason}</p>
                <div className="alert-card-bottom">
                  <span className="amount">₹{a.amount.toLocaleString("en-IN")}</span>
                  {!a.reviewed ? (
                    <button className="small-btn" onClick={() => markReviewed(a.id)}>Mark Reviewed</button>
                  ) : (
                    <span className="muted">✓ Reviewed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="section-heading">Live Transaction Feed</h3>
          <div className="feed-list">
            {feed.length === 0 && <p className="empty-row">Waiting for transactions...</p>}
            {feed.map((t) => (
              <div key={t.id} className={`feed-item fade-in ${t.flagged ? "feed-item-flagged" : ""}`}>
                <span>{t.fromName} → {t.toName}</span>
                <span className="amount">₹{t.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
