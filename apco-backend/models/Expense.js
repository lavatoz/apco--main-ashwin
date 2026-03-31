const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
