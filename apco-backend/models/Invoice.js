const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    clientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client' },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
