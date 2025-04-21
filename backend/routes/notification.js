const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All notification routes require authentication
router.use(auth);

// Get user's notifications
router.get('/', notificationController.getNotifications);

// Mark a notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router; 