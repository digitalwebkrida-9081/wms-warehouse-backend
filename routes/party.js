const express = require('express');
const router = express.Router();
const Party = require('../models/Party');

// GET /api/party
router.get('/', async (req, res) => {
  console.log("🟡 GET /api/party called with query:", req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { mobileNo: regex },
          { city: regex },
          { aadhaarNumber: regex },
          { partyType: regex }
        ]
      };
    }
    console.log("🟡 Query built:", query);

    const total = await Party.countDocuments(query);
    console.log("🟡 Total parties found:", total);
    const start = (page - 1) * pageSize;

    const parties = await Party.find(query)
      .sort({ name: 1 })
      .skip(start)
      .limit(pageSize);
    console.log("🟡 Returned parties count:", parties.length);

    res.json({
      data: parties,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error("❌ Error in GET /api/party:", error);
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
});

// POST /api/party
router.post('/', async (req, res) => {
  try {
    const newParty = new Party(req.body);
    await newParty.save();
    res.status(201).json(newParty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create party' });
  }
});

// PUT /api/party/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedParty = await Party.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedParty) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json(updatedParty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update party' });
  }
});

// DELETE /api/party/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedParty = await Party.findByIdAndDelete(req.params.id);
    if (!deletedParty) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete party' });
  }
});

// POST /api/party/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await Party.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} parties deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
