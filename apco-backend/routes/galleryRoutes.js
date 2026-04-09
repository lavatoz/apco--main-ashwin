const express = require('express');
const router = express.Router();
const { 
    uploadImages, 
    getGallery, 
    selectImages 
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/gallery/upload/:clientId
router.post('/upload/:clientId', protect, upload.array('images'), uploadImages);

// @route   GET /api/gallery/:clientId
router.get('/:clientId', protect, getGallery);

// @route   POST /api/gallery/select/:clientId
router.post('/select/:clientId', protect, selectImages);

module.exports = router;
