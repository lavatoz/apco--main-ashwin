const Gallery = require('../models/Gallery');
const Client = require('../models/Client');
const path = require('path');

// @desc    Upload images for a client gallery
// @route   POST /api/gallery/upload/:clientId
// @access  Private (Admin/Staff)
const uploadImages = async (req, res) => {
    try {
        const { clientId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        let gallery = await Gallery.findOne({ clientId });

        if (!gallery) {
            gallery = new Gallery({
                clientId,
                images: [],
                status: 'uploaded'
            });
        } else {
            gallery.status = 'uploaded';
        }

        const newImages = files.map(file => ({
            path: `uploads/${file.filename}`,
            name: file.originalname,
            uploadedAt: new Date()
        }));

        gallery.images.push(...newImages);
        await gallery.save();

        // Update Client status
        await Client.findByIdAndUpdate(clientId, { status: 'uploaded' });

        res.status(200).json({
            message: 'Images uploaded successfully',
            gallery
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get gallery for a client
// @route   GET /api/gallery/:clientId
// @access  Private
const getGallery = async (req, res) => {
    try {
        const { clientId } = req.params;

        // Security Check: Client can only see their own gallery
        if (req.user.role === 'client' && req.user.clientId?.toString() !== clientId) {
            // We need to verify if the user object has a clientId or if we check based on user mapping.
            // Simplified for now: assuming req.user.userId matches something in the client record.
            // A more robust check would involve checking the Client model's userId field.
            const client = await Client.findById(clientId);
            if (client && client.userId?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this gallery' });
            }
        }

        const gallery = await Gallery.findOne({ clientId });

        if (!gallery) {
            return res.status(404).json({ message: 'Gallery not found' });
        }

        res.status(200).json(gallery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Select common/final images
// @route   POST /api/gallery/select/:clientId
// @access  Private (Client)
const selectImages = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { selectedImages } = req.body;

        const gallery = await Gallery.findOne({ clientId });

        if (!gallery) {
            return res.status(404).json({ message: 'Gallery not found' });
        }

        gallery.selectedImages = selectedImages;
        gallery.status = 'selected';
        await gallery.save();

        // Update Client status
        await Client.findByIdAndUpdate(clientId, { status: 'selected' });

        res.status(200).json({
            message: 'Selections saved successfully',
            gallery
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadImages,
    getGallery,
    selectImages
};
