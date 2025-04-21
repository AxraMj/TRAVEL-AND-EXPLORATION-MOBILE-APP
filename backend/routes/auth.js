const router = require('express').Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Register
router.post('/register', validateRegistration, authController.register);

// Login
router.post('/login', validateLogin, authController.login);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Reset password route (no auth required)
router.post('/reset-password', authController.resetPassword);

module.exports = router; 