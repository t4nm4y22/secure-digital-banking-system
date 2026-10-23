# Secure Digital Banking & Fraud Detection System

A full-stack web app for the JYESTA Internship major project.

**Stack:** React (frontend) + Node.js/Express + Socket.io (backend), JSON file as the database.

## Features
- **User account management** — open accounts, freeze/unfreeze
- **Fund transfer & transaction history** — per-account balances, full transfer history
- **OTP-based authentication** — every transfer requires a 6-digit OTP (2-minute validity). Since there's no SMS gateway connected, the OTP is shown in a clearly labeled "demo" banner in the UI instead of being texted — the code comments mark exactly where a real SMS/email service would plug in.
- **Real-time fraud detection alerts** — a rule-based engine flags transactions as they happen (high-value transfers, rapid repeated transfers, large transfers to a new recipient, transfers draining most of an account's balance) and pushes alerts to the Admin Dashboard live via Socket.io.
- **Admin monitoring dashboard** — live stats, a live transaction feed, and a live fraud alert feed with severity levels and a "mark reviewed" workflow.

## Folder structure
```
banking-system/
├── server/              ← Node/Express backend
│   ├── data/db.json          (JSON "database" — auto-created/updated)
│   ├── fraud/fraudEngine.js  (rule-based fraud detection logic)
│   ├── routes/                (accounts, transactions, otp, admin)
│   ├── utils/db.js
│   └── server.js
└── client-src/           ← React source files (drop into a Create React App project)
    ├── App.js / App.css
    ├── api.js
    ├── hooks/useCountUp.js    (animated stat counters)
    └── components/
```

## How to run it

### 1. Start the backend
```bash
cd server
npm install
npm start
```
Runs the API + Socket.io server at **http://localhost:5001**. Leave this running.

### 2. Set up the frontend
In a new terminal:
```bash
npx create-react-app client
```
Delete everything inside `client/src`, then copy all files from this project's `client-src/` folder into `client/src/`.

Install the one extra dependency:
```bash
cd client
npm install socket.io-client
```

### 3. Start the frontend
```bash
npm start
```
Opens at **http://localhost:3000**.

## Trying it out
1. **Accounts** tab — open two or three accounts with different initial deposits.
2. **Fund Transfer** tab — pick a sender and recipient, enter an amount, click **Request OTP**. The demo OTP appears in the amber banner — type it in and confirm.
3. Try a transfer **over ₹50,000**, or send **most of an account's balance** in one go — it'll still go through, but you'll see it get flagged.
4. Switch to the **Admin Dashboard** tab (ideally in a second browser tab, open at the same time) and make another transfer from the first tab — watch the live transaction feed and fraud alert pulse in real time without refreshing.

## Fraud rules implemented
| Rule | Trigger |
|---|---|
| High-value transfer | Amount > ₹50,000 |
| Velocity check | 3+ transfers from the same account within 2 minutes |
| New recipient | Large transfer (> ₹25,000) to an account never paid before |
| Majority balance | Transfer is 80%+ of the sender's balance |

These thresholds live in `server/fraud/fraudEngine.js` and are easy to tune.

## Notes
- Data persists in `server/data/db.json` between restarts.
- `.gitignore` the `node_modules` folders in both `server/` and `client/` before pushing to GitHub.
- This demo intentionally keeps fraud "detection" non-blocking (the transfer still completes) and routes flags to the admin for review — a closer match to how real banks avoid false-positive customer friction than outright blocking every flagged transaction.
