const express = require("express");
const { readDB, writeDB } = require("../utils/db");

const router = express.Router();

const OTP_VALIDITY_MS = 2 * 60 * 1000; // 2 minutes

function generateSixDigitOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/otp/generate  { accountId }
// In a real bank this OTP would be sent via SMS/email, never returned
// in the API response. It's returned here only because this is a demo
// project with no SMS gateway connected.
router.post("/generate", (req, res) => {
  const { accountId } = req.body;
  const db = readDB();

  const account = db.accounts.find((a) => a.id === accountId);
  if (!account) return res.status(404).json({ error: "Account not found" });

  const code = generateSixDigitOtp();
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS).toISOString();

  // Remove any previous unused OTPs for this account
  db.otps = db.otps.filter((o) => o.accountId !== accountId);
  db.otps.push({ accountId, code, expiresAt, used: false });

  writeDB(db);

  res.json({
    message: "OTP generated.",
    demoOtp: code, // demo-only — would never be exposed in production
    expiresInSeconds: OTP_VALIDITY_MS / 1000
  });
});

// POST /api/otp/verify  { accountId, code }
router.post("/verify", (req, res) => {
  const { accountId, code } = req.body;
  const db = readDB();

  const record = db.otps.find((o) => o.accountId === accountId && !o.used);
  if (!record) return res.status(400).json({ error: "No OTP was requested for this account." });

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: "Incorrect OTP." });
  }

  res.json({ verified: true });
});

module.exports = router;
