const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyMFA } = require('../controllers/authController');

router.post('/signup', registerUser);
router.post('/register', registerUser); // legacy/alt
router.post('/login', loginUser);
router.post('/mfa-verify', verifyMFA);

module.exports = router;
