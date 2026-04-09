const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client' },
    description: { type: String },
    status: { 
        type: String, 
        enum: ['booked', 'event_completed', 'photo_selection', 'post_production', 'album_printing'], 
        default: 'booked' 
    },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' },
    allowedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
    images: [{
        url: { type: String, required: true },
        isSelected: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
