const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ArchivedFile = require('../models/ArchivedFile');
const { protect, authorize } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditMiddleware');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/archive/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// @desc    Upload archive file
// @route   POST /api/files/upload
// @access  Private (Admin/Staff)
router.post('/upload', protect, authorize('admin', 'staff'), upload.single('file'), auditLogger('Archive file upload', 'FileAction'), async (req, res) => {
    try {
        const { client, project, accessRoles } = req.body;
        
        const file = await ArchivedFile.create({
            name: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploader: req.user._id,
            client: client || null,
            project: project || null,
            accessRoles: accessRoles ? JSON.parse(accessRoles) : ['admin', 'staff']
        });

        res.status(201).json(file);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get all files for context
// @route   GET /api/files
router.get('/', protect, async (req, res) => {
     try {
         // Clients can see files where they have access
         let filter = {};
         if (req.user.role === 'client') {
             // In real app, find client linked to user
             filter = { accessRoles: 'client' };
         }
         const files = await ArchivedFile.find(filter).populate('uploader', 'name').sort({ createdAt: -1 });
         res.json(files);
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
});

// @desc    Download file and track
// @route   GET /api/files/download/:id
router.get('/download/:id', protect, async (req, res) => {
    try {
        const file = await ArchivedFile.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Logic check: does user role have access?
        if (!file.accessRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // TRACK DOWNLOAD
        file.tracking.push({
            action: 'download',
            user: req.user._id,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
        await file.save();

        res.download(path.resolve(file.path), file.name);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
