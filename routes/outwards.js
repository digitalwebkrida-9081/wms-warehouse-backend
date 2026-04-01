const express = require('express');
const router = express.Router();
const Outward = require('../models/Outward');
const Inward = require('../models/Inward');

/**
 * Helper to recalculate remaining weight of an Inward based on its totalWeight and all its Outwards.
 */
async function updateInwardInventory(inwardId) {
  const inward = await Inward.findById(inwardId);
  if (!inward) return;

  const results = await Outward.aggregate([
    { $match: { inwardId: inward._id } },
    { $group: { 
      _id: '$inwardId', 
      totalOutWeight: { $sum: '$outwardWeight' },
      totalOutQuantity: { $sum: '$quantity' }
    } }
  ]);

  const totalOutWeight = results.length > 0 ? results[0].totalOutWeight : 0;
  const totalOutQuantity = results.length > 0 ? results[0].totalOutQuantity : 0;
  
  inward.remainingWeight = inward.totalWeight - totalOutWeight;
  inward.remainingQuantity = (inward.quantity || 0) - totalOutQuantity;
  await inward.save();
}

// GET /api/outward
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
          { partyId: regex },
          { productId: regex },
          { outwardDate: regex }
        ]
      };
    }
    
    // Add inwardId filter if provided
    if (req.query.inwardId) {
      query.inwardId = req.query.inwardId;
    }

    const total = await Outward.countDocuments(query);
    const start = (page - 1) * pageSize;

    // Join with Inward data so we can display inward details in the UI
    const outwards = await Outward.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(pageSize)
      .populate('inwardId', 'inwardDate totalWeight remainingWeight remainingQuantity');

    res.json({
      data: outwards.map(outward => {
        const json = outward.toJSON();
        // The user wants column labels in the UI like "Inward Date" and "Total Weight" from the original Inward.
        // We'll flatten some of the populated inward data to make it easier for the UI to consume.
        if (json.inwardId) {
          json.inwardDetails = json.inwardId;
          json.inwardId = json.inwardId.id || json.inwardId._id?.toString();
        }
        return json;
      }),
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/outward
router.post('/', async (req, res) => {
  try {
    const newOutward = new Outward(req.body);
    await newOutward.save();

    // After saving, update the Inward remaining weight
    await updateInwardInventory(newOutward.inwardId);

    // Re-populate for response
    const populated = await Outward.findById(newOutward._id).populate('inwardId', 'inwardDate totalWeight remainingWeight remainingQuantity');
    res.status(201).json(populated.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create outward' });
  }
});

// PUT /api/outward/:id
router.put('/:id', async (req, res) => {
  try {
    const originalOutward = await Outward.findById(req.params.id);
    if (!originalOutward) {
      return res.status(404).json({ error: 'Outward not found' });
    }

    const oldInwardId = originalOutward.inwardId;
    
    const updatedOutward = await Outward.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // If inwardId changed, update both. Otherwise update one.
    await updateInwardInventory(updatedOutward.inwardId);
    if (oldInwardId.toString() !== updatedOutward.inwardId.toString()) {
      await updateInwardInventory(oldInwardId);
    }

    const populated = await Outward.findById(updatedOutward._id).populate('inwardId', 'inwardDate totalWeight remainingWeight remainingQuantity');
    res.json(populated.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update outward' });
  }
});

// DELETE /api/outward/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedOutward = await Outward.findByIdAndDelete(req.params.id);
    if (!deletedOutward) {
      return res.status(404).json({ error: 'Outward not found' });
    }

    // After deletion, restore the Inward remaining weight
    await updateInwardInventory(deletedOutward.inwardId);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete outward' });
  }
});

// POST /api/outward/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    
    // Find all affected outwards to know which inwardIds to recalculate
    const affectedOutwards = await Outward.find({ _id: { $in: ids } });
    const inwardIds = [...new Set(affectedOutwards.map(o => o.inwardId.toString()))];
    
    // Delete the outwards
    const result = await Outward.deleteMany({ _id: { $in: ids } });
    
    // Recalculate remaining weight for each affected inward
    for (const inwardId of inwardIds) {
      await updateInwardInventory(inwardId);
    }
    
    res.json({ message: `${result.deletedCount} outwards deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
