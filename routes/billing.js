const express = require('express');
const router = express.Router();
const Inward = require('../models/Inward');
const Outward = require('../models/Outward');
const Bill = require('../models/Bill');

// Helper function to get the next available bill number (filling gaps)
async function getNextBillNumber() {
  const startingNumber = parseInt(process.env.STARTING_BILL_NUMBER || "1", 10);
  
  // Find all bill numbers that follow the 0000 format
  const allBills = await Bill.find({ billNumber: /^\d{4}$/ }).select('billNumber').sort({ billNumber: 1 });
  const existingNumbers = new Set(allBills.map(b => parseInt(b.billNumber, 10)));
  
  let nextSeq = startingNumber;
  while (existingNumbers.has(nextSeq)) {
    nextSeq++;
  }
  
  return String(nextSeq).padStart(4, '0');
}

// POST /api/billing/generate-from-inwards
router.post('/generate-from-inwards', async (req, res) => {
  try {
    const { inwardIds, billPeriod, gstRate } = req.body;
    const Party = require('../models/Party'); // To fetch party info

    if (!inwardIds || !Array.isArray(inwardIds)) {
      return res.status(400).json({ error: 'inwardIds array is required' });
    }

    const inwards = await Inward.find({ _id: { $in: inwardIds } });
    if (inwards.length === 0) {
      return res.status(400).json({ error: 'No inwards found' });
    }
    // Generate sequential bill No: filling gaps if any
    const billNumber = await getNextBillNumber();

    const lineItems = inwards.map(inw => {
      // Basic fallback month calculation 
      // Replace with exact cold logic as needed, assuming 1 month for now if not specified.
      let months = 1;
      const sub = inw.totalWeight * (inw.price || 0) * months;
      const tax = (sub * (gstRate || 0)) / 100;
      return {
        inwardId: inw._id,
        description: `${inw.productId} - ${billPeriod}`,
        quantity: inw.quantity || 0,
        weight: inw.totalWeight,
        remaining: inw.remainingWeight,
        inDate: inw.inwardDate,
        rate: inw.price || 0,
        months: months,
        tax: gstRate || 0,
        total: sub + tax
      };
    });

    const subTotal = lineItems.reduce((acc, item) => acc + (item.weight * item.rate * item.months), 0);
    const taxTotal = lineItems.reduce((acc, item) => acc + (item.total - (item.weight * item.rate * item.months)), 0);
    const grandTotal = subTotal + taxTotal;

    const partyName = inwards[0].partyId; // partyId contains string name in this project
    const partyData = await Party.findOne({ name: partyName });

    const newBill = new Bill({
      billNumber,
      date: new Date().toISOString().split('T')[0],
      partyId: partyName,
      lineItems,
      subTotal,
      taxTotal,
      grandTotal,
      remarks: `Bill for period ${billPeriod}`
    });

    await newBill.save();
    
    // Return a hydrated response with party details for the UI preview
    res.status(201).json({
      bill: newBill,
      partyDetails: partyData || {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});


// POST /api/billing/generate-preview
// returns data needed for the frontend bill-creation screen
router.post('/generate-preview', async (req, res) => {
  try {
    const { inwardIds } = req.body;

    if (!inwardIds || !Array.isArray(inwardIds)) {
      return res.status(400).json({ error: 'inwardIds array is required' });
    }

    const inwards = await Inward.find({ _id: { $in: inwardIds } });

    let subTotal = 0;
    let taxTotal = 0;

    const lineItems = inwards.map(inw => {
      const rate = inw.price || 0;
      const taxPercent = 0; // Default tax 0, user can edit
      const itemSubTotal = inw.totalWeight * rate;
      const itemTaxTotal = (itemSubTotal * taxPercent) / 100;
      const itemTotal = itemSubTotal + itemTaxTotal;

      subTotal += itemSubTotal;
      taxTotal += itemTaxTotal;

      return {
        inwardId: inw._id,
        description: `${inw.productId} (Inward ${inw.inwardNumber || inw._id.toString().slice(-6)})`,
        quantity: inw.quantity || 0,
        weight: inw.totalWeight,
        remaining: inw.remainingWeight,
        inDate: inw.inwardDate,
        rate: rate,
        months: 1, // Defaulting to 1 month for previews, can be edited
        tax: taxPercent,
        total: itemTotal
      };
    });

    const billIdSug = await getNextBillNumber();

    return res.json({
      billNumber: billIdSug,
      date: new Date().toISOString().split('T')[0],
      partyId: inwards[0]?.partyId || '',
      lineItems,
      subTotal,
      taxTotal,
      grandTotal: subTotal + taxTotal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/billing (Save manual bill)
router.post('/', async (req, res) => {
  try {
    const Party = require('../models/Party');
    const billData = req.body;
    const newBill = new Bill(billData);
    await newBill.save();
    
    // Fetch party info for preview
    const partyData = await Party.findOne({ name: newBill.partyId });
    
    res.status(201).json({
      bill: newBill,
      partyDetails: partyData || {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/billing (List all bills)
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    let query = {};
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { partyId: { $regex: search, $options: 'i' } }
      ];
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
      
    const total = await Bill.countDocuments(query);
    
    res.json({ data: bills, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/billing/:id
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/billing/:id (Update bill)
router.put('/:id', async (req, res) => {
  try {
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBill) return res.status(404).json({ error: 'Bill not found' });
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/billing/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedBill = await Bill.findByIdAndDelete(req.params.id);
    if (!deletedBill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
