const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client' },
    project: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    type: { type: String, enum: ['invoice', 'quotation'], default: 'invoice' },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
