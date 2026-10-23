const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const accountsRouter = require("./routes/accounts");
const transactionsRouter = require("./routes/transactions");
const otpRouter = require("./routes/otp");
const adminRouter = require("./routes/admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Make the Socket.io instance available to routes via req.app.get("io")
app.set("io", io);

app.use("/api/accounts", accountsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/otp", otpRouter);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Secure Digital Banking & Fraud Detection System API is running.");
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Digital Banking API + real-time fraud alerts running on http://localhost:${PORT}`);
});
