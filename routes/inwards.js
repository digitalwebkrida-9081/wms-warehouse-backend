const express = require('express');
const router = express.Router();
const Inward = require('../models/Inward');

// GET /api/inwards
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';

    // Create a robust query handle
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { partyId: regex },
          { productId: regex },
          { inwardDate: regex }
        ]
      };
    }

    const total = await Inward.countDocuments(query);
    const start = (page - 1) * pageSize;

    // Proactively migrate any legacy numeric additionalCharges for the whole collection
    // This ensures that the subsequent .find() (which triggers Mongoose hydration) doesn't fail.
    await Inward.collection.updateMany(
      { additionalCharges: { $type: "number" } },
      [
        {
          $set: {
            additionalCharges: [
              {
                label: "Legacy Charge",
                chargeType: "fixed",
                amount: "$additionalCharges",
                unit: "fixed",
                value: 0,
                rate: 0
              }
            ]
          }
        }
      ]
    );

    // fetch descending order matching Next's mock
    const inwards = await Inward.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(pageSize);

    res.json({
      data: inwards.map(inward => inward.toJSON()), // the transform removes _id and renames id
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/inwards
router.post('/', async (req, res) => {
  try {
    const newInward = new Inward(req.body);
    await newInward.save();
    res.status(201).json(newInward.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create inward' });
  }
});

// PUT /api/inwards/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedInward = await Inward.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedInward) {
      return res.status(404).json({ error: 'Inward not found' });
    }
    res.json(updatedInward.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inward' });
  }
});

// DELETE /api/inwards/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedInward = await Inward.findByIdAndDelete(req.params.id);
    if (!deletedInward) {
      return res.status(404).json({ error: 'Inward not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete inward' });
  }
});

// POST /api/inwards/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await Inward.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} inwards deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
