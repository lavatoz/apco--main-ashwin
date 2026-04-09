const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all audit logs
// @route   GET /api/logs
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
