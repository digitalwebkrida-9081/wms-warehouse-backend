const express = require('express');
const router = express.Router();

// GET /api/ledger?room=roomId
// This endpoint returnsaggregated stats and party details for a specific room
router.get('/', async (req, res) => {
  try {
    const { room } = req.query;
    
    // Mock data for the ledger based on selected room
    // In a real app, you would query Inwards/Outwards/Billing models filtered by room and party
    const ledgerData = {
      stats: {
        inwardCount: 10,
        totalDebit: 0,
        totalInward: 0,
        totalOutward: 0
      },
      partyDetails: {
        name: room ? `Party for ${room}` : 'Select a Room',
        type: 'Customer',
        mode: 'Direct',
        email: 'contact@example.com',
        openingBalance: 5000,
        openingMode: 'Debit',
        phoneNumber: '9876543210',
        alternatePhone: '0123456789',
        fssai: 'FS12345678',
        graceDays: 15,
        gstin: '22AAAAA0000A1Z5',
        address: 'Main St, Storage Building, Room ' + (room || '')
      },
      transactions: [
        { date: '2026-03-01', billNo: 'BILL-001', debit: 1000, credit: 0, balance: 1000 },
        { date: '2026-03-05', billNo: 'PAY-001', debit: 0, credit: 500, balance: 500 },
      ]
    };

    res.json(ledgerData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});


module.exports = router;
