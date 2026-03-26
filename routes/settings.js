const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompanySettings = require('../models/CompanySettings');

// Configure multer for logo upload
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `company-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// GET /api/settings - Fetch company settings
router.get('/', async (req, res) => {
  try {
    const settings = await CompanySettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/settings - Update company settings
router.put('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/settings/logo - Upload company logo
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let settings = await CompanySettings.getSettings();

    // Delete old logo file if it exists
    if (settings.logoUrl) {
      const oldFileName = settings.logoUrl.split('/uploads/').pop();
      if (oldFileName) {
        const oldPath = path.join(uploadsDir, oldFileName);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Save new logo URL
    settings.logoUrl = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({ logoUrl: settings.logoUrl, message: 'Logo uploaded successfully' });
  } catch (error) {
    console.error('Failed to upload logo:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/settings/logo - Remove company logo
router.delete('/logo', async (req, res) => {
  try {
    let settings = await CompanySettings.getSettings();

    if (settings.logoUrl) {
      const fileName = settings.logoUrl.split('/uploads/').pop();
      if (fileName) {
        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      settings.logoUrl = '';
      await settings.save();
    }

    res.json({ message: 'Logo removed successfully' });
  } catch (error) {
    console.error('Failed to remove logo:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/settings/signature - Upload company signature/stamp
router.post('/signature', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let settings = await CompanySettings.getSettings();

    // Delete old signature file if it exists
    if (settings.signatureUrl) {
      const oldFileName = settings.signatureUrl.split('/uploads/').pop();
      if (oldFileName) {
        const oldPath = path.join(uploadsDir, oldFileName);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // Save new signature URL
    settings.signatureUrl = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({ signatureUrl: settings.signatureUrl, message: 'Signature uploaded successfully' });
  } catch (error) {
    console.error('Failed to upload signature:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/settings/signature - Remove company signature/stamp
router.delete('/signature', async (req, res) => {
  try {
    let settings = await CompanySettings.getSettings();

    if (settings.signatureUrl) {
      const fileName = settings.signatureUrl.split('/uploads/').pop();
      if (fileName) {
        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      settings.signatureUrl = '';
      await settings.save();
    }

    res.json({ message: 'Signature removed successfully' });
  } catch (error) {
    console.error('Failed to remove signature:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
