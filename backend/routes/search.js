const router = require('express').Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

// All search routes require authentication
router.use(auth);

// Search all (users, posts, locations)
router.get('/', searchController.searchAll);

// Search users only
router.get('/users', searchController.searchUsers);

// Search locations only
router.get('/locations', searchController.searchLocations);

module.exports = router; 