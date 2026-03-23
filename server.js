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






const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
app.use("/api/inwards", inwardRoutes);
app.use("/api/outward", outwardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/expenses", expenseRoutes);






// Health Check
app.get("/", (req, res) => {
  res.send("Warehouse API is running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
