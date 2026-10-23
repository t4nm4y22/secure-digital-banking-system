const express = require("express");
const { readDB, writeDB } = require("../utils/db");

const router = express.Router();

// GET /api/admin/stats
router.get("/stats", (req, res) => {
  const db = readDB();
  const totalVolume = db.transactions.reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalAccounts: db.accounts.length,
    totalTransactions: db.transactions.length,
    totalVolume,
    totalFlagged: db.fraudAlerts.length,
    unreviewedFlagged: db.fraudAlerts.filter((a) => !a.reviewed).length
  });
});

// GET /api/admin/alerts
router.get("/alerts", (req, res) => {
  const db = readDB();
  // Most recent first
  const sorted = [...db.fraudAlerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sorted);
});

// PUT /api/admin/alerts/:id - mark an alert as reviewed
router.put("/alerts/:id", (req, res) => {
  const db = readDB();
  const alert = db.fraudAlerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  alert.reviewed = true;
  writeDB(db);
  res.json(alert);
});

module.exports = router;
