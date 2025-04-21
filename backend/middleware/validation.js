const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

exports.validateRegistration = (req, res, next) => {
  const { fullName, email, password, accountType } = req.body;

  if (!fullName || !email || !password || !accountType) {
    return next(new AppError(400, 'Please provide all required fields'));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError(400, 'Please provide a valid email address'));
  }

  // Password validation
  if (password.length < 6) {
    return next(new AppError(400, 'Password must be at least 6 characters long'));
  }

  // Account type validation
  const validAccountTypes = ['explorer', 'creator'];
  if (!validAccountTypes.includes(accountType)) {
    return next(new AppError(400, 'Invalid account type'));
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, 'Please provide both email and password'));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError(400, 'Please provide a valid email address'));
  }

  next();
}; 