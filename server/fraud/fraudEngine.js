/**
 * Simple rule-based fraud detection engine.
 * Each rule returns a flag object (or null if it doesn't apply).
 * Real banking systems use ML models trained on historical fraud
 * patterns — this rule-based version is a transparent, explainable
 * stand-in that's appropriate for a student/demo project.
 */

const HIGH_VALUE_THRESHOLD = 50000; // ₹
const VELOCITY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const VELOCITY_COUNT_LIMIT = 3;
const MAJORITY_BALANCE_RATIO = 0.8; // flag if transfer is 80%+ of balance

function checkHighValue(amount) {
  if (amount > HIGH_VALUE_THRESHOLD) {
    return {
      reason: `High-value transfer of ₹${amount.toLocaleString("en-IN")} (above ₹${HIGH_VALUE_THRESHOLD.toLocaleString("en-IN")} threshold)`,
      severity: "high"
    };
  }
  return null;
}

function checkVelocity(db, fromAccountId) {
  const now = Date.now();
  const recent = db.transactions.filter(
    (t) => t.fromAccountId === fromAccountId && now - new Date(t.timestamp).getTime() < VELOCITY_WINDOW_MS
  );
  if (recent.length >= VELOCITY_COUNT_LIMIT) {
    return {
      reason: `${recent.length + 1} transfers from this account within 2 minutes — possible automated/compromised activity`,
      severity: "high"
    };
  }
  return null;
}

function checkNewRecipient(db, fromAccountId, toAccountId, amount) {
  const hasTransactedBefore = db.transactions.some(
    (t) => t.fromAccountId === fromAccountId && t.toAccountId === toAccountId
  );
  if (!hasTransactedBefore && amount > HIGH_VALUE_THRESHOLD / 2) {
    return {
      reason: `Large transfer (₹${amount.toLocaleString("en-IN")}) to a recipient this account has never paid before`,
      severity: "medium"
    };
  }
  return null;
}

function checkMajorityBalance(amount, balanceBeforeTransfer) {
  if (balanceBeforeTransfer > 0 && amount / balanceBeforeTransfer >= MAJORITY_BALANCE_RATIO) {
    return {
      reason: `Transfer drains ${Math.round((amount / balanceBeforeTransfer) * 100)}% of the account's balance in one transaction`,
      severity: "medium"
    };
  }
  return null;
}

/**
 * Runs all rules and returns an array of triggered flags (empty if clean).
 */
function evaluateTransaction(db, { fromAccountId, toAccountId, amount, balanceBeforeTransfer }) {
  const flags = [
    checkHighValue(amount),
    checkVelocity(db, fromAccountId),
    checkNewRecipient(db, fromAccountId, toAccountId, amount),
    checkMajorityBalance(amount, balanceBeforeTransfer)
  ].filter(Boolean);

  return flags;
}

module.exports = { evaluateTransaction, HIGH_VALUE_THRESHOLD };
