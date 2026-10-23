const express = require("express");
const { readDB, writeDB, nextId } = require("../utils/db");

const router = express.Router();

// GET /api/accounts - list all accounts
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.accounts);
});

// GET /api/accounts/:id - single account detail
router.get("/:id", (req, res) => {
  const db = readDB();
  const account = db.accounts.find((a) => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

// POST /api/accounts - open a new account
router.post("/", (req, res) => {
  const { holderName, email, phone, initialDeposit } = req.body;

  if (!holderName || !email || !phone) {
    return res.status(400).json({ error: "holderName, email and phone are required." });
  }

  const deposit = Number(initialDeposit) || 0;
  if (deposit < 0) {
    return res.status(400).json({ error: "Initial deposit cannot be negative." });
  }

  const db = readDB();
  const newAccount = {
    id: nextId(db, "account", "ACC"),
    holderName,
    email,
    phone,
    balance: deposit,
    status: "Active", // Active | Frozen
    openedOn: new Date().toISOString()
  };

  db.accounts.push(newAccount);
  writeDB(db);
  res.status(201).json(newAccount);
});

// PUT /api/accounts/:id - update status (e.g. freeze/unfreeze)
router.put("/:id", (req, res) => {
  const db = readDB();
  const index = db.accounts.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Account not found" });

  db.accounts[index] = { ...db.accounts[index], ...req.body, id: db.accounts[index].id };
  writeDB(db);
  res.json(db.accounts[index]);
});

module.exports = router;
