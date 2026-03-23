const express = require('express');
const router = express.Router();
const Party = require('../models/Party');

// GET /api/party
router.get('/', async (req, res) => {
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

    const total = await Party.countDocuments(query);
    const start = (page - 1) * pageSize;

    const parties = await Party.find(query)
      .sort({ name: 1 })
      .skip(start)
      .limit(pageSize);

    res.json({
      data: parties,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
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

module.exports = router;
