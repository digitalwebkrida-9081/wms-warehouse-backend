require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Requested Credentials
    const targetUsername = "wms-admin-warehouse";
    const targetPassword = "wms@123";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(targetPassword, salt);

    const db = mongoose.connection.db;
    const users = db.collection("users");

    // Check if this specific admin already exists
    const existing = await users.findOne({ username: targetUsername });
    if (existing) {
      console.log(`⚠️ User '${targetUsername}' already exists. Updating password...`);
      await users.updateOne({ username: targetUsername }, { $set: { password: hashedPassword, role: "admin" } });
      console.log("✅ Credentials updated successfully!");
    } else {
      await users.insertOne({
        username: targetUsername,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date()
      });
      console.log(`✅ Admin Created: ${targetUsername}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ FAILED:", err.message);
    process.exit(1);
  }
}

run();
