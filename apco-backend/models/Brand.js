const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Brand', brandSchema);
