require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const inwardRoutes = require("./routes/inwards");
const outwardRoutes = require("./routes/outwards");
const billingRoutes = require("./routes/billing");
const partyRoutes = require("./routes/party");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const packageRoutes = require("./routes/package");
const ledgerRoutes = require("./routes/ledger");
const expenseRoutes = require("./routes/expense");
const settingsRoutes = require("./routes/settings");

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files (logos etc.)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Backend Database"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Auth Routes (unprotected)
app.use("/api/auth", authRoutes);

// Protected Routes
app.use("/api/inwards", authMiddleware, inwardRoutes);
app.use("/api/outward", authMiddleware, outwardRoutes);
app.use("/api/billing", authMiddleware, billingRoutes);
app.use("/api/party", authMiddleware, partyRoutes);
app.use("/api/category", authMiddleware, categoryRoutes);
app.use("/api/product", authMiddleware, productRoutes);
app.use("/api/package", authMiddleware, packageRoutes);
app.use("/api/ledger", authMiddleware, ledgerRoutes);
app.use("/api/expenses", authMiddleware, expenseRoutes);
app.use("/api/settings", authMiddleware, settingsRoutes);
app.use("/api/quotation", authMiddleware, require("./routes/quotation"));

// Health Check
app.get("/", (req, res) => {
  res.send("Warehouse API is running...");
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, "0.0.0.0", () => {
  const address = server.address();
  console.log(
    `🚀 Server is running on http://${address.address}:${address.port}`,
  );
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
});
