const router = require('express').Router();
const guideController = require('../controllers/guideController');
const auth = require('../middleware/auth');

// Create guide (requires auth)
router.post('/', auth, guideController.createGuide);

// Get all guides
router.get('/', guideController.getAllGuides);

// Get guides by user ID
router.get('/user/:userId', guideController.getUserGuides);

// Like guide (requires auth)
router.post('/:guideId/like', auth, guideController.likeGuide);

// Dislike guide (requires auth)
router.post('/:guideId/dislike', auth, guideController.dislikeGuide);

// Delete guide (requires auth)
router.delete('/:guideId', auth, guideController.deleteGuide);

module.exports = router; 