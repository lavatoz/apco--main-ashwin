const User = require('../models/User');
const Log = require('../models/Log');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({ name, email, password, role: (role || 'admin').toLowerCase() });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id),
                user: {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password, role } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            await Log.create({ action: 'Failed login attempt: User not found', type: 'FailedLogin', details: { email }, ipAddress });
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            await Log.create({ user: user._id, action: 'Login blocked: Account locked', type: 'FailedLogin', ipAddress });
            return res.status(403).json({ message: "Account locked due to multiple failures. Try again later." });
        }

        if (await user.matchPassword(password)) {
            const requestedRole = (role || '').toLowerCase();
            
            if (user.role !== requestedRole) {
                 await Log.create({ user: user._id, action: 'Failed login attempt: Role mismatch', type: 'FailedLogin', ipAddress });
                 return res.status(401).json({ message: "Role mismatch. Access denied." });
            }

            // SUCCESS!
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;
            user.lastLogin = Date.now();
            
            // Check for new IP (Suspicious detection)
            // Implementation detail: we could store allowed IPs in user model and compare
            // For now, we log the login event
            await Log.create({ user: user._id, userName: user.name, action: 'Successful login', type: 'Login', ipAddress });

            // MFA Check
            if (user.mfaEnabled) {
                // Generate simple 6-digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                user.otp = otp;
                user.otpExpires = Date.now() + (10 * 60 * 1000); // 10 mins
                await user.save();

                // In production, send email/SMS. For now, log it clearly so user can test
                console.log('--- OTP FOR MFA ---', otp);
                
                return res.json({ 
                    requiresMFA: true, 
                    email: user.email,
                    message: "Verification code sent to your registered device." 
                });
            }

            await user.save();

            res.json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    name: user.name,
                    role: user.role
                }
            });
        } else {
            // FAILED PASSWORD
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = Date.now() + (30 * 60 * 1000); // Lock for 30 mins
                await Log.create({ user: user._id, action: 'Account locked: Too many failures', type: 'FailedLogin', ipAddress });
            } else {
                 await Log.create({ user: user._id, action: 'Failed login attempt: Invalid password', type: 'FailedLogin', ipAddress });
            }
            await user.save();
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyMFA = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(401).json({ message: "Invalid or expired verification code." });
        }

        // Success - Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        await Log.create({ 
               user: user._id, 
               userName: user.name, 
               action: 'Successful MFA verification', 
               type: 'Login', 
               ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress 
        });

        res.json({
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { registerUser, loginUser, verifyMFA };
