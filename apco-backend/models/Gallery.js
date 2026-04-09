const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    images: [{
        path: String,
        name: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    selectedImages: [{
        type: String // We'll store image paths or IDs string here
    }],
    status: {
        type: String,
        enum: ['pending', 'uploaded', 'selected', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Gallery', gallerySchema);
