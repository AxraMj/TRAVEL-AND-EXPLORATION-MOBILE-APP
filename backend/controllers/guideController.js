const Guide = require('../models/Guide');
const User = require('../models/User');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

exports.createGuide = async (req, res) => {
  try {
    const { location, locationNote, coordinates } = req.body;
    const userId = req.user.userId;

    // Get user data
    const user = await User.findById(userId).select('username profileImage');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const guide = new Guide({
      userId,
      location,
      locationNote,
      coordinates: coordinates || null, // Store coordinates if provided
      likes: 0,
      dislikes: 0
    });

    await guide.save();

    // Format response with user information
    const formattedGuide = {
      _id: guide._id,
      location: guide.location,
      locationNote: guide.locationNote,
      coordinates: guide.coordinates,
      username: user.username,
      userImage: user.profileImage,
      likes: guide.likes,
      dislikes: guide.dislikes,
      hasLiked: false,
      hasDisliked: false,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt
    };

    res.status(201).json(formattedGuide);
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({ message: 'Failed to create guide' });
  }
};

exports.getAllGuides = async (req, res) => {
  try {
    const guides = await Guide.find()
      .populate('userId', 'username profileImage fullName')
      .sort({ createdAt: -1 });

    // Format response
    const formattedGuides = guides.map(guide => ({
      _id: guide._id,
      text: guide.text,
      location: guide.location,
      locationNote: guide.locationNote,
      username: guide.userId.username,
      userImage: guide.userId.profileImage,
      likes: guide.likes,
      dislikes: guide.dislikes,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt
    }));

    res.json(formattedGuides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ message: 'Failed to fetch guides' });
  }
};

exports.getUserGuides = async (req, res) => {
  try {
    const { userId } = req.params;
    const guides = await Guide.find({ userId })
      .populate('userId', 'username profileImage fullName')
      .populate('likedBy', 'username profileImage')
      .populate('dislikedBy', 'username profileImage')
      .sort({ createdAt: -1 });

    // Format response with user information
    const formattedGuides = guides.map(guide => ({
      _id: guide._id,
      text: guide.text,
      location: guide.location,
      locationNote: guide.locationNote,
      username: guide.userId.username,
      userImage: guide.userId.profileImage,
      likes: guide.likes,
      dislikes: guide.dislikes,
      hasLiked: req.user ? guide.likedBy.some(user => user._id.toString() === req.user.userId) : false,
      hasDisliked: req.user ? guide.dislikedBy.some(user => user._id.toString() === req.user.userId) : false,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt
    }));

    res.json(formattedGuides);
  } catch (error) {
    console.error('Get user guides error:', error);
    res.status(500).json({ message: 'Failed to fetch user guides' });
  }
};

exports.likeGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const userId = req.user.userId;

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const hasLiked = guide.likedBy.includes(userId);
    const hasDisliked = guide.dislikedBy.includes(userId);

    if (hasLiked) {
      // Unlike
      guide.likedBy.pull(userId);
      guide.likes--;
    } else {
      // Like and remove dislike if exists
      guide.likedBy.push(userId);
      guide.likes++;
      if (hasDisliked) {
        guide.dislikedBy.pull(userId);
        guide.dislikes--;
      }
    }

    await guide.save();
    res.json(guide);
  } catch (error) {
    console.error('Like guide error:', error);
    res.status(500).json({ message: 'Failed to like guide' });
  }
};

exports.dislikeGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const userId = req.user.userId;

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const hasDisliked = guide.dislikedBy.includes(userId);
    const hasLiked = guide.likedBy.includes(userId);

    if (hasDisliked) {
      // Remove dislike
      guide.dislikedBy.pull(userId);
      guide.dislikes--;
    } else {
      // Dislike and remove like if exists
      guide.dislikedBy.push(userId);
      guide.dislikes++;
      if (hasLiked) {
        guide.likedBy.pull(userId);
        guide.likes--;
      }
    }

    await guide.save();
    res.json(guide);
  } catch (error) {
    console.error('Dislike guide error:', error);
    res.status(500).json({ message: 'Failed to dislike guide' });
  }
};

exports.deleteGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    
    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    if (guide.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this guide' });
    }

    await Guide.findByIdAndDelete(guideId);

    // Update user's profile stats
    await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      { $inc: { 'stats.totalGuides': -1 } }
    );

    res.json({ message: 'Guide deleted successfully', deletedGuideId: guideId });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({ message: 'Failed to delete guide' });
  }
}; 