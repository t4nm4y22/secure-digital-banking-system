import React, { useEffect, useState } from "react";
import { getAccounts, generateOtp, transfer } from "../api";
import { pushToast } from "./Toast";

function FundTransfer() {
  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form"); // form | otp | result
  const [demoOtp, setDemoOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  const resetAll = () => {
    setFromAccountId(""); setToAccountId(""); setAmount("");
    setStep("form"); setDemoOtp(""); setOtpInput(""); setError(""); setResult(null);
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!fromAccountId || !toAccountId || !amount || Number(amount) <= 0) {
      setError("Fill in sender, recipient and a valid amount.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("Sender and recipient accounts must be different.");
      return;
    }

    try {
      const res = await generateOtp(fromAccountId);
      setDemoOtp(res.demoOtp);
      setSecondsLeft(res.expiresInSeconds);
      setStep("otp");
      pushToast("OTP generated — check the demo banner below.", "info");
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmTransfer = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await transfer({ fromAccountId, toAccountId, amount: Number(amount), otp: otpInput });
      setResult(res);
      setStep("result");
      if (res.flagged) {
        pushToast("Transfer completed but flagged for fraud review.", "warn");
      } else {
        pushToast("Transfer completed successfully.", "success");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel fade-in">
      <h2>Fund Transfer</h2>
      <p className="subtitle">Every transfer is protected by one-time password (OTP) authentication.</p>

      {step === "form" && (
        <form className="form-grid" onSubmit={requestOtp}>
          <div className="field">
            <label>From Account</label>
            <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
              <option value="">Select sender account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.holderName} — {a.id} (₹{a.balance.toLocaleString("en-IN")})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>To Account</label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
              <option value="">Select recipient account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.holderName} — {a.id}</option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label>Amount (₹)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          {error && <p className="error-text full">{error}</p>}
          <button type="submit" className="primary-btn full">Request OTP</button>
        </form>
      )}

      {step === "otp" && (
        <form className="otp-form fade-in" onSubmit={confirmTransfer}>
          <div className="demo-otp-banner">
            <strong>Demo OTP:</strong> <span className="otp-code">{demoOtp}</span>
            <p>In production this would be sent via SMS/email. It's shown here only because this is a demo environment with no SMS gateway connected.</p>
            <p className="otp-timer">{secondsLeft > 0 ? `Expires in ${secondsLeft}s` : "OTP expired — go back and request a new one."}</p>
          </div>

          <div className="field">
            <label>Enter OTP to confirm transfer of ₹{Number(amount).toLocaleString("en-IN")}</label>
            <input
              className="otp-input"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="● ● ● ● ● ●"
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="btn-row">
            <button type="button" className="ghost-btn" onClick={resetAll}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={secondsLeft <= 0}>Confirm Transfer</button>
          </div>
        </form>
      )}

      {step === "result" && result && (
        <div className={`result-card fade-in ${result.flagged ? "result-flagged" : "result-success"}`}>
          <h3>{result.flagged ? "⚠ Transfer Completed — Flagged for Review" : "✓ Transfer Successful"}</h3>
          <p><strong>Transaction ID:</strong> {result.transaction.id}</p>
          <p><strong>Amount:</strong> ₹{result.transaction.amount.toLocaleString("en-IN")}</p>
          <p><strong>From:</strong> {result.transaction.fromName} &nbsp;→&nbsp; <strong>To:</strong> {result.transaction.toName}</p>

          {result.flagged && (
            <div className="flag-list">
              {result.flags.map((f, i) => (
                <div key={i} className="flag-item">🚩 {f.reason}</div>
              ))}
            </div>
          )}

          <button className="primary-btn" onClick={resetAll}>Make Another Transfer</button>
        </div>
      )}
    </div>
  );
}

export default FundTransfer;
