const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const auth = require('../middleware/auth');

// Register
router.post('/register', validateRegistration, authController.register);

// Login
router.post('/login', validateLogin, authController.login);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Reset password route (no auth required)
router.post('/reset-password', authController.resetPassword);

module.exports = router; 