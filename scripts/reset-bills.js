// One-time script to delete all test bills and reset bill numbering to 0001
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Bill = require('../models/Bill');

const MONGODB_URI = process.env.MONGODB_URI;

async function resetBills() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const count = await Bill.countDocuments();
    console.log(`Found ${count} bill(s) in the database.`);

    if (count === 0) {
      console.log('No bills to delete. Bill number will already start from 0001.');
    } else {
      const result = await Bill.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} bill(s).`);
      console.log('✅ Bill numbering will now restart from 0001.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetBills();
