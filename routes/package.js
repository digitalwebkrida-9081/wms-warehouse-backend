const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

// GET /api/package
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = { type: regex };
    }

    const total = await Package.countDocuments(query);
    const start = (page - 1) * pageSize;

    const packages = await Package.find(query)
      .sort({ type: 1 })
      .skip(start)
      .limit(pageSize);

    res.json({
      data: packages,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/package
router.post('/', async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// PUT /api/package/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json(updatedPackage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// DELETE /api/package/:id
router.delete('/:id', async (req, res) => {
  try {
    // In a real application, check for references (e.g. inwards/products) here.
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// POST /api/package/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await Package.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} packages deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
