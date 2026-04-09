const Log = require('../models/Log');

const auditLogger = (action, type) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Only log successful operations by default or specific ones
                const logData = {
                    user: req.user ? req.user._id : null,
                    userName: req.user ? req.user.name : 'System/Guest',
                    action: action,
                    type: type,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        body: req.method !== 'GET' ? req.body : null,
                        query: req.query
                    }
                };

                Log.create(logData).catch(err => console.error('Audit Logging Error:', err));
            }
            originalSend.call(this, data);
        };
        next();
    };
};

module.exports = { auditLogger };
