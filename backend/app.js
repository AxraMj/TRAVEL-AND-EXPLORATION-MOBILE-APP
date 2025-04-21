const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { AppError } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guide');
const postRoutes = require('./routes/post');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notification');
const searchRoutes = require('./routes/search');
const auth = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guides', auth, guideRoutes);
app.use('/api/posts', auth, postRoutes);
app.use('/api/profiles', auth, profileRoutes);
app.use('/api/notifications', auth, notificationRoutes);
app.use('/api/search', searchRoutes);

// Handle undefined Routes
app.use('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Error handling
app.use(errorHandler);

// Unhandled Rejection Handler
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = app; 