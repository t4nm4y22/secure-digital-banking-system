import React, { useEffect, useState } from "react";
import { getAccounts, openAccount, updateAccount } from "../api";
import { pushToast } from "./Toast";

function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ holderName: "", email: "", phone: "", initialDeposit: "" });
  const [error, setError] = useState("");

  const load = () => getAccounts().then(setAccounts);

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const acc = await openAccount(form);
      setForm({ holderName: "", email: "", phone: "", initialDeposit: "" });
      pushToast(`Account ${acc.id} opened for ${acc.holderName}`, "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleFreeze = async (acc) => {
    const newStatus = acc.status === "Active" ? "Frozen" : "Active";
    await updateAccount(acc.id, { status: newStatus });
    pushToast(`${acc.holderName}'s account is now ${newStatus}`, newStatus === "Frozen" ? "warn" : "success");
    load();
  };

  return (
    <div className="panel fade-in">
      <h2>User Account Management</h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label>Account Holder Name</label>
          <input name="holderName" value={form.holderName} onChange={handleChange} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div className="field">
          <label>Initial Deposit (₹)</label>
          <input type="number" min="0" name="initialDeposit" value={form.initialDeposit} onChange={handleChange} />
        </div>

        {error && <p className="error-text full">{error}</p>}
        <button type="submit" className="primary-btn full">Open Account</button>
      </form>

      <h3 className="section-heading">All Accounts</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Account ID</th><th>Holder</th><th>Contact</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {accounts.length === 0 && <tr><td colSpan="6" className="empty-row">No accounts opened yet.</td></tr>}
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.id}</td>
                <td>{a.holderName}</td>
                <td>{a.email}<br /><span className="muted">{a.phone}</span></td>
                <td className="amount">₹{a.balance.toLocaleString("en-IN")}</td>
                <td><span className={`status-pill status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td>
                  <button className="small-btn" onClick={() => toggleFreeze(a)}>
                    {a.status === "Active" ? "Freeze" : "Unfreeze"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountManagement;
