const express = require("express");
const { readDB, writeDB, nextId } = require("../utils/db");
const { evaluateTransaction } = require("../fraud/fraudEngine");

const router = express.Router();

// GET /api/transactions - all transactions (admin view)
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.transactions);
});

// GET /api/transactions/account/:id - history for one account
router.get("/account/:id", (req, res) => {
  const db = readDB();
  const history = db.transactions.filter(
    (t) => t.fromAccountId === req.params.id || t.toAccountId === req.params.id
  );
  res.json(history);
});

// POST /api/transactions/transfer
// { fromAccountId, toAccountId, amount, otp }
// Requires a valid, unused, unexpired OTP for fromAccountId.
router.post("/transfer", (req, res) => {
  const { fromAccountId, toAccountId, amount, otp } = req.body;
  const transferAmount = Number(amount);

  if (!fromAccountId || !toAccountId || !transferAmount || transferAmount <= 0) {
    return res.status(400).json({ error: "fromAccountId, toAccountId and a positive amount are required." });
  }
  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: "Cannot transfer to the same account." });
  }
  if (!otp) {
    return res.status(400).json({ error: "OTP is required to authorize this transfer." });
  }

  const db = readDB();

  // --- OTP verification ---
  const otpRecord = db.otps.find((o) => o.accountId === fromAccountId && !o.used);
  if (!otpRecord) return res.status(400).json({ error: "No OTP was requested for this account." });
  if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }
  if (otpRecord.code !== otp) {
    return res.status(400).json({ error: "Incorrect OTP." });
  }

  // --- Account checks ---
  const fromAccount = db.accounts.find((a) => a.id === fromAccountId);
  const toAccount = db.accounts.find((a) => a.id === toAccountId);
  if (!fromAccount) return res.status(404).json({ error: "Sender account not found." });
  if (!toAccount) return res.status(404).json({ error: "Recipient account not found." });
  if (fromAccount.status === "Frozen") return res.status(403).json({ error: "Sender account is frozen." });
  if (fromAccount.balance < transferAmount) {
    return res.status(400).json({ error: "Insufficient balance." });
  }

  // --- Fraud evaluation (runs BEFORE committing the balance change) ---
  const flags = evaluateTransaction(db, {
    fromAccountId,
    toAccountId,
    amount: transferAmount,
    balanceBeforeTransfer: fromAccount.balance
  });

  // --- Commit the transfer ---
  fromAccount.balance -= transferAmount;
  toAccount.balance += transferAmount;

  const transaction = {
    id: nextId(db, "transaction", "TXN"),
    fromAccountId,
    toAccountId,
    fromName: fromAccount.holderName,
    toName: toAccount.holderName,
    amount: transferAmount,
    flagged: flags.length > 0,
    timestamp: new Date().toISOString()
  };
  db.transactions.push(transaction);

  // Mark OTP as used
  otpRecord.used = true;

  let createdAlerts = [];
  if (flags.length > 0) {
    createdAlerts = flags.map((flag) => ({
      id: nextId(db, "alert", "ALERT"),
      transactionId: transaction.id,
      accountId: fromAccountId,
      accountName: fromAccount.holderName,
      amount: transferAmount,
      reason: flag.reason,
      severity: flag.severity,
      timestamp: new Date().toISOString(),
      reviewed: false
    }));
    db.fraudAlerts.push(...createdAlerts);
  }

  writeDB(db);

  // --- Real-time push to admin dashboards ---
  const io = req.app.get("io");
  io.emit("transaction-feed", transaction);
  createdAlerts.forEach((alert) => io.emit("fraud-alert", alert));

  res.status(201).json({ transaction, flagged: flags.length > 0, flags });
});

module.exports = router;
