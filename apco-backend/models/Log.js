const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String }, // For logging even if user is deleted
    action: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['Login', 'Logout', 'FailedLogin', 'ProjectUpdate', 'ClientUpdate', 'FileAction', 'FinanceUpdate', 'SystemUpdate'],
        required: true 
    },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema);
