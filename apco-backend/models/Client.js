const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    eventDate: { type: Date },
    notes: { type: String },
    eventType: { type: String },
    status: { type: String, enum: ['pending', 'uploaded', 'selected', 'completed'], default: 'pending' },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
