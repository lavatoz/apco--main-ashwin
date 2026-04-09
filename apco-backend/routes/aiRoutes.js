const express = require('express');
const router = express.Router();
const { findMyPhotos } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Set up temporary storage for selfies
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = os.tmpdir();
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/ai/find-photos/:clientId
router.post('/find-photos/:clientId', protect, upload.single('selfie'), findMyPhotos);

module.exports = router;
