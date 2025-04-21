const logger = require('../config/logger');

// Custom AppError class for operational errors
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code is set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log detailed error for debugging
  logger.error(`Server error: ${err.stack}`);

  // Handle specific error types with user-friendly messages
  let errorResponse;

  if (err.isOperational) {
    // For operational errors, use the message as-is
    errorResponse = {
      status: err.status,
      message: err.message
    };
  } else if (err.name === 'CastError') {
    // MongoDB invalid ObjectId
    errorResponse = {
      status: 'fail',
      message: 'Invalid resource identifier'
    };
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    errorResponse = {
      status: 'fail',
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use`
    };
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(err.errors).map(val => val.message);
    errorResponse = {
      status: 'fail',
      message: errors.join('. ')
    };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT validation error
    errorResponse = {
      status: 'fail',
      message: 'Invalid authentication token. Please log in again.'
    };
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    errorResponse = {
      status: 'fail',
      message: 'Your login session has expired. Please log in again.'
    };
  } else {
    // For non-operational errors, hide implementation details in production
    errorResponse = {
      status: 'error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong. Please try again later.' 
        : err.message || 'Unknown error occurred'
    };
  }

  // Send the error response
  res.status(err.statusCode).json(errorResponse);
};

module.exports = errorHandler;
module.exports.AppError = AppError; 