const express = require('express');
const router = express.Router();
const {registerUser, loginUser , verifyOtp} = require('../controllers/authController');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// OTP verification route
router.post('/verify-otp', verifyOtp);

module.exports = router;