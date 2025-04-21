const router = require('express').Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

// Public routes (no auth required)
router.get('/user/:userId', postController.getUserPosts);

// Protected routes (auth required)
router.use(auth);

// Get posts
router.get('/', postController.getAllPosts);
router.get('/following', postController.getFollowedPosts);
router.get('/saved', postController.getSavedPosts);

// Create a new post
router.post('/', postController.createPost);

// Update an existing post (owner only)
router.put('/:postId', postController.updatePost);

// Like/unlike a post
router.post('/:postId/like', postController.likePost);

// Save/unsave a post
router.post('/:postId/save', postController.savePost);

// Comment operations
router.post('/:postId/comment', postController.addComment);
router.delete('/:postId/comment/:commentId', postController.deleteComment);

// Delete a post (owner only)
router.delete('/:postId', postController.deletePost);

module.exports = router; 