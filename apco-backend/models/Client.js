const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    eventDate: { type: Date },
    notes: { type: String },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
