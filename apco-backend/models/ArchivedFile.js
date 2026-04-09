const mongoose = require('mongoose');

const archivedFileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    accessRoles: [{ type: String, enum: ['admin', 'staff', 'client'] }],
    tracking: [{
        action: { type: String, enum: ['view', 'download'] },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String }
    }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ArchivedFile', archivedFileSchema);
