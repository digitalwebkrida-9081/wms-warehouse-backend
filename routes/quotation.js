const express = require('express');
const router = express.Router();
const Inward = require('../models/Inward');
const Quotation = require('../models/Quotation');

// Helper function to get the next available quotation number (filling gaps)
async function getNextQuotationNumber() {
  const startingNumber = parseInt(process.env.STARTING_QUOTATION_NUMBER || "1", 10);
  
  // Find all quotation numbers that follow the Q-0000 format
  const allQuotations = await Quotation.find({ quotationNumber: /^Q-\d{4}$/ }).select('quotationNumber').sort({ quotationNumber: 1 });
  const existingNumbers = new Set(allQuotations.map(q => parseInt(q.quotationNumber.replace('Q-', ''), 10)));
  
  let nextSeq = startingNumber;
  while (existingNumbers.has(nextSeq)) {
    nextSeq++;
  }
  
  return 'Q-' + String(nextSeq).padStart(4, '0');
}

// POST /api/quotation/generate-preview
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
      const taxPercent = 0; 
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
        months: 1,
        tax: taxPercent,
        total: itemTotal
      };
    });

    const quotationIdSug = await getNextQuotationNumber();

    return res.json({
      quotationNumber: quotationIdSug,
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

// POST /api/quotation (Save quotation)
router.post('/', async (req, res) => {
  try {
    const Party = require('../models/Party');
    const quotationData = req.body;
    const newQuotation = new Quotation(quotationData);
    await newQuotation.save();
    
    // Fetch party info for preview
    const partyData = await Party.findOne({ name: newQuotation.partyId });
    
    res.status(201).json({
      quotation: newQuotation,
      partyDetails: partyData || {}
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Quotation number already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/quotation (List all quotations)
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    let query = {};
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { partyId: { $regex: search, $options: 'i' } }
      ];
    }

    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
      
    const total = await Quotation.countDocuments(query);
    
    res.json({ data: quotations, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/quotation/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedQuotation) return res.status(404).json({ error: 'Quotation not found' });
    res.json(updatedQuotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/quotation/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedQuotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!deletedQuotation) return res.status(404).json({ error: 'Quotation not found' });
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
